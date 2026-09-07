import type { Localized, ResumeData, ResumeSection } from "@/entities/resume/model";
import { newId } from "@/shared/lib/id";
import { listSectionTypes } from "./core/registry";

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
    sections: listSectionTypes().map((plugin, i) =>
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
  base.sections = listSectionTypes().map((plugin, i) => {
    const sample = plugin.createSample?.();
    if (!sample) return emptySectionOf(plugin.sectionKind, plugin.defaultTitle, i);
    return { ...sample, order: i };
  });
  return base;
}
