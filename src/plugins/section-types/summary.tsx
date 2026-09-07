import type { Block } from "@/shared/types/block";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { newId } from "@/shared/lib/id";
import { ItemBlockView, ItemsSectionEditor } from "./parts";

/**
 * 自我评价：无标题行的纯段落章节，侧栏版式下归入侧栏。
 */
export const summarySection: SectionTypePlugin = {
  id: "section-summary",
  kind: "section-type",
  sectionKind: "summary",
  labelKey: "sec.summary",
  version: 1,
  defaultTitle: { zh: "自我评价", en: "Summary", ja: "自己PR", de: "Profil", ko: "자기소개" },
  fields: [
    {
      key: "description",
      type: "richtext",
      labelKey: "edit.summaryPlaceholder",
      localized: true,
      builtin: "description",
    },
  ],
  placement: "sidebar",
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
      hasHeader: false,
      item,
      sectionKind: "summary",
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
    kind: "summary",
    title: { zh: "自我评价", en: "Summary", ja: "自己PR", de: "Profil", ko: "자기소개" },
    visible: true,
    order: 0,
    items: [
      {
        id: newId("it"),
        title: {},
        subtitle: {},
        startDate: "",
        endDate: "",
        current: false,
        description: {
          zh: "<p>深耕 B 端与企业级 SaaS 产品 6 年，擅长把模糊业务诉求拆解为可落地方案。</p><p>主导过从 0 到 1 的多租户平台，<strong>上线一年服务 300+ 企业</strong>，续费率 92%。</p>",
          en: "<p>6 years building B2B and enterprise SaaS products, turning ambiguous needs into shippable roadmaps.</p><p>Led a 0-to-1 multi-tenant platform serving <strong>300+ companies</strong> with 92% retention.</p>",
          ja: "<p>B 端およびエンタープライズ SaaS プロダクトを 6 年開発。曖昧な要件を実行可能なロードマップへ落とし込むのが得意。</p><p>0 から 1 へのマルチテナント基盤を主導、<strong>リリース 1 年で 300 社以上へ導入</strong>、継続率 92%。</p>",
          de: "<p>6 Jahre in B2B- und Enterprise-SaaS-Produkten; wandelt vage Anforderungen in umsetzbare Roadmaps.</p><p>Leitete eine 0-zu-1-Multi-Tenant-Plattform, <strong>nach einem Jahr bei 300+ Firmen</strong> im Einsatz, 92 % Retention.</p>",
          ko: "<p>B2B 및 엔터프라이즈 SaaS 제품 6년 경험. 모호한 요구사를 실행 가능한 로드맵으로 정리.</p><p>0→1 멀티테넌트 플랫폼 주도, <strong>출시 1년 만에 300+ 기업</strong> 도입, 유지율 92%.</p>",
        },
      },
    ],
    groups: [],
  }),
};
