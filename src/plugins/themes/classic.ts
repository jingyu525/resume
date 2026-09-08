import type { ThemePlugin } from "@/plugins/core/types";

/** 经典主题：稳重，accent 实线分隔标题，姓名正常大小写。 */
export const classicTheme: ThemePlugin = {
  id: "classic",
  kind: "theme",
  labelKey: "theme.classic",
  version: 1,
  cssVars: {
    "--rs-section-rule": "1.5px solid var(--rs-accent)",
    "--rs-name-transform": "none",
    "--rs-section-spacing": "0.04em",
    "--rs-name-size": "1.9em",
  },
  preset: { layout: "single", accent: "#2563EB", tone: "formal", density: 0.5 },
};
