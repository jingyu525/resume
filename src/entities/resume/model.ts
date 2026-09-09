import type { Locale } from "@/entities/locale";

/** 多语言字段：按语言存储，缺语言走回退链（见 shared/lib/localized）。 */
export type Localized<T> = Partial<Record<Locale, T>>;

/** 富文本以清洗后的安全 HTML 字符串存储（仅允许 bold / 强调色 / 段落等语义标签）。 */
export type RichText = string;

export type BuiltinSectionKind = "summary" | "experience" | "project" | "education" | "skills";

/**
 * 章节 kind：内置五类保留字面量补全，同时开放给章节类型插件扩展（M2）。
 * 插件章节与内置章节共存，migrate 不得再因 kind 未知而丢弃数据（FR-9）。
 */
export type SectionKind = BuiltinSectionKind | (string & {});

/** 内置章节 kind 清单：注册表未就绪时（如单测未 bootstrap）的兜底，绝不为空。 */
export const BUILTIN_SECTION_KINDS: BuiltinSectionKind[] = [
  "summary",
  "experience",
  "project",
  "education",
  "skills",
];

export interface ResumeItem {
  id: string;
  /** 主标题，如公司 / 项目名 / 学校 */
  title: Localized<string>;
  /** 副标题，如职位 / 角色 */
  subtitle: Localized<string>;
  /** 起始时间 'YYYY-MM' 或空 */
  startDate: string;
  /** 结束时间 'YYYY-MM' 或空 */
  endDate: string;
  /** 是否"至今" */
  current: boolean;
  /** 是否在条目中显示日期字段；undefined 视为 true（兼容旧数据 / 默认显示） */
  showDate?: boolean;
  /** 描述（富文本） */
  description: Localized<RichText>;
  /** 条目级插件扩展字段（v2 起，未安装插件时数据仍保留） */
  fields?: Record<string, unknown>;
}

export interface SkillGroup {
  id: string;
  /** 分类名 */
  name: Localized<string>;
  /** 条目列表（换行分隔） */
  items: Localized<string>;
  /** 分组级插件扩展字段（v2 起） */
  fields?: Record<string, unknown>;
}

export interface ResumeSection {
  id: string;
  kind: SectionKind;
  /** 章节标题（多语言） */
  title: Localized<string>;
  visible: boolean;
  /** 排序权重，越小越靠前 */
  order: number;
  items: ResumeItem[];
  /** 仅 skills 章节使用 */
  groups: SkillGroup[];
  /** 章节级插件扩展字段（v2 起，未安装插件时数据仍保留） */
  fields?: Record<string, unknown>;
}

export interface BasicInfo {
  name: Localized<string>;
  title: Localized<string>;
  phone: string;
  email: string;
  city: Localized<string>;
  wechat: string;
  website: string;
}

export interface ResumeData {
  basics: BasicInfo;
  /** 有序章节列表 */
  sections: ResumeSection[];
}

// SECTION_KIND_LABEL 已删除：无引用，且开放联合后 Record<SectionKind, string> 不再成立。
