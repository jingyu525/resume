import type { Locale } from "@/entities/locale";
import type { ResumeData, ResumeSection } from "@/entities/resume/model";
import { isRichEmpty, localizedText } from "@/shared/lib/localized";

export interface EmptySection {
  kind: string;
  /** 当前语言下解析出的章节标题（用于导出前提示用户） */
  title: string;
}

/** 单个章节是否为空（忽略隐藏章节） */
function sectionEmpty(section: ResumeSection, locale: Locale): boolean {
  if (section.kind === "skills") {
    if (section.groups.length === 0) return true;
    return section.groups.every(
      (g) => localizedText(g.name, locale).trim() === "" && localizedText(g.items, locale).trim() === "",
    );
  }
  // summary / experience / project / education 均以 items 承载内容
  if (section.items.length === 0) return true;
  return section.items.every((it) => {
    if (section.kind === "summary") return isRichEmpty(localizedText(it.description, locale));
    return (
      localizedText(it.title, locale).trim() === "" &&
      localizedText(it.subtitle, locale).trim() === "" &&
      isRichEmpty(localizedText(it.description, locale))
    );
  });
}

/**
 * 导出前校验：列出当前语言下仍为空（无可见内容）的可见章节（P1-6）。
 *
 * 多语言字段经回退链读取，因此「某语言缺值但其他语言有值」不算空——
 * 真实用户视角下该章节有内容可出片，不应被拦。
 */
export function detectEmptySections(resume: ResumeData, locale: Locale): EmptySection[] {
  const out: EmptySection[] = [];
  for (const s of resume.sections) {
    if (!s.visible) continue;
    if (sectionEmpty(s, locale)) out.push({ kind: s.kind, title: localizedText(s.title, locale) });
  }
  return out;
}
