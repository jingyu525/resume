import type { Locale } from "@/entities/locale";
import type { Layout } from "@/entities/appearance/model";
import type { ResumeData, ResumeItem, SkillGroup } from "@/entities/resume/model";
import { localizedText } from "@/shared/lib/localized";
import { formatPeriod } from "@/shared/lib/format";

export type Block =
  | { id: string; type: "basics"; keepWithNext?: boolean }
  | { id: string; type: "section-head"; sectionId: string; title: string; keepWithNext: boolean }
  | {
      id: string;
      type: "item";
      sectionId: string;
      hasHeader: boolean;
      item: ResumeItem;
      keepWithNext?: boolean;
    }
  | { id: string; type: "skill-group"; sectionId: string; group: SkillGroup; keepWithNext?: boolean };

export interface BlockTree {
  sidebar: Block[];
  main: Block[];
}

/** 将简历内容转为有序、不可拆的"原子块"列表（FR-7 单块不跨页的基础） */
export function buildBlocks(resume: ResumeData, locale: Locale, layout: Layout): BlockTree {
  const basics: Block = { id: "basics", type: "basics" };
  const sidebar: Block[] = [];
  const main: Block[] = [];

  const ordered = [...resume.sections].sort((a, b) => a.order - b.order);

  const pushSection = (target: Block[], section: (typeof ordered)[number]) => {
    const title = localizedText(section.title, locale) || "";
    const head: Block = {
      id: `head_${section.id}`,
      type: "section-head",
      sectionId: section.id,
      title,
      keepWithNext:
        section.items.length > 0 || (section.kind === "skills" && section.groups.length > 0),
    };
    target.push(head);
    if (section.kind === "skills") {
      for (const g of section.groups) {
        target.push({ id: `grp_${g.id}`, type: "skill-group", sectionId: section.id, group: g });
      }
    } else {
      for (const it of section.items) {
        target.push({
          id: `it_${it.id}`,
          type: "item",
          sectionId: section.id,
          hasHeader: section.kind !== "summary",
          item: it,
        });
      }
    }
  };

  for (const section of ordered) {
    if (!section.visible) continue;
    if (layout === "sidebar") {
      // 侧栏：基本信息 + 自我评价 + 专业技能；主栏：其余经历类
      if (section.kind === "skills" || section.kind === "summary") {
        pushSection(sidebar, section);
      } else {
        pushSection(main, section);
      }
    } else {
      pushSection(main, section);
    }
  }

  // 单栏：基本信息置于正文顶部
  if (layout !== "sidebar") {
    return { sidebar: [], main: [basics, ...main] };
  }
  if (sidebar[0]?.type !== "basics") sidebar.unshift(basics);
  return { sidebar, main };
}

export function itemDateLabel(item: ResumeItem, locale: Locale): string {
  return formatPeriod(item.startDate, item.endDate, item.current, locale);
}
