import type { ResumeData, ResumeSection, SectionKind } from "@/entities/resume/model";
import { newId } from "@/shared/lib/id";

const SECTION_ORDER: SectionKind[] = [
  "summary",
  "experience",
  "project",
  "education",
  "skills",
];

/** 章节默认标题（五语齐全，FR-6）：空白简历与示例模板共用 */
const SECTION_DEFAULT_TITLE: Record<SectionKind, Record<string, string>> = {
  summary: { zh: "自我评价", en: "Summary", ja: "自己紹介", de: "Zusammenfassung", ko: "자기소개" },
  experience: { zh: "工作经历", en: "Experience", ja: "職務経歴", de: "Berufserfahrung", ko: "경력" },
  project: { zh: "项目经历", en: "Projects", ja: "プロジェクト", de: "Projekte", ko: "프로젝트" },
  education: { zh: "教育背景", en: "Education", ja: "学歴", de: "Ausbildung", ko: "학력" },
  skills: { zh: "专业技能", en: "Skills", ja: "スキル", de: "Fähigkeiten", ko: "보유 기술" },
};

function emptySection(kind: SectionKind, order: number): ResumeSection {
  return {
    id: newId("sec"),
    kind,
    title: { ...SECTION_DEFAULT_TITLE[kind] },
    visible: true,
    order,
    items: [],
    groups: [],
  };
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
    sections: SECTION_ORDER.map((kind, i) => emptySection(kind, i)),
  };
}

/** 填充示例（供参考，不预置他人内容）。五语模板：切换界面语言即显示对应语言（FR-6） */
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

  const summary = base.sections.find((s) => s.kind === "summary");
  if (summary) {
    summary.visible = true;
    summary.items = [
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
    ];
  }

  const exp = base.sections.find((s) => s.kind === "experience");
  if (exp) {
    exp.items = [
      {
        id: newId("it"),
        title: { zh: "星河科技", en: "Galaxy Tech", ja: "星河科技", de: "Galaxy Tech", ko: "갤럭시 테크" },
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
        title: { zh: "云图网络", en: "CloudGraph", ja: "云图网络", de: "CloudGraph", ko: "클라우드그래프" },
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
    ];
  }

  const proj = base.sections.find((s) => s.kind === "project");
  if (proj) {
    proj.items = [
      {
        id: newId("it"),
        title: { zh: "多租户计费中台", en: "Multi-tenant Billing", ja: "マルチテナント課金基盤", de: "Multi-Tenant-Billing", ko: "멀티테넌트 결제" },
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
    ];
  }

  const edu = base.sections.find((s) => s.kind === "education");
  if (edu) {
    edu.items = [
      {
        id: newId("it"),
        title: { zh: "同济大学", en: "Tongji University", ja: "同済大学", de: "Tongji University", ko: "통지 대학" },
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
    ];
  }

  const skills = base.sections.find((s) => s.kind === "skills");
  if (skills) {
    skills.groups = [
      {
        id: newId("grp"),
        name: { zh: "产品方法", en: "Methods", ja: "プロダクト手法", de: "Methoden", ko: "제품 기법" },
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
    ];
  }

  return base;
}
