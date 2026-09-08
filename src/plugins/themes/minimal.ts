import type { ThemePlugin } from "@/plugins/core/types";

/** 极简主题：发丝级中性分隔线，留白克制，弱化装饰。 */
export const minimalTheme: ThemePlugin = {
  id: "minimal",
  kind: "theme",
  labelKey: "theme.minimal",
  version: 1,
  cssVars: {
    "--rs-section-rule": "1px solid #cbd5e1",
    "--rs-name-transform": "none",
    "--rs-section-spacing": "0.06em",
    "--rs-name-size": "1.85em",
  },
  preset: { layout: "single", accent: "#0F172A", tone: "formal", density: 0.62 },
};
