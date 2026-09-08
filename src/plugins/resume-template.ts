import type { Locale } from "@/entities/locale";
import type { Localized, ResumeData, ResumeSection, SkillGroup } from "@/entities/resume/model";
import type { SectionTypePlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { newId } from "@/shared/lib/id";
import { getSectionType } from "./core/registry";

/**
 * 构造函数：按插件生成空章节（供模板与新增章节复用）。
 *
 * 与 parts.tsx 的组件分开存放：该文件只导出组件，Fast Refresh 才能正常工作。
 */
export function emptySectionOf(
  sectionKind: string,
  title: Localized<string>,
  order: number,
): ResumeSection {
  return {
    id: newId("sec"),
    kind: sectionKind as ResumeSection["kind"],
    title: { ...title },
    visible: true,
    order,
    items: [],
    groups: [],
  };
}

/**
 * 简历模板（空白 / 示例）。
 *
 * 位于 plugins 层而非 entities：章节列表与默认标题来自章节类型插件注册表，
 * 而 entities 不得反向依赖 plugins（规则 A1）。这也是"每语言有自己的模板"的
 * 实现基础——新增语言包后，模板由各插件的 defaultTitle 与 createSample 提供。
 */

/**
 * 默认简历固定为这 5 个内置章节：其余章节类型（证书 / 语言 / 作品集等）
 * 由用户在「添加章节」菜单中按需加入，避免空白简历被空章节撑大，
 * 也避免落地页示例简历出现空的章节标题。
 */
const DEFAULT_SECTION_KINDS = ["summary", "experience", "project", "education", "skills"];

function defaultSectionPlugins(): SectionTypePlugin[] {
  return DEFAULT_SECTION_KINDS.map((k) => getSectionType(k)).filter(
    (p): p is SectionTypePlugin => Boolean(p),
  );
}

/** 空白简历 + 纸面占位引导（FR-4） */
export function createEmptyResume(): ResumeData {
  return {
    basics: {
      name: {},
      title: {},
      phone: "",
      email: "",
      city: {},
      wechat: "",
      website: "",
    },
    sections: defaultSectionPlugins().map((plugin, i) =>
      emptySectionOf(plugin.sectionKind, plugin.defaultTitle, i),
    ),
  };
}

/** 填充示例（供参考，不预置他人内容）。示例内容由各章节插件自带的 createSample 提供。 */
export function createSampleResume(): ResumeData {
  const base = createEmptyResume();
  base.basics = {
    name: { zh: "李知行", en: "Zhixing Li", ja: "李知行", de: "Zhixing Li", ko: "리지싱 리" },
    title: {
      zh: "高级产品经理",
      en: "Senior Product Manager",
      ja: "シニアプロダクトマネージャー",
      de: "Senior Product Manager",
      ko: "시니어 프로덕트 매니저",
    },
    phone: "138-0000-0000",
    email: "zhixing.li@example.com",
    city: { zh: "上海", en: "Shanghai", ja: "上海", de: "Shanghai", ko: "상하이" },
    wechat: "zhixing_pm",
    website: "zhixing.li",
  };
  base.sections = defaultSectionPlugins().map((plugin, i) => {
    const sample = plugin.createSample?.();
    if (!sample) return emptySectionOf(plugin.sectionKind, plugin.defaultTitle, i);
    return { ...sample, order: i };
  });
  return base;
}

/**
 * 岗位模板（P1-8）：不同目标岗一键套用对应的【结构框架】。
 *
 * 内容边界（第一性原理：系统只能给结构、范式与领域知识，不能给事实）：
 *  - 给：岗位名、该岗位的技能分类维度；
 *  - 不给：自我评价、工作经历、项目、教育——这些是用户的事实，一律留空。
 * 每段框架均五语齐全。
 */
export type RoleId = "backend" | "pm" | "design";
export const ROLE_IDS: RoleId[] = ["backend", "pm", "design"];

const ROLE_TITLE: Record<RoleId, Localized<string>> = {
  backend: { zh: "后端工程师", en: "Backend Engineer", ja: "バックエンドエンジニア", de: "Backend-Entwickler", ko: "백엔드 엔지니어" },
  pm: { zh: "产品经理", en: "Product Manager", ja: "プロダクトマネージャー", de: "Produktmanager", ko: "프로덕트 매니저" },
  design: { zh: "UI 设计师", en: "UI Designer", ja: "UI デザイナー", de: "UI-Designer", ko: "UI 디자이너" },
};

// 岗位自我评价的「示例文案」已删除：那是编造的经历与数字（"6 年、日均 10 亿请求"
// "P99 下降 60%"），一旦写进简历就逼着用户逐条改写，漏一处即以虚构身份投递。
// 写法范式改由占位提示（sampleHints）与只读的「示例参考」提供，不进 ResumeData。

function langMap(zh: string, en: string, ja: string, de: string, ko: string): Localized<string> {
  return { zh, en, ja, de, ko };
}

function skillGroup(name: Localized<string>, items: Localized<string>): SkillGroup {
  return { id: newId("grp"), name, items };
}

const ROLE_SKILLS: Record<RoleId, SkillGroup[]> = {
  backend: [
    skillGroup(
      langMap("后端语言", "Backend", "バックエンド言語", "Backend-Sprachen", "백엔드 언어"),
      langMap("Go\nJava\nPython\nNode.js", "Go\nJava\nPython\nNode.js", "Go\nJava\nPython\nNode.js", "Go\nJava\nPython\nNode.js", "Go\nJava\nPython\nNode.js"),
    ),
    skillGroup(
      langMap("基础设施", "Infra", "インフラ", "Infrastruktur", "인프라"),
      langMap("Docker\nKubernetes\nTerraform\nCI/CD", "Docker\nKubernetes\nTerraform\nCI/CD", "Docker\nKubernetes\nTerraform\nCI/CD", "Docker\nKubernetes\nTerraform\nCI/CD", "Docker\nKubernetes\nTerraform\nCI/CD"),
    ),
    skillGroup(
      langMap("数据存储", "Data", "データストア", "Datenspeicher", "데이터 저장"),
      langMap("MySQL\nPostgreSQL\nRedis\nKafka", "MySQL\nPostgreSQL\nRedis\nKafka", "MySQL\nPostgreSQL\nRedis\nKafka", "MySQL\nPostgreSQL\nRedis\nKafka", "MySQL\nPostgreSQL\nRedis\nKafka"),
    ),
    skillGroup(
      langMap("工程实践", "Practice", "実践", "Praxis", "엔지니어링"),
      langMap("可观测性\n链路追踪\n混沌工程\nCode Review", "Observability\nTracing\nChaos Eng\nCode Review", "可観測性\nトレーシング\nカオスエンジニアリング\nコードレビュー", "Observability\nTracing\nChaos Engineering\nCode Review", "관측성\n트레이싱\n카오스 엔지니어링\n코드 리뷰"),
    ),
  ],
  pm: [
    skillGroup(
      langMap("产品方法", "Methods", "プロダクト手法", "Methoden", "제품 기법"),
      langMap("用户研究\n需求建模\n路线图规划\nA/B 实验", "User research\nRequirement modeling\nRoadmapping\nA/B testing", "ユーザー調査\n要件モデリング\nロードマッピング\nA/B テスト", "Nutzerforschung\nAnforderungsmodellierung\nRoadmapping\nA/B-Tests", "사용자 리서치\n요구사항 모델링\n로드맵 계획\nA/B 테스트"),
    ),
    skillGroup(
      langMap("技术协作", "Tech", "技術連携", "Technik", "기술 협업"),
      langMap("SQL\nFigma\nAPI 设计\n数据埋点", "SQL\nFigma\nAPI design\nAnalytics", "SQL\nFigma\nAPI 設計\nデータ計測", "SQL\nFigma\nAPI-Design\nAnalytics", "SQL\nFigma\nAPI 설계\n데이터 트래킹"),
    ),
  ],
  design: [
    skillGroup(
      langMap("设计工具", "Tools", "ツール", "Werkzeuge", "디자인 도구"),
      langMap("Figma\nSketch\nPrinciple\nFramer", "Figma\nSketch\nPrinciple\nFramer", "Figma\nSketch\nPrinciple\nFramer", "Figma\nSketch\nPrinciple\nFramer", "Figma\nSketch\nPrinciple\nFramer"),
    ),
    skillGroup(
      langMap("设计方法", "Methods", "手法", "Methoden", "디자인 방법"),
      langMap("设计系统\n组件化\n可用性测试\n设计走查", "Design systems\nComponents\nUsability tests\nDesign review", "デザインシステム\nコンポーネント化\nユーザビリティテスト\nデザインレビュー", "Designsysteme\nKomponenten\nUsability-Tests\nDesign-Reviews", "디자인 시스템\n컴포넌트화\n사용성 테스트\n디자인 리뷰"),
    ),
    skillGroup(
      langMap("前端协作", "Frontend", "フロント連携", "Frontend", "프론트 협업"),
      langMap("HTML\nCSS\nTailwind\n设计标注", "HTML\nCSS\nTailwind\nSpecs", "HTML\nCSS\nTailwind\n指定書", "HTML\nCSS\nTailwind\nSpezifikation", "HTML\nCSS\nTailwind\n디자인 스펙"),
    ),
    skillGroup(
      langMap("用户研究", "Research", "ユーザー調査", "Research", "사용자 리서치"),
      langMap("访谈\n问卷\n用户画像\n卡片分类", "Interviews\nSurveys\nPersona\nCard sort", "インタビュー\nアンケート\nペルソナ\nカードソート", "Interviews\nUmfragen\nPersona\nCard Sorting", "인터뷰\n설문\n페르소나\n카드 정렬"),
    ),
  ],
};

/**
 * 生成指定岗位的简历框架：只给【框架】，不给【事实】。
 *
 *  - 岗位名是通用称谓（不是个人经历），可安全预填，五语齐全；
 *  - 技能分类是领域知识（后端岗通常从语言/基础设施/数据/工程实践几维度展示），
 *    但「具体会什么」是用户的事实，因此条目一律留空；
 *  - 自我评价 / 经历 / 项目 / 教育全部留空——系统不知道用户做过什么。
 *
 * 旧实现以示例简历为底（含虚构公司与编造数字），逼着用户在其上逐条改写，
 * 漏一处即以虚构身份投递出去。那等于让用户为编造内容背书，故不再如此。
 */
export function createRoleResume(role: RoleId): ResumeData {
  const base = createEmptyResume();
  base.basics.title = { ...ROLE_TITLE[role] };
  base.sections = base.sections.map((s) =>
    s.kind === "skills"
      ? {
          ...s,
          groups: ROLE_SKILLS[role].map((g) => ({
            id: newId("grp"),
            name: { ...g.name },
            items: {},
          })),
        }
      : s,
  );
  return base;
}

/**
 * 该岗位的技能分类与典型技能——仅供只读参考，不写入简历。
 *
 * 「后端常见 Go/Java/K8s」是领域知识，可作提示；但它不等于用户掌握的技能，
 * 写入即替用户背书，因此只在界面展示。
 */
export function roleSkillHints(role: RoleId, locale: Locale): { name: string; items: string }[] {
  return ROLE_SKILLS[role].map((g) => ({
    name: localizedText(g.name, locale),
    items: localizedText(g.items, locale).split("\n").join(" · "),
  }));
}
