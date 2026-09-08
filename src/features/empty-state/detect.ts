import type { Locale } from "@/entities/locale";
import type { ResumeData } from "@/entities/resume/model";
import { getSectionType } from "@/plugins/core/registry";
import { detectEmptySections } from "@/shared/lib/emptySections";
import { localizedText } from "@/shared/lib/localized";

/**
 * 简历的「空」有三种，混为一谈既让用户懵，也让系统把故障当正常：
 *
 *  - **结构空**（no-sections）：一个章节都没有。结构由系统提供，
 *    空说明系统没给到，是故障，必须自愈。
 *  - **渲染空**（all-hidden / missing-plugin）：内容在，但渲染不出来。
 *    用户看见一片空白却无从判断原因——最容易被误认为「数据丢了」。
 *  - **事实空**（no-content）：有章节但字段全空。用户还没开始填，
 *    是正常的初始态，需要的是引导而不是报错。
 */
export type ResumeEmptiness =
  | { kind: "ok" }
  | { kind: "no-sections" }
  | { kind: "all-hidden"; count: number }
  | { kind: "missing-plugin"; titles: string[] }
  | { kind: "no-content" };

export function detectEmptiness(resume: ResumeData, locale: Locale): ResumeEmptiness {
  if (resume.sections.length === 0) return { kind: "no-sections" };

  const visible = resume.sections.filter((s) => s.visible);
  if (visible.length === 0) return { kind: "all-hidden", count: resume.sections.length };

  // 能真正渲染的章节（buildBlocks 会跳过缺插件的）
  const renderable = visible.filter((s) => getSectionType(s.kind));
  if (renderable.length === 0) {
    return {
      kind: "missing-plugin",
      titles: visible.map((s) => localizedText(s.title, locale) || s.kind),
    };
  }

  // 剩下的都能渲染，再看是否真的有内容可出片
  const empty = detectEmptySections({ ...resume, sections: renderable }, locale);
  if (empty.length === renderable.length) return { kind: "no-content" };

  return { kind: "ok" };
}
