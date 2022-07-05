// @ts-check

const plugin = (md) => {
  md.core.ruler.push("custom-markdown-it-plugin", (state) => {
    for (const token of state.tokens.filter(t => t.type === "inline")) {
      for (const child of token.children.filter(c => c.type === "text")) {
        child.content = child.content.trim();
      }
    }
  });
};

export default plugin;
