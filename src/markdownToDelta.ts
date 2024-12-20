import {visit} from 'unist-util-visit'
import Op from "quill-delta/dist/Op";
import {unified} from 'unified';
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

export default function markdownToDelta(md: string): Op[] {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree: any = processor.parse(md);

  const ops: Op[] = [];
  const addNewline = () => ops.push({ insert: "\n" });

  const flatten = (arr: any[]): any[] =>
    arr.reduce((flat, next) => flat.concat(next), []);

  const listVisitor = (node: any) => {
    if (node.ordered && node.start !== 1) {
      throw Error("Quill-Delta numbered lists must start from 1.");
    }

    visit(node, "listItem", listItemVisitor(node));
  };

  const listItemVisitor = (listNode: any) => (node: any) => {
    for (const child of node.children) {
      visit(child, "paragraph", paragraphVisitor());

      let listAttribute = "";
      if (listNode.ordered) {
        listAttribute = "ordered";
      } else if (node.checked) {
        listAttribute = "checked";
      } else if (node.checked === false) {
        listAttribute = "unchecked";
      } else {
        listAttribute = "bullet";
      }
      ops.push({ insert: "\n", attributes: { list: listAttribute } });
    }
  };

  const paragraphVisitor = (initialOp: Op = {}) => (node: any) => {
    const { children } = node;

    const visitNode = (node: any, op: Op): Op[] | Op => {
      if (node.type === "text") {
        op = { ...op, insert: node.value };
      } else if (node.type === "strong") {
        op = { ...op, attributes: { ...op.attributes, bold: true } };
        return visitChildren(node, op);
      } else if (node.type === "emphasis") {
        op = { ...op, attributes: { ...op.attributes, italic: true } };
        return visitChildren(node, op);
      } else if (node.type === "delete") {
        op = { ...op, attributes: { ...op.attributes, strike: true } };
        return visitChildren(node, op);
      } else if (node.type === "image") {
        op = { insert: { image: node.url } };
        if (node.alt) {
          op = { ...op, attributes: { alt: node.alt } };
        }
      } else if (node.type === "link") {
        const text = visitChildren(node, op);
        op = { ...text, attributes: { ...op.attributes, link: node.url } };
      } else if (node.type === "inlineCode") {
        op = {
          insert: node.value,
          attributes: { ...op.attributes, font: "monospace" }
        };
      } else {
        throw new Error(`Unsupported note type in paragraph: ${node.type}`);
      }
      return op;
    };

    const visitChildren = (node: any, op: Op): Op[] => {
      const { children } = node;
      const ops = children.map((child: any) => visitNode(child, op));
      return ops.length === 1 ? ops[0] : ops;
    };

    for (const child of children) {
      const localOps = visitNode(child, initialOp);

      if (localOps instanceof Array) {
        flatten(localOps).forEach(op => ops.push(op));
      } else {
        ops.push(localOps);
      }
    }
  };

  const headingVisitor = (node: any) => {
    const mapSize = (depth: number): string => {
      switch (depth) {
        case 1:
          return "huge";
        case 2:
          return "large";
        case 3:
          return "small";
        default:
          return "large";
      }
    };

    const size = mapSize(node.depth);
    paragraphVisitor({ attributes: { size: size } })(node);
  };

  for (let idx = 0; idx < tree.children.length; idx++) {
    const child = tree.children[idx];
    const nextType: string =
      idx + 1 < tree.children.length ? tree.children[idx + 1].type : "lastOne";

    if (child.type === "paragraph") {
      paragraphVisitor()(child);

      if (
        nextType === "paragraph" ||
        nextType === "code" ||
        nextType === "heading"
      ) {
        addNewline();
        addNewline();
      } else if (nextType === "lastOne" || nextType === "list") {
        addNewline();
      }
    } else if (child.type === "list") {
      listVisitor(child);
      if (nextType === "list") {
        addNewline();
      }
    } else if (child.type === "code") {
      ops.push({ insert: child.value });
      ops.push({ insert: "\n", attributes: { "code-block": true } });

      if (nextType === "paragraph" || nextType === "lastOne") {
        addNewline();
      }
    } else if (child.type === "heading") {
      headingVisitor(child);
      addNewline();
    } else {
      throw new Error(`Unsupported child type: ${child.type}`);
    }
  }

  return ops;
}
