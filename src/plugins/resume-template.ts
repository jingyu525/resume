import type { Localized, ResumeData, ResumeSection, RichText, SkillGroup } from "@/entities/resume/model";
import type { SectionTypePlugin } from "@/plugins/core/types";
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
 * 岗位模板（P1-8）：不同目标岗一键切换关键词 / 语气。
 *
 * 复用示例简历骨架，仅替换「职位 + 自我评价 + 专业技能」三段与岗位强相关的内容，
 * 工作经历 / 项目 / 教育沿用通用示例，用户在此基础上改写。每段均五语齐全。
 */
export type RoleId = "backend" | "pm" | "design";
export const ROLE_IDS: RoleId[] = ["backend", "pm", "design"];

const ROLE_TITLE: Record<RoleId, Localized<string>> = {
  backend: { zh: "后端工程师", en: "Backend Engineer", ja: "バックエンドエンジニア", de: "Backend-Entwickler", ko: "백엔드 엔지니어" },
  pm: { zh: "产品经理", en: "Product Manager", ja: "プロダクトマネージャー", de: "Produktmanager", ko: "프로덕트 매니저" },
  design: { zh: "UI 设计师", en: "UI Designer", ja: "UI デザイナー", de: "UI-Designer", ko: "UI 디자이너" },
};

const ROLE_SUMMARY: Record<RoleId, Localized<RichText>> = {
  backend: {
    zh: "<p>6 年后端研发，专注高并发与分布式系统。主导过日均 10 亿请求的服务重构，P99 延迟下降 60%。</p><p>熟悉 Go / Java 与云原生体系，重视可观测性与稳定性。</p>",
    en: "<p>6 years backend engineering on high-concurrency and distributed systems. Led a rebuild serving 1B requests/day, cutting P99 latency by 60%.</p><p>Strong in Go/Java and cloud-native, focused on observability and reliability.</p>",
    ja: "<p>バックエンド開発 6 年、高負荷・分散システムが専門。1 日 10 億リクエストの基盤を再構築し P99 遅延を 60% 改善。</p><p>Go/Java とクラウドネイティブに精通、可観測性と安定性を重視。</p>",
    de: "<p>6 Jahre Backend mit Fokus auf Hochlast- und verteilte Systeme. Leitete den Umbau eines 1-Mrd-Requests/Tag-Dienstes, P99-Latenz −60 %.</p><p>Stark in Go/Java und Cloud-native, Fokus auf Observability und Stabilität.</p>",
    ko: "<p>백엔드 6년, 고부하·분산 시스템 전문. 일 10억 요청 서비스 개편 주도, P99 지연 60% 감소.</p><p>Go/Java 와 클라우드 네이티브 숙련, 관측성과 안정성 중시.</p>",
  },
  pm: {
    zh: "<p>6 年 B 端产品经理，擅长把模糊业务诉求拆解为可落地方案。主导过从 0 到 1 的多租户平台，<strong>上线一年服务 300+ 企业</strong>，续费率 92%。</p>",
    en: "<p>6 years B2B product manager turning ambiguous needs into shippable roadmaps. Led a 0-to-1 multi-tenant platform, <strong>serving 300+ companies</strong> with 92% retention.</p>",
    ja: "<p>B 端 PM 6 年。曖昧な要件を実行可能なロードマップへ落とし込むのが得意。0 から 1 へのマルチテナント基盤を主導、<strong>リリース 1 年で 300 社以上</strong>、継続率 92%。</p>",
    de: "<p>6 Jahre B2B-Produktmanager; wandelt vage Anforderungen in umsetzbare Roadmaps. Leitete eine 0-zu-1-Multi-Tenant-Plattform, <strong>bei 300+ Firmen</strong>, 92 % Retention.</p>",
    ko: "<p>B2B 제품 매니저 6년, 모호한 요구사를 실행 가능한 로드맵으로 정리. 0→1 멀티테넌트 플랫폼 주도, <strong>300+ 기업</strong> 도입, 유지율 92%.</p>",
  },
  design: {
    zh: "<p>5 年 UI 设计，专注设计系统与复杂 B 端界面。搭建过跨 30+ 产品的组件库，<strong>设计交付效率提升 40%</strong>。</p><p>熟悉从用研到高保真的完整链路，能与前端紧密协作还原。</p>",
    en: "<p>5 years UI design on design systems and complex B2B interfaces. Built a component library across 30+ products, <strong>+40% delivery efficiency</strong>. Comfortable from research to high-fidelity with close frontend collaboration.</p>",
    ja: "<p>UI デザイン 5 年、デザインシステムと複雑な B 端画面が専門。30 以上のプロダクトをまたぐコンポーネントライブラリを構築、<strong>制作効率 40% 向上</strong>。リサーチからハイフィデリティ、フロントエンドとの密な協業まで対応。</p>",
    de: "<p>5 Jahre UI-Design mit Fokus auf Designsysteme und komplexe B2B-Oberflächen. Baute eine Komponentenbibliothek für 30+ Produkte, <strong>+40 % Effizienz</strong>. Von Research bis High-Fidelity, eng mit Frontend.</p>",
    ko: "<p>UI 디자인 5년, 디자인 시스템과 복잡한 B2B 화면 전문. 30+ 제품을 아우르는 컴포넌트 라이브러리 구축, <strong>제작 효율 40% 향상</strong>. 리서치부터 하이피델리티, 프론트엔드와 긴밀 협업.</p>",
  },
};

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

/** 生成指定岗位的示例简历（五语齐全）。应用为「一键切换岗位」模板。 */
export function createRoleResume(role: RoleId): ResumeData {
  const base = createSampleResume();
  base.basics.title = { ...ROLE_TITLE[role] };
  base.sections = base.sections.map((s) => {
    if (s.kind === "summary") {
      return {
        ...s,
        items: [
          {
            id: newId("it"),
            title: {},
            subtitle: {},
            startDate: "",
            endDate: "",
            current: false,
            description: { ...ROLE_SUMMARY[role] },
          },
        ],
      };
    }
    if (s.kind === "skills") {
      return {
        ...s,
        groups: ROLE_SKILLS[role].map((g) => ({ ...g, id: newId("grp"), name: { ...g.name }, items: { ...g.items } })),
      };
    }
    return s;
  });
  return base;
}
