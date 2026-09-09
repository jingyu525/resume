import type { Block } from "@/shared/types/block";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { newId } from "@/shared/lib/id";
import { ItemBlockView, ItemsSectionEditor } from "./parts";

/**
 * 教育背景：时间线型章节（主标题=学校、副标题=专业/学位）。
 */
export const educationSection: SectionTypePlugin = {
  id: "section-education",
  kind: "section-type",
  sectionKind: "education",
  labelKey: "sec.education",
  version: 1,
  defaultTitle: { zh: "教育背景", en: "Education", ja: "学歴", de: "Ausbildung", ko: "학력" },
  fields: [
    { key: "title", type: "text", labelKey: "edit.itemTitlePlaceholder", localized: true, builtin: "title" },
    { key: "subtitle", type: "text", labelKey: "edit.itemSubtitlePlaceholder", localized: true, builtin: "subtitle" },
    { key: "period", type: "month-range", labelKey: "edit.startDate" },
  ],
  placement: "main",
  toBlocks(section, ctx) {
    const head: Block = {
      id: `head_${section.id}`,
      type: "section-head",
      sectionId: section.id,
      title: localizedText(section.title, ctx.locale) || "",
      keepWithNext: section.items.length > 0,
    };
    const items: Block[] = section.items.map((item) => ({
      id: `it_${item.id}`,
      type: "item",
      sectionId: section.id,
      hasHeader: true,
      item,
      sectionKind: "education",
    }));
    return [head, ...items];
  },
  renderBlock: (block, locale, editors) =>
    block.type === "item" ? (
      <ItemBlockView
        item={block.item}
        sectionId={block.sectionId}
        locale={locale}
        hasHeader={block.hasHeader}
        editors={editors}
      />
    ) : null,
  renderEditor: ({ section, locale }) => <ItemsSectionEditor section={section} locale={locale} />,
  createSample: () => ({
    id: newId("sec"),
    kind: "education",
    title: { zh: "教育背景", en: "Education", ja: "学歴", de: "Ausbildung", ko: "학력" },
    visible: true,
    order: 3,
    items: [
      {
        id: newId("it"),
        title: {
          zh: "同济大学",
          en: "Tongji University",
          ja: "同済大学",
          de: "Tongji University",
          ko: "통지 대학",
        },
        subtitle: {
          zh: "管理科学与工程 硕士",
          en: "M.Sc. Management",
          ja: "経営学修士",
          de: "M.Sc. Management",
          ko: "경영학 석사",
        },
        startDate: "2015-09",
        endDate: "2018-06",
        current: false,
        description: { zh: "", en: "", ja: "", de: "", ko: "" },
      },
    ],
    groups: [],
  }),
};
