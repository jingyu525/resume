import type { ExporterPlugin } from "@/plugins/core/types";
import type { Locale } from "@/entities/locale";
import type { ResumeData } from "@/entities/resume/model";
import { localizedText } from "@/shared/lib/localized";
import { richTextToPlain } from "@/shared/lib/sanitize";

/**
 * 示范导出器：简历导出为 Markdown（.md）。
 *
 * 证明「导出器可插件安装」：无第三方依赖、纯前端生成并下载，与默认的
 * 「导出 PDF 文件」(pdf-generate) 走同一套 ExporterPlugin 契约（M4）。
 * 真实业务里若要导出 Word（.docx）或图片，照此契约再写一个插件、拉对应库即可，
 * 无需改动基类或 UI。
 */
function sectionToMarkdown(resume: ResumeData, locale: Locale): string {
  const lines: string[] = [];
  for (const section of resume.sections) {
    if (!section.visible) continue;
    const title = localizedText(section.title, locale) || section.kind;
    lines.push(`## ${title}`);
    for (const item of section.items) {
      const name = localizedText(item.title, locale);
      const sub = localizedText(item.subtitle, locale);
      const period = [item.startDate, item.current ? "—" : item.endDate].filter(Boolean).join(" ~ ");
      const head = [name, sub, period].filter(Boolean).join("  ·  ");
      lines.push(head ? `- **${head}**` : "- ");
      const desc = richTextToPlain(localizedText(item.description, locale));
      if (desc) lines.push(`  ${desc.replace(/\n/g, " ")}`);
    }
    for (const group of section.groups) {
      const gname = localizedText(group.name, locale);
      if (gname) lines.push(`- **${gname}**`);
      const gitems = localizedText(group.items, locale);
      if (gitems) lines.push(`  ${gitems.replace(/\n/g, "  \n")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function buildMarkdown(resume: ResumeData, locale: Locale): string {
  const basics = resume.basics;
  const name = localizedText(basics.name, locale);
  const title = localizedText(basics.title, locale);
  const contact = [
    basics.phone,
    basics.email,
    localizedText(basics.city, locale),
    basics.wechat,
    basics.website,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const out: string[] = [];
  if (name) out.push(`# ${name}`);
  if (title) out.push(`> ${title}`);
  if (contact) {
    out.push("");
    out.push(contact);
  }
  out.push("");
  out.push(sectionToMarkdown(resume, locale));
  return out.join("\n");
}

function download(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const markdownExporter: ExporterPlugin = {
  id: "markdown",
  kind: "exporter",
  labelKey: "export.markdown",
  version: 1,
  // 非默认：默认导出为「导出 PDF 文件」(pdf-generate.default = true)
  run({ resume, locale }) {
    const name = localizedText(resume.basics.name, locale) || "resume";
    download(`${name}.md`, buildMarkdown(resume, locale));
  },
};
