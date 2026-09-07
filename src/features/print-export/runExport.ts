import { useResumeStore } from "@/store/useResumeStore";
import { getDefaultExporter } from "@/plugins/core/registry";
import type { ExporterPlugin } from "@/plugins/core/types";
import { getDictionaries } from "@/plugins/core/dict";
import { translate } from "@/shared/i18n";

/** 执行任意导出插件（M4：导出器可插拔，UI 暴露全部注册的导出器）。 */
export function runExport(exporter: ExporterPlugin): void {
  if (!exporter) return;
  const { resume, appearance, locale } = useResumeStore.getState();
  const dicts = getDictionaries();
  void exporter.run({
    resume,
    appearance,
    locale,
    t: (key, params) => translate(locale, key, params, dicts),
  });
}

/**
 * 触发默认导出（FR-8）。
 *
 * 具体导出方式由 default 导出插件决定（规则 C7 保证 default 唯一）：
 * 内置为"系统打印 → 另存为 PDF"，M4 后可被其它插件替换或并列。
 */
export function runDefaultExport(): void {
  const exporter = getDefaultExporter();
  if (exporter) runExport(exporter);
}
