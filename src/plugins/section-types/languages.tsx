import type { Block } from "@/shared/types/block";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { GroupsSectionEditor, SkillGroupBlockView } from "./parts";

/**
 * 语言能力：分组型章节（分组名=语言类别、每项=语言与水平），侧栏版式下归入侧栏。
 */
export const languagesSection: SectionTypePlugin = {
  id: "section-languages",
  kind: "section-type",
  sectionKind: "languages",
  labelKey: "sec.languages",
  version: 1,
  defaultTitle: { zh: "语言", en: "Languages", ja: "言語", de: "Sprachen", ko: "언어" },
  fields: [
    { key: "name", type: "text", labelKey: "edit.groupNamePlaceholder", localized: true },
    { key: "items", type: "tags", labelKey: "edit.skillItemPlaceholder", localized: true },
  ],
  placement: "sidebar",
  toBlocks(section, ctx) {
    const head: Block = {
      id: `head_${section.id}`,
      type: "section-head",
      sectionId: section.id,
      title: localizedText(section.title, ctx.locale) || "",
      keepWithNext: section.groups.length > 0,
    };
    const groups: Block[] = section.groups.map((group) => ({
      id: `grp_${group.id}`,
      type: "skill-group",
      sectionId: section.id,
      group,
      sectionKind: "languages",
    }));
    return [head, ...groups];
  },
  renderBlock: (block, locale, editors) =>
    block.type === "skill-group" ? (
      <SkillGroupBlockView group={block.group} sectionId={block.sectionId} locale={locale} editors={editors} />
    ) : null,
  renderEditor: ({ section, locale }) => <GroupsSectionEditor section={section} locale={locale} />,
};
