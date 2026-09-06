import type { ResumeData, ResumeSection, SectionKind } from "@/entities/resume/model";
import { newId } from "@/shared/lib/id";

const SECTION_ORDER: SectionKind[] = [
  "summary",
  "experience",
  "project",
  "education",
  "skills",
];

const SECTION_DEFAULT_TITLE: Record<SectionKind, Record<string, string>> = {
  summary: { zh: "自我评价", en: "Summary" },
  experience: { zh: "工作经历", en: "Experience" },
  project: { zh: "项目经历", en: "Projects" },
  education: { zh: "教育背景", en: "Education" },
  skills: { zh: "专业技能", en: "Skills" },
};

function emptySection(kind: SectionKind, order: number): ResumeSection {
  return {
    id: newId("sec"),
    kind,
    title: { zh: SECTION_DEFAULT_TITLE[kind].zh, en: SECTION_DEFAULT_TITLE[kind].en },
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

/** 填充示例（供参考，不预置他人内容） */
export function createSampleResume(): ResumeData {
  const base = createEmptyResume();
  base.basics = {
    name: { zh: "李知行", en: "Zhixing Li" },
    title: { zh: "高级产品经理", en: "Senior Product Manager" },
    phone: "138-0000-0000",
    email: "zhixing.li@example.com",
    city: { zh: "上海", en: "Shanghai" },
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
        },
      },
    ];
  }

  const exp = base.sections.find((s) => s.kind === "experience");
  if (exp) {
    exp.items = [
      {
        id: newId("it"),
        title: { zh: "星河科技", en: "Galaxy Tech" },
        subtitle: { zh: "高级产品经理", en: "Senior PM" },
        startDate: "2021-03",
        endDate: "",
        current: true,
        description: {
          zh: "<p>负责企业协作平台核心模块，主导需求评审与版本规划。</p><p>推动<em>自动化工作流</em>上线，月活提升 40%。</p>",
          en: "<p>Owned core modules of the enterprise collaboration platform.</p><p>Shipped <em>automation workflows</em>, lifting MAU by 40%.</p>",
        },
      },
      {
        id: newId("it"),
        title: { zh: "云图网络", en: "CloudGraph" },
        subtitle: { zh: "产品经理", en: "Product Manager" },
        startDate: "2018-07",
        endDate: "2021-02",
        current: false,
        description: {
          zh: "<p>负责数据看板从 0 到 1，搭建指标体系中台。</p>",
          en: "<p>Built the analytics dashboard 0-to-1 and the metrics platform.</p>",
        },
      },
    ];
  }

  const proj = base.sections.find((s) => s.kind === "project");
  if (proj) {
    proj.items = [
      {
        id: newId("it"),
        title: { zh: "多租户计费中台", en: "Multi-tenant Billing" },
        subtitle: { zh: "项目负责", en: "Lead" },
        startDate: "2022-01",
        endDate: "2022-09",
        current: false,
        description: {
          zh: "<p>统一计量、账单与发票能力，支撑 3 条业务线复用。</p>",
          en: "<p>Unified metering, billing and invoicing reused by 3 product lines.</p>",
        },
      },
    ];
  }

  const edu = base.sections.find((s) => s.kind === "education");
  if (edu) {
    edu.items = [
      {
        id: newId("it"),
        title: { zh: "同济大学", en: "Tongji University" },
        subtitle: { zh: "管理科学与工程 硕士", en: "M.Sc. Management" },
        startDate: "2015-09",
        endDate: "2018-06",
        current: false,
        description: { zh: "", en: "" },
      },
    ];
  }

  const skills = base.sections.find((s) => s.kind === "skills");
  if (skills) {
    skills.groups = [
      {
        id: newId("grp"),
        name: { zh: "产品方法", en: "Methods" },
        items: {
          zh: "用户研究\n需求建模\n路线图规划\nA/B 实验",
          en: "User research\nRequirement modeling\nRoadmapping\nA/B testing",
        },
      },
      {
        id: newId("grp"),
        name: { zh: "技术协作", en: "Tech" },
        items: { zh: "SQL\nFigma\nAPI 设计\n数据埋点", en: "SQL\nFigma\nAPI design\nAnalytics" },
      },
    ];
  }

  return base;
}
