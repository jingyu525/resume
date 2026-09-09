import type { Block } from "@/shared/types/block";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { newId } from "@/shared/lib/id";
import { ItemBlockView, ItemsSectionEditor } from "./parts";

/**
 * 工作经历：时间线型章节（主标题=公司、副标题=职位），侧栏版式下留在主栏。
 */
export const experienceSection: SectionTypePlugin = {
  id: "section-experience",
  kind: "section-type",
  sectionKind: "experience",
  labelKey: "sec.experience",
  version: 1,
  defaultTitle: { zh: "工作经历", en: "Experience", ja: "職歴", de: "Erfahrung", ko: "경력" },
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
      sectionKind: "experience",
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
    kind: "experience",
    title: { zh: "工作经历", en: "Experience", ja: "職歴", de: "Erfahrung", ko: "경력" },
    visible: true,
    order: 1,
    items: [
      {
        id: newId("it"),
        title: {
          zh: "星河科技",
          en: "Galaxy Tech",
          ja: "星河科技",
          de: "Galaxy Tech",
          ko: "갤럭시 테크",
        },
        subtitle: {
          zh: "高级产品经理",
          en: "Senior PM",
          ja: "シニア PM",
          de: "Senior PM",
          ko: "시니어 PM",
        },
        startDate: "2021-03",
        endDate: "",
        current: true,
        description: {
          zh: "<p>负责企业协作平台核心模块，主导需求评审与版本规划。</p><p>推动<em class=\"rs-em\">自动化工作流</em>上线，月活提升 40%。</p>",
          en: "<p>Owned core modules of the enterprise collaboration platform.</p><p>Shipped <em class=\"rs-em\">automation workflows</em>, lifting MAU by 40%.</p>",
          ja: "<p>企業向けコラボレーションプラットフォームの中核モジュールを担当。</p><p><em class=\"rs-em\">自動化ワークフロー</em>をリリース、MAU を 40% 向上。</p>",
          de: "<p>Verantwortete Kernmodule der Enterprise-Kollaborationsplattform.</p><p>Brachte <em class=\"rs-em\">Automatisierungs-Workflows</em> live, MAU +40 %.</p>",
          ko: "<p>기업 협업 플랫폼 핵심 모듈 담당.</p><p><em class=\"rs-em\">자동화 워크플로</em> 출시로 MAU 40% 증가.</p>",
        },
      },
      {
        id: newId("it"),
        title: {
          zh: "云图网络",
          en: "CloudGraph",
          ja: "云图网络",
          de: "CloudGraph",
          ko: "클라우드그래프",
        },
        subtitle: {
          zh: "产品经理",
          en: "Product Manager",
          ja: "プロダクトマネージャー",
          de: "Product Manager",
          ko: "프로덕트 매니저",
        },
        startDate: "2018-07",
        endDate: "2021-02",
        current: false,
        description: {
          zh: "<p>负责数据看板从 0 到 1，搭建指标体系中台。</p>",
          en: "<p>Built the analytics dashboard 0-to-1 and the metrics platform.</p>",
          ja: "<p>データダッシュボードを 0 から 1 へ構築、指標基盤を整備。</p>",
          de: "<p>Baute das Analyse-Dashboard 0-zu-1 und die Metrik-Plattform.</p>",
          ko: "<p>데이터 대시보드 0→1 구축 및 지표 플랫폼 구축.</p>",
        },
      },
    ],
    groups: [],
  }),
};
