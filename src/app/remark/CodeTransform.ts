import { visit } from "unist-util-visit";
import type * as mdast from "mdast";
import type * as unified from "unified";

const CodeTransform: unified.Plugin<[], mdast.Root> = () => {
  return (tree, file) => {
    visit(tree, "code", (node, index, parent) => {
      const metaString = `${node.lang ?? ""} ${node.meta ?? ""}`.trim();
      if (!metaString) return;
      const [title] = metaString.match(/(?<=title=("|'))(.*?)(?=("|'))/) ?? [
        "",
      ];
      if (!title && metaString.includes("title=")) {
        file.message("Invalid title", node, "remark-code-title");
        return;
      }
      if (!title) return;
      // @ts-ignore
      //node.data = title;
      node.data = { hProperties: { codetitle: [title] } };
      return index ? index + 2 : 0;
    });
  };
};
export default CodeTransform;
