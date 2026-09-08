import type { ThemePlugin } from "@/plugins/core/types";

/** 社论主题：双线分隔、姓名更大，偏杂志排版。 */
export const editorialTheme: ThemePlugin = {
  id: "editorial",
  kind: "theme",
  labelKey: "theme.editorial",
  version: 1,
  cssVars: {
    "--rs-section-rule": "3px double var(--rs-accent)",
    "--rs-name-transform": "none",
    "--rs-section-spacing": "0.02em",
    "--rs-name-size": "2.15em",
  },
  preset: { layout: "sidebar", accent: "#7C3AED", tone: "soft", density: 0.5 },
};
