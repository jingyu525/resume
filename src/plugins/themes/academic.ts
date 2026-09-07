import type { ThemePlugin } from "@/plugins/core/types";

/**
 * 示范主题插件：学术风。
 *
 * 证明「主题可插件安装」：用中性墨色双线、衬线姓名，独立于内置四主题。
 * 只贡献 CSS 变量、不写全局选择器（规则 AC），切换即生效、不污染整页。
 * 主题纯属视觉、无网络无副作用，因此与存储/语言包不同——默认即启用，用户可直接看到。
 */
export const academicTheme: ThemePlugin = {
  id: "academic",
  kind: "theme",
  labelKey: "theme.academic",
  version: 1,
  cssVars: {
    "--rs-section-rule": "2px solid #1f2937",
    "--rs-name-transform": "none",
    "--rs-section-spacing": "0.1em",
    "--rs-name-size": "2em",
  },
  fonts: {
    heading: "Georgia, 'Times New Roman', 'Songti SC', serif",
    body: "'Inter', 'PingFang SC', system-ui, sans-serif",
  },
};
