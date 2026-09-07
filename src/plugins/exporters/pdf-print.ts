import type { ExporterPlugin } from "@/plugins/core/types";

/**
 * 默认导出：调用系统打印 → 另存为 PDF。
 *
 * 走 window.print() 而非前端 PDF 库：保留矢量文字（可搜索、可复制），
 * 屏幕专属元素由 `.no-print` 排除（FR-8）。这也是"本地优先"的选择——
 * 不引入额外依赖，不上传任何数据。
 */
export const pdfPrintExporter: ExporterPlugin = {
  id: "pdf-print",
  kind: "exporter",
  labelKey: "editor.print",
  version: 1,
  default: true,
  run: () => {
    window.print();
  },
};
