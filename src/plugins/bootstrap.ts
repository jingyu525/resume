import type { Plugin } from "./core/types";
import { register } from "./core/registry";
import { zhPack } from "./locale-packs/zh";
import { enPack } from "./locale-packs/en";
import { jaPack } from "./locale-packs/ja";
import { dePack } from "./locale-packs/de";
import { koPack } from "./locale-packs/ko";
import { frPack } from "./locale-packs/fr";
import { phoneField } from "./basics-fields/phone";
import { emailField } from "./basics-fields/email";
import { cityField } from "./basics-fields/city";
import { wechatField } from "./basics-fields/wechat";
import { websiteField } from "./basics-fields/website";
import { pdfPrintExporter } from "./exporters/pdf-print";
import { markdownExporter } from "./exporters/markdown";
import { pdfDownloadExporter } from "./exporters/pdf-download";
import { localStoragePlugin } from "./storage/local";
import { summarySection } from "./section-types/summary";
import { experienceSection } from "./section-types/experience";
import { projectSection } from "./section-types/project";
import { educationSection } from "./section-types/education";
import { skillsSection } from "./section-types/skills";
import { certificationSection } from "./section-types/certification";
import { languagesSection } from "./section-types/languages";
import { classicTheme } from "./themes/classic";
import { modernTheme } from "./themes/modern";
import { editorialTheme } from "./themes/editorial";
import { minimalTheme } from "./themes/minimal";
import { academicTheme } from "./themes/academic";

/**
 * 内置插件清单（构建期内建，同步注册）。
 *
 * 放在 plugins 根级而非 core/：core 必须是纯内核（只依赖 shared/entities），
 * 一旦 core 反向 import 具体插件，内核就被业务实现污染了（规则 A2 强制）。
 *
 * 第三方插件要接入：在这里 import 并加入数组，或发 npm 包后由使用方在此注册。
 * 这是"构建期内建注册表"的代价与好处——没有远程加载，就没有供应链风险。
 */
export const BUILTIN_PLUGINS: Plugin[] = [
  // 章节类型：注册顺序即空白简历的默认章节顺序
  summarySection,
  experienceSection,
  projectSection,
  educationSection,
  skillsSection,
  certificationSection,
  languagesSection,
  // 主题：内置四主题 + 示范学术主题（默认禁用），M6 起经注册表切换
  classicTheme,
  modernTheme,
  editorialTheme,
  minimalTheme,
  academicTheme,
  // 语言包：内置五语，文案真源为核心 dictionaries.ts
  zhPack,
  enPack,
  jaPack,
  dePack,
  koPack,
  // 示范语言包：默认禁用，证明「语言可插件安装」（启用后界面切到法语，未译键回退英语）
  frPack,
  // 基本信息字段：联系方式可插拔（地域差异靠替换插件解决）
  phoneField,
  emailField,
  cityField,
  wechatField,
  websiteField,
  // 导出：打印为默认；Markdown / 直接下载 PDF 为 M4 示范导出器（证明导出器可插件安装）
  pdfPrintExporter,
  markdownExporter,
  pdfDownloadExporter,
  // 存储：本地优先定位下只内置本地存储。
  // 不内置任何远程存储插件：它既不是当前需求，也与"数据只留浏览器"的承诺直接冲突
  localStoragePlugin,
];

let booted = false;

/**
 * 注册全部内置插件。必须在应用入口最先执行：
 * store 初始化时就会读存储插件、migrate 时要用注册表判断未知 kind（绝不丢数据）。
 */
export function bootstrapPlugins(): void {
  if (booted) return;
  for (const plugin of BUILTIN_PLUGINS) register(plugin);
  booted = true;
}
