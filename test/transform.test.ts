import fs from "fs";
import path from "path";
import unified from "unified";
import markdown from "remark-parse";
import markdownToDelta from "../lib/markdownToDelta";

interface Test {
  name: string;
  delta: any;
  markdown: string;
}

describe("Remark-Delta Transformer", () => {
  const isDirectory = (name: string) => fs.lstatSync(name).isDirectory();

  const folderPath: string = __dirname;
  const directories = fs
    .readdirSync(folderPath)
    .map((fileName: string) => path.join(folderPath, fileName))
    .filter((fileName: string) => isDirectory(fileName));

  const tests: Test[] = [];

  for (const directory of directories) {
    const files = fs.readdirSync(directory);
    while (files.length !== 0) {
      const file = files[0];
      files.splice(0, 1);

      const baseFileName = file.replace(".md", "").replace(".json", "");
      let matchingFileName: string;
      if (file.endsWith(".md")) {
        matchingFileName = `${baseFileName}.json`;
      } else if (file.endsWith(".json")) {
        matchingFileName = `${baseFileName}.md`;
      } else {
        throw Error(
          `Illegal file: ${file}. Allowed file extensions are .md and .json`
        );
      }

      const matchingFileIdx = files.findIndex(f => f === matchingFileName);
      if (matchingFileIdx === -1) {
        throw Error(`No matching file found for ${file}`);
      }
      files.splice(matchingFileIdx, 1);

      const jsonFilePath = path.join(directory, `${baseFileName}.json`);
      const markdownFilePath = path.join(directory, `${baseFileName}.md`);

      tests.push({
        name: `${path.basename(directory)}/${baseFileName}`,
        delta: JSON.parse(fs.readFileSync(jsonFilePath, "utf-8")),
        markdown: fs.readFileSync(markdownFilePath, "utf-8")
      });
    }
  }

  for (const t of tests) {
    test(`Markdown to Delta: ${t.name}`, () => {
      const processor = unified().use(markdown);
      const ast = processor.parse(t.markdown);
      const ops = markdownToDelta(ast);
      expect(ops).toEqual(t.delta);
      //console.log(ops);
    });
  }
});
