import { useResumeStore } from "@/store/useResumeStore";
import { getDefaultExporter } from "@/plugins/core/registry";
import type { ExporterPlugin } from "@/plugins/core/types";
import { getDictionaries } from "@/plugins/core/dict";
import { translate } from "@/shared/i18n";
import { trackError, trackEvent } from "@/shared/analytics/analytics";

/**
 * 执行任意导出插件（M4：导出器可插拔，UI 暴露全部注册的导出器）。
 *
 * 返回是否成功：导出器失败时**抛错**即视为失败（绝不静默），由调用方给出可见提示。
 * 埋点只留粗粒度分类，不带上报错原文（隐私边界）。
 */
export async function runExport(exporter: ExporterPlugin): Promise<boolean> {
  if (!exporter) return false;
  const { resume, appearance, locale } = useResumeStore.getState();
  const dicts = getDictionaries();
  try {
    await exporter.run({
      resume,
      appearance,
      locale,
      t: (key, params) => translate(locale, key, params, dicts),
    });
    // 导出成功：按导出器 id 区分格式（如 export:pdf-generate），便于看各格式使用率
    trackEvent(`export:${exporter.id}`);
    return true;
  } catch {
    // 导出失败：粗粒度上报，便于发现线上异常（不暴露报错细节）
    trackError("export");
    return false;
  }
}

/**
 * 触发默认导出（FR-8）。
 *
 * 具体导出方式由 default 导出插件决定（规则 C7 保证 default 唯一）：
 * 内置为"一键导出 PDF 文件"（pdf-generate），M4 后可被其它插件替换或并列。
 */
export function runDefaultExport(): void {
  const exporter = getDefaultExporter();
  if (exporter) runExport(exporter);
}
