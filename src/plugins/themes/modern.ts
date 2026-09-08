import type { ThemePlugin } from "@/plugins/core/types";

/** 现代主题：姓名大写、加粗分隔线、字距更开，强调结构感。 */
export const modernTheme: ThemePlugin = {
  id: "modern",
  kind: "theme",
  labelKey: "theme.modern",
  version: 1,
  cssVars: {
    "--rs-section-rule": "2px solid var(--rs-accent)",
    "--rs-name-transform": "uppercase",
    "--rs-section-spacing": "0.08em",
    "--rs-name-size": "1.9em",
  },
  preset: { layout: "single", accent: "#0EA5E9", tone: "lively", density: 0.42 },
};
