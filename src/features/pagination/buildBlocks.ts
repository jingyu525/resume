import type { Locale } from "@/entities/locale";
import type { Layout } from "@/entities/appearance/model";
import type { ResumeData, ResumeItem } from "@/entities/resume/model";
import { formatPeriod } from "@/shared/lib/format";
// Block / BlockTree 定义在 shared/types/block.ts：章节类型插件要用它描述产出，
// 而插件层不得反向依赖 features（规则 A4）。此处 re-export，调用方无需改动。
import type { Block, BlockTree } from "@/shared/types/block";
import { getSectionType } from "@/plugins/core/registry";

export type { Block, BlockTree };

/**
 * 将简历内容转为有序、不可拆的"原子块"列表（FR-7 单块不跨页的基础）。
 *
 * 产块方式由章节类型插件决定（规则 G5：此处不得再按 kind 分支）：
 * 插件通过 toBlocks 声明自己切成几个块、块是否 keepWithNext，
 * 通过 placement 声明侧栏版式下归入侧栏还是主栏。
 */
export function buildBlocks(resume: ResumeData, locale: Locale, layout: Layout): BlockTree {
  const basics: Block = { id: "basics", type: "basics" };
  const sidebar: Block[] = [];
  const main: Block[] = [];

  const ordered = [...resume.sections].sort((a, b) => a.order - b.order);

  for (const section of ordered) {
    if (!section.visible) continue;
    const plugin = getSectionType(section.kind);
    // 未安装/已禁用插件的章节：数据保留（migrate 保证），此处不渲染，避免整页崩溃
    if (!plugin) continue;
    const blocks = plugin.toBlocks(section, { locale, layout });
    if (layout === "sidebar" && plugin.placement === "sidebar") {
      sidebar.push(...blocks);
    } else {
      main.push(...blocks);
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
