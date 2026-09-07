import type { Block } from "@/shared/types/block";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { newId } from "@/shared/lib/id";
import { ItemBlockView, ItemsSectionEditor } from "./parts";

/**
 * 项目经历：与工作经历同构（主标题=项目名、副标题=角色），但独立成章节以便单独取舍。
 */
export const projectSection: SectionTypePlugin = {
  id: "section-project",
  kind: "section-type",
  sectionKind: "project",
  labelKey: "sec.project",
  version: 1,
  defaultTitle: { zh: "项目经历", en: "Projects", ja: "プロジェクト", de: "Projekte", ko: "프로젝트" },
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
      sectionKind: "project",
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
  createSample: () => ({
    id: newId("sec"),
    kind: "project",
    title: { zh: "项目经历", en: "Projects", ja: "プロジェクト", de: "Projekte", ko: "프로젝트" },
    visible: true,
    order: 2,
    items: [
      {
        id: newId("it"),
        title: {
          zh: "多租户计费中台",
          en: "Multi-tenant Billing",
          ja: "マルチテナント課金基盤",
          de: "Multi-Tenant-Billing",
          ko: "멀티테넌트 결제",
        },
        subtitle: { zh: "项目负责", en: "Lead", ja: "リード", de: "Leitung", ko: "리드" },
        startDate: "2022-01",
        endDate: "2022-09",
        current: false,
        description: {
          zh: "<p>统一计量、账单与发票能力，支撑 3 条业务线复用。</p>",
          en: "<p>Unified metering, billing and invoicing reused by 3 product lines.</p>",
          ja: "<p>測定・請求・請求書を統合し、3 つのプロダクトラインで再利用。</p>",
          de: "<p>Vereinheitlichte Metering-, Billing- und Rechnungsfunktion, von 3 Produktlinien wiederverwendet.</p>",
          ko: "<p>계량·청구·송장 기능을 통합해 3개 제품 라인이 재사용.</p>",
        },
      },
    ],
    groups: [],
  }),
};
