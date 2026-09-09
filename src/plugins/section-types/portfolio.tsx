import type { Block } from "@/shared/types/block";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { ItemBlockView, ItemsSectionEditor } from "./parts";

/**
 * 作品集：条目型章节（主标题=作品名、副标题=链接或角色），侧栏版式下留在主栏。
 */
export const portfolioSection: SectionTypePlugin = {
  id: "section-portfolio",
  kind: "section-type",
  sectionKind: "portfolio",
  labelKey: "sec.portfolio",
  version: 1,
  defaultTitle: {
    zh: "作品集",
    en: "Portfolio",
    ja: "ポートフォリオ",
    de: "Portfolio",
    ko: "포트폴리오",
  },
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
      sectionKind: "portfolio",
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
};
