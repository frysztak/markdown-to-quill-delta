import visit from "unist-util-visit";
import Op from "quill-delta/dist/Op";

export default function markdownToDelta(tree: any): Op[] {
  const visitChildren = (node: any, op: Op): Op[] => {
    const { children } = node;
    const ops = children.map((child: any) => visitNode(child, op));
    return ops.length === 1 ? ops[0] : ops;
  };

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
    }

    return op;
  };

  const ops: Op[] = [];
  const flatten = (arr: any[]): any[] =>
    arr.reduce((flat, next) => flat.concat(next), []);
  const visitor = (node: any) => {
    const { children } = node;
    for (const child of children) {
      const localOps = visitNode(child, {});

      if (localOps instanceof Array) {
        flatten(localOps).forEach(op => ops.push(op));
      } else {
        ops.push(localOps);
      }
      //console.log(ops);
    }
  };

  //console.log(tree);
  visit(tree, "paragraph", visitor);

  return ops;
}
