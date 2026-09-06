import type { Locale } from "@/entities/locale";

/** 多语言字段：按语言存储，缺语言走回退链（见 shared/lib/localized）。 */
export type Localized<T> = Partial<Record<Locale, T>>;

/** 富文本以清洗后的安全 HTML 字符串存储（仅允许 bold / 强调色 / 段落等语义标签）。 */
export type RichText = string;

export type SectionKind =
  | "summary"
  | "experience"
  | "project"
  | "education"
  | "skills";

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
  /** 描述（富文本） */
  description: Localized<RichText>;
}

export interface SkillGroup {
  id: string;
  /** 分类名 */
  name: Localized<string>;
  /** 条目列表（换行分隔） */
  items: Localized<string>;
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

export const SECTION_KIND_LABEL: Record<SectionKind, string> = {
  summary: "summary",
  experience: "experience",
  project: "project",
  education: "education",
  skills: "skills",
};
