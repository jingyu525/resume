import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/entities/locale";
import type { Localized, ResumeData, ResumeItem, ResumeSection } from "@/entities/resume/model";
import type { Block } from "@/shared/types/block";
import type { PersistedState } from "@/entities/resume/persist";
import type { AppearancePref, ThemePreset } from "@/entities/appearance/model";

/**
 * 插件契约总览（规则 C 组校验的正是这些字段）。
 *
 * 分层约束：本文件位于 plugins/core，只可依赖 shared / entities（规则 A2）。
 * 因此 Block 定义在 shared/types/block.ts、PersistedState 在 entities/resume/persist.ts。
 */

export type PluginKind = "storage" | "exporter" | "locale-pack" | "basics-field" | "section-type" | "theme";

/** 插件自带文案：键须为 plugin.<id>. 前缀（规则 C3）。 */
export type LocaleDictMap = Partial<Record<Locale, Record<string, string>>>;

export interface PluginBase {
  /** 全局唯一，kebab-case（规则 C1） */
  id: string;
  /** 须与所在目录 category 一致（规则 A3） */
  kind: PluginKind;
  /** 界面显示名，必须进五语字典（规则 C2） */
  labelKey: string;
  version: number;
  /** 缺省 true；远程/实验能力必须显式 false（规则 C6） */
  defaultEnabled?: boolean;
  dict?: LocaleDictMap;
}

/** 字段类型白名单（规则 C5 校验）。 */
export type FieldType =
  | "text"
  | "richtext"
  | "date"
  | "month-range"
  | "switch"
  | "url"
  | "tags"
  | "number";

export interface FieldSchema {
  key: string;
  type: FieldType;
  labelKey: string;
  /** 多语言字段（随界面语言切换） */
  localized?: boolean;
  placeholderKey?: string;
  /** 映射到内置字段（M2 章节插件用，如 title / subtitle / description） */
  builtin?: "title" | "subtitle" | "description" | "startDate" | "endDate" | "current";
}

export interface BlockContext {
  locale: Locale;
  layout: "single" | "sidebar";
}

export interface SectionEditorProps {
  section: ResumeSection;
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * 预览块的条目 / 分组级编辑回调。
 *
 * renderBlock **未收到 editors 时应降级为只读渲染**（如落地页的示例简历），
 * 绝不直接读 store——否则用户在示例里点一下就会写进自己的真实简历。
 */
export interface SectionBlockEditors {
  updateItemLocalized: (
    sectionId: string,
    itemId: string,
    field: "title" | "subtitle",
    locale: Locale,
    value: string,
  ) => void;
  updateItemDesc: (sectionId: string, itemId: string, locale: Locale, html: string) => void;
  updateItemDate: (
    sectionId: string,
    itemId: string,
    patch: { startDate?: string; endDate?: string; current?: boolean; showDate?: boolean },
  ) => void;
  setItemShowDate: (sectionId: string, itemId: string, show: boolean) => void;
  updateGroupName: (sectionId: string, groupId: string, locale: Locale, value: string) => void;
  updateGroupItems: (sectionId: string, groupId: string, locale: Locale, value: string) => void;
}

/** 章节类型插件：字段、渲染、编辑、分页切块全部自带（M2 落地） */
export interface SectionTypePlugin extends PluginBase {
  kind: "section-type";
  /**
   * 本插件处理的章节 kind，对应 ResumeSection.kind。
   * 内置为 summary / experience / project / education / skills —— 沿用这些值，
   * 旧数据与备份里的 kind 才不需要任何映射（FR-9 升级不丢数据）。
   */
  sectionKind: string;
  /** 默认章节标题，五语齐全（规则 C4） */
  defaultTitle: Localized<string>;
  fields: FieldSchema[];
  /** 侧栏版式下的归属 */
  placement: "auto" | "sidebar" | "main";
  /** 产出可测高的原子块；块容器必须保持 flow-root（规则 G2） */
  toBlocks(section: ResumeSection, ctx: BlockContext): Block[];
  /** editors 缺省即只读（落地页示例）；编辑器页由 BlockView 注入 */
  renderBlock(block: Block, locale: Locale, editors?: SectionBlockEditors): ReactNode;
  renderEditor(props: SectionEditorProps): ReactNode;
  createItem?(): ResumeItem;
  createSample?(): ResumeSection;
}

/** 基本信息字段插件：中国微信 / 欧美 LinkedIn 等地域差异靠它扩展 */
export interface BasicsFieldPlugin extends PluginBase {
  kind: "basics-field";
  /** 对应 BasicInfo 的键 */
  fieldKey: string;
  inputType: "text" | "tel" | "email" | "url";
  /** 联系方式展示顺序 */
  order: number;
  localized: boolean;
  icon?: LucideIcon;
}

export interface ExportContext {
  resume: ResumeData;
  appearance: AppearancePref;
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export interface ExporterPlugin extends PluginBase {
  kind: "exporter";
  /** 默认导出（全局唯一，规则 C7） */
  default?: boolean;
  run(ctx: ExportContext): void | Promise<void>;
}

export interface StorageCapabilities {
  remote: boolean;
  requiresAuth: boolean;
}

export interface StoragePlugin extends PluginBase {
  kind: "storage";
  capabilities: StorageCapabilities;
  load(): Promise<PersistedState | null>;
  /**
   * 同步读取快照。仅本地实现提供——store 初始化是同步的，
   * 远程存储（M5）只能走异步 load + hydrate，不能卡住首屏。
   */
  loadSync?(): PersistedState | null;
  /**
   * 写盘。**返回是否成功**，绝不吞掉失败。
   *
   * 静默失败等于骗人：调用方会认为已保存并清除「未保存」标记，
   * 退出拦截随之失效，用户直到下次打开才发现内容没了。
   */
  save(state: PersistedState): Promise<boolean>;
  clear(): Promise<void>;
  /** 引导用户配置（如填写仓库与 token） */
  configure?(): Promise<void>;
}

export interface LocalePackPlugin extends PluginBase {
  kind: "locale-pack";
  /** BCP-47 语言码（规则 C8） */
  code: Locale;
  /** 语言切换器显示名（字典里按界面语言翻译，labelKey 指向它） */
  label: string;
  fallback?: Locale;
  /** 内置五语：文案由核心 dictionaries.ts 提供，插件自身不带 dict */
  builtin?: boolean;
}

/**
 * 主题插件（M6）：只贡献 CSS 变量与可选字体栈，绝不写全局选择器，
 * 避免换主题污染整页（规则 AC：样式作用域）。预览/打印根节点会合并这些变量。
 */
export interface ThemePlugin extends PluginBase {
  kind: "theme";
  /** 主题级 CSS 变量（须以 --rs- 前缀，规则 AC 校验） */
  cssVars: Record<string, string>;
  /** 可选：覆盖 tone 决定的默认字体栈 */
  fonts?: { heading: string; body: string };
  /** 可选：选主题时一键套用的风格基线（版式/主色/气质/疏密） */
  preset?: ThemePreset;
}

export type Plugin =
  | SectionTypePlugin
  | BasicsFieldPlugin
  | ExporterPlugin
  | StoragePlugin
  | LocalePackPlugin
  | ThemePlugin;
