import type { Block } from "@/shared/types/block";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { ItemBlockView, ItemsSectionEditor } from "./parts";

/**
 * 证书：条目型章节（主标题=证书名、副标题=颁发机构），侧栏版式下留在主栏。
 */
export const certificationSection: SectionTypePlugin = {
  id: "section-certification",
  kind: "section-type",
  sectionKind: "certification",
  labelKey: "sec.certification",
  version: 1,
  defaultTitle: { zh: "证书", en: "Certifications", ja: "資格", de: "Zertifikate", ko: "자격증" },
  fields: [
    { key: "title", type: "text", labelKey: "edit.itemTitlePlaceholder", localized: true, builtin: "title" },
    { key: "subtitle", type: "text", labelKey: "edit.itemSubtitlePlaceholder", localized: true, builtin: "subtitle" },
    { key: "period", type: "month-range", labelKey: "edit.startDate" },
    { key: "description", type: "richtext", labelKey: "edit.summaryPlaceholder", localized: true, builtin: "description" },
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
      sectionKind: "certification",
    }));
    return [head, ...items];
  },
  renderBlock: (block, locale) =>
    block.type === "item" ? (
      <ItemBlockView
        item={block.item}
        sectionId={block.sectionId}
        locale={locale}
        hasHeader={block.hasHeader}
      />
    ) : null,
  renderEditor: ({ section, locale }) => <ItemsSectionEditor section={section} locale={locale} />,
};
