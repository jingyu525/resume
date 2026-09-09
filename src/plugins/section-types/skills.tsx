import type { Block } from "@/shared/types/block";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { newId } from "@/shared/lib/id";
import { GroupsSectionEditor, SkillGroupBlockView } from "./parts";

/**
 * 专业技能：唯一用「分组」而非「条目」的章节类型（分组名 + 换行分隔的技能列表）。
 * 侧栏版式下归入侧栏——这也是它必须与经历类章节区分开的原因。
 */
export const skillsSection: SectionTypePlugin = {
  id: "section-skills",
  kind: "section-type",
  sectionKind: "skills",
  labelKey: "sec.skills",
  version: 1,
  defaultTitle: { zh: "专业技能", en: "Skills", ja: "スキル", de: "Kompetenzen", ko: "기술" },
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
      sectionKind: "skills",
    }));
    return [head, ...groups];
  },
  renderBlock: (block, locale, editors) =>
    block.type === "skill-group" ? (
      <SkillGroupBlockView group={block.group} sectionId={block.sectionId} locale={locale} editors={editors} />
    ) : null,
  renderEditor: ({ section, locale }) => <GroupsSectionEditor section={section} locale={locale} />,
  createSample: () => ({
    id: newId("sec"),
    kind: "skills",
    title: { zh: "专业技能", en: "Skills", ja: "スキル", de: "Kompetenzen", ko: "기술" },
    visible: true,
    order: 4,
    items: [],
    groups: [
      {
        id: newId("grp"),
        name: {
          zh: "产品方法",
          en: "Methods",
          ja: "プロダクト手法",
          de: "Methoden",
          ko: "제품 기법",
        },
        items: {
          zh: "用户研究\n需求建模\n路线图规划\nA/B 实验",
          en: "User research\nRequirement modeling\nRoadmapping\nA/B testing",
          ja: "ユーザー調査\n要件モデリング\nロードマッピング\nA/B テスト",
          de: "Nutzerforschung\nAnforderungsmodellierung\nRoadmapping\nA/B-Tests",
          ko: "사용자 리서치\n요구사항 모델링\n로드맵 계획\nA/B 테스트",
        },
      },
      {
        id: newId("grp"),
        name: { zh: "技术协作", en: "Tech", ja: "技術連携", de: "Technik", ko: "기술 협업" },
        items: {
          zh: "SQL\nFigma\nAPI 设计\n数据埋点",
          en: "SQL\nFigma\nAPI design\nAnalytics",
          ja: "SQL\nFigma\nAPI 設計\nデータ計測",
          de: "SQL\nFigma\nAPI-Design\nAnalytics",
          ko: "SQL\nFigma\nAPI 설계\n데이터 트래킹",
        },
      },
    ],
  }),
};
