import visit from "unist-util-visit";
import Op from "quill-delta/dist/Op";

export default function markdownToDelta(tree: any): Op[] {
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
      visit(child, "paragraph", paragraphVisitor);

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

  const paragraphVisitor = (node: any) => {
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
      }
      return op;
    };

    const visitChildren = (node: any, op: Op): Op[] => {
      const { children } = node;
      const ops = children.map((child: any) => visitNode(child, op));
      return ops.length === 1 ? ops[0] : ops;
    };

    for (const child of children) {
      const localOps = visitNode(child, {});

      if (localOps instanceof Array) {
        flatten(localOps).forEach(op => ops.push(op));
      } else {
        ops.push(localOps);
      }
    }
  };

  for (let idx = 0; idx < tree.children.length; idx++) {
    const child = tree.children[idx];
    const nextType: string =
      idx + 1 < tree.children.length ? tree.children[idx + 1].type : "lastOne";

    if (child.type === "paragraph") {
      paragraphVisitor(child);

      if (nextType === "paragraph") {
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
    }
  }

  return ops;
}
