import type { ExportContext, ExporterPlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";

const A4_W_MM = 210;
const A4_H_MM = 297;
// 截图倍率：A4 @96dpi ≈ 794px，×2 ≈ 1588px，文字足够清晰且文件体积可控
const CAPTURE_SCALE = 2;

/** iOS Safari 忽略 <a download>，需走新标签交给系统 PDF 查看器。 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iP(hone|ad|od)/.test(ua) ||
    (ua.includes("Mac") && (navigator.maxTouchPoints ?? 0) > 1)
  );
}

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

function saveBlob(blob: Blob, filename: string, iosWin?: Window | null): void {
  const url = URL.createObjectURL(blob);
  if (iosWin) {
    // 已提前在用户手势内开好的新标签，直接导航到生成的 PDF，
    // 交给系统查看器 → Share → 存到「文件」
    iosWin.location.href = url;
  } else if (isIOS()) {
    // 兜底：直接点锚点（少数情况下 window.open 被禁用）
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  // 延迟回收，确保下载/打开已开始
  setTimeout(() => URL.revokeObjectURL(url), 15000);
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
  async run({ resume, locale }: ExportContext) {
    // iOS Safari 的弹窗拦截依赖「用户手势」：异步生成完成后 window.open 会失效，
    // 因此必须在点击事件的手势窗口内先开一个空白新标签，稍后把 PDF 导航进去。
    const iosWin = isIOS() ? window.open("", "_blank", "noopener") : null;
    const name = localizedText(resume.basics.name, locale) || "resume";
    const blob = await generatePdfBlob();
    if (!blob) {
      iosWin?.close();
      return;
    }
    saveBlob(blob, `${name}.pdf`, iosWin);
  },
};
