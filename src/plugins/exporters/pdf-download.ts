import type { ExportContext, ExporterPlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";

/**
 * 直接下载 PDF（另存为）：与默认「打印」共用浏览器原生打印管线，
 * 但只截取 .print-area（A4 正文），并以简历姓名为默认文件名打印，
 * 避免把整个应用界面（顶栏 / 工具条 / 浮层）一起打印。
 *
 * 实现用「同页隐藏 iframe」承载打印内容并调用 iframe.contentWindow.print()：
 * 这不属于弹窗，不会被浏览器的弹窗拦截器拦下（window.open 新窗口会被拦，
 * 报错 "tried to open a blocked URL"），且同样保留矢量文字、零依赖、本地优先。
 *
 * - 保留矢量文字（可搜索、可复制），不上传任何数据（本地优先）。
 * - 不引入额外依赖，不触碰网络（NFR-1 / NFR-3）。
 * - 用户在打印对话框中选择「另存为 PDF」即可得到文件，默认文件名即简历姓名。
 *
 * 这是「导出格式扩展（直接生成 PDF）」的可插拔实现：与 markdown 导出器走同一
 * ExporterPlugin 契约，非默认（默认仍是 `pdf-print`）。
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadPdf(name: string): void {
  const areas = Array.from(document.querySelectorAll<HTMLElement>(".print-area"));
  if (areas.length === 0) return;

  const html = areas.map((el) => el.outerHTML).join("\n");
  // 复制当前页样式（含 @page 与 .print-area 规则），保证打印样式一致
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n");

  // 同页隐藏 iframe：打印它不会触发弹窗拦截器
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "";
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  const cleanup = () => iframe.remove();
  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
      name || "resume",
    )}</title>${styles}</head><body>${html}</body></html>`,
  );
  doc.close();

  const win = iframe.contentWindow;
  if (!win) return cleanup();

  const trigger = () => {
    win.focus();
    // 打印对话框关闭后再移除 iframe，避免打断打印队列
    win.addEventListener("afterprint", cleanup, { once: true });
    win.print();
  };
  // 等字体就绪再打印，避免首屏字体未加载导致分页/字形错位
  if (doc.fonts?.ready) {
    doc.fonts.ready.then(trigger).catch(trigger);
  } else {
    trigger();
  }
}

export const pdfDownloadExporter: ExporterPlugin = {
  id: "pdf-download",
  kind: "exporter",
  labelKey: "export.pdf",
  version: 1,
  // 非默认：默认导出仍是「打印 / 导出 PDF」（pdf-print.default = true）
  run({ resume, locale }: ExportContext) {
    const name = localizedText(resume.basics.name, locale) || "resume";
    downloadPdf(name);
  },
};
