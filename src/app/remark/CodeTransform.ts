import { visit } from "unist-util-visit";
import type * as mdast from "mdast";
import type * as unified from "unified";

const CodeTransform: unified.Plugin<[], mdast.Root> = () => {
  return (tree, file) => {
    visit(tree, "code", (node, index, parent) => {
      const metaString = `${node.lang ?? ""} ${node.meta ?? ""}`.trim();
      if (!metaString) return;
      const props = {  }
      const [col] = metaString.match(/(?<=col=("|'))(.*?)(?=("|'))/) ?? [
        "",
      ];
      if(col) {
        // @ts-ignore
        props.col = col;
      }
      
      const [title] = metaString.match(/(?<=title=("|'))(.*?)(?=("|'))/) ?? [
        "",
      ];
      if (!title && metaString.includes("title=")) {
        file.message("Invalid title", node, "remark-code-title");
        return;
      }
      if (!title) return;
      // @ts-ignore
      props.codetitle = title;
      node.data = { hProperties:  props };
      return index ? index + 2 : 0;
    });
  };
};
export default CodeTransform;
