import type { ResumeSection } from "@/entities/resume/model";
import type { SectionTypePlugin } from "@/plugins/core/types";

/**
 * 「添加章节」菜单的可用项：排除简历里已经存在的章节类型，
 * 保证每种章节类型在简历中唯一（避免重复添加同类章节造成冗余）。
 *
 * 纯函数、可单测；渲染与 store 均不依赖它，去重只发生在菜单呈现层，
 * 不影响已存在章节的数据与分页。
 */
export function getAvailableSectionTypes(
  all: SectionTypePlugin[],
  sections: ResumeSection[],
): SectionTypePlugin[] {
  const usedKinds = new Set(sections.map((s) => s.kind));
  return all.filter((p) => !usedKinds.has(p.sectionKind));
}
