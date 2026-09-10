import type { ExportContext, ExporterPlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { isIOS } from "@/shared/lib/platform";
import { trackError } from "@/shared/analytics/analytics";

const A4_W_MM = 210;
const A4_H_MM = 297;
// 截图倍率：A4 @96dpi ≈ 794px，×2 ≈ 1588px，文字足够清晰且文件体积可控
const CAPTURE_SCALE = 2;
/** object URL 延迟回收时间：确保下载/打开已开始 */
const REVOKE_DELAY_MS = 15000;

async function generatePdfBlob(): Promise<Blob | null> {
  const pages = Array.from(document.querySelectorAll<HTMLElement>(".print-area"));
  if (pages.length === 0) return null;

  // 等字体就绪，避免字形/分页错位；字体加载失败也不阻塞导出（兜底，绝不白屏）
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => {});
  }

  // 仅在用户点击导出时动态加载（代码分割 + 不拖累首屏/测试）
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas-pro")).default;

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: CAPTURE_SCALE,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    // 无 footer：直接铺满整页 A4（分页已保证每页内容落在 297mm 内）
    const img = canvas.toDataURL("image/jpeg", 0.95);
    if (i > 0) doc.addPage();
    doc.addImage(img, "JPEG", 0, 0, A4_W_MM, A4_H_MM);
  }

  return doc.output("blob");
}

/** HTML 转义：文件名来自用户输入，写入文档前必须转义（防 XSS） */
function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/** blob → data URL。iOS 上另一个 document 解析不了本页创建的 blob URL，data URL 无此限制。 */
function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("readAsDataURL failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * 承载 PDF 的页面骨架：用铺满视口的 iframe，而不是顶层导航。
 *
 * iOS Safari 会阻止顶层导航到 blob:/data: URL（表现为「跳转到空白页」），
 * 但把它们作为 iframe 子资源加载是允许的，交由系统 PDF 查看器渲染。
 */
function pdfPageHtml(src: string, title: string): string {
  return (
    "<!doctype html><html><head>" +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${escapeHtml(title)}</title>` +
    "<style>html,body{margin:0;height:100%;background:#fff}" +
    "iframe{display:block;width:100%;height:100%;border:0}</style>" +
    "</head><body>" +
    `<iframe src="${src}" type="application/pdf"></iframe>` +
    "</body></html>"
  );
}

/** 在用户手势内预开的空白页中渲染 PDF */
function renderInOpenedWindow(win: Window, src: string, title: string): void {
  win.document.open();
  win.document.write(pdfPageHtml(src, title));
  win.document.close();
}

/**
 * window.open 被拦截时的兜底：在当前页铺一层覆盖式 iframe。
 * src 在当前 document 内始终有效（无论 data: 还是 blob:），不受跨窗口限制。
 */
function renderOverlay(src: string, title: string, closeLabel: string): void {
  const overlay = document.createElement("div");
  overlay.className = "no-print";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", title);
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:10000;background:#fff;display:flex;flex-direction:column";

  const bar = document.createElement("div");
  bar.style.cssText =
    "display:flex;justify-content:flex-end;padding:8px 12px;border-bottom:1px solid #e5e7eb";

  const close = document.createElement("button");
  close.type = "button";
  close.textContent = closeLabel;
  close.setAttribute("aria-label", closeLabel);
  close.style.cssText =
    "appearance:none;border:1px solid #d4d4d8;background:#fff;border-radius:6px;" +
    "padding:6px 12px;font-size:14px;color:#18181b;cursor:pointer";
  close.addEventListener("click", () => overlay.remove());

  const frame = document.createElement("iframe");
  frame.src = src;
  frame.title = title;
  frame.style.cssText = "flex:1 1 auto;width:100%;border:0;background:#fff";

  bar.appendChild(close);
  overlay.appendChild(bar);
  overlay.appendChild(frame);
  document.body.appendChild(overlay);
}

/** 非 iOS：直接走 <a download> 下载 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

/**
 * iOS 导出：一律用 iframe 子资源呈现 PDF，绝不顶层导航。
 * 优先 data URL（无跨 document 限制）；转换失败才回退 blob URL 并延迟回收。
 */
async function exportOnIOS(
  blob: Blob,
  name: string,
  win: Window | null,
  t: ExportContext["t"],
): Promise<void> {
  let src: string;
  let isBlobUrl = false;
  try {
    src = await toDataUrl(blob);
  } catch {
    src = URL.createObjectURL(blob);
    isBlobUrl = true;
  }

  if (win) {
    renderInOpenedWindow(win, src, name);
  } else {
    renderOverlay(src, name, t("common.close"));
  }
  if (isBlobUrl) setTimeout(() => URL.revokeObjectURL(src), REVOKE_DELAY_MS);
}

/**
 * 方案3：纯前端生成 PDF 文件，绕过浏览器/iOS 打印管线，
 * 因此不会带系统注入的「页码 + 网址」页脚（无 footer，最干净专业）。
 * 复用预览里已分页的 .print-area 元素逐页截图，零排版重写，预览即所得。
 * jspdf / html2canvas-pro（oklch 兼容分支）仅在导出时动态加载。
 */
export const pdfGenerateExporter: ExporterPlugin = {
  id: "pdf-generate",
  kind: "exporter",
  labelKey: "export.pdfFile",
  version: 1,
  default: true,
  async run({ resume, locale, t }: ExportContext) {
    const isIos = isIOS();
    // iOS Safari 的弹窗拦截依赖「用户手势」：异步生成完成后 window.open 会失效，
    // 因此必须在点击事件的手势窗口内先开一个空白新标签，稍后把 PDF 写进去。
    const iosWin = isIos ? window.open("", "_blank", "noopener") : null;
    const name = localizedText(resume.basics.name, locale) || "resume";
    const blob = await generatePdfBlob();
    if (!blob) {
      // 没有 .print-area = 导出什么都没发生（用户点了没反应），属静默失败
      trackError("export-empty");
      iosWin?.close();
      return;
    }
    if (isIos) {
      await exportOnIOS(blob, name, iosWin, t);
      return;
    }
    downloadBlob(blob, `${name}.pdf`);
  },
};
