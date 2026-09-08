import { useState } from "react";
import { useI18n } from "@/shared/i18n";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/cn";
import { ChevronDown, Download, Printer, AlertTriangle } from "lucide-react";
import { getDefaultExporter, listExporters } from "@/plugins/core/registry";
import type { ExporterPlugin } from "@/plugins/core/types";
import { runExport } from "@/features/print-export/runExport";
import { useResumeStore } from "@/store/useResumeStore";
import { detectEmptySections, type EmptySection } from "@/shared/lib/emptySections";

/**
 * 导出入口：主按钮执行默认导出，箭头下拉列出其余导出器（M4：导出器可插拔）。
 *
 * 导出前先校验空章节（P1-6）：存在空章节时弹确认框，用户确认后才真正导出。
 * 只有注册了除默认之外的导出器时才渲染箭头。
 */
export function ExportMenu() {
  const { t } = useI18n();
  const defaultExporter = getDefaultExporter();
  const others = listExporters().filter((e) => e.id !== defaultExporter?.id);
  const [pending, setPending] = useState<{ exporter: ExporterPlugin; empty: EmptySection[] } | null>(null);

  const handleExport = (exporter: ExporterPlugin) => {
    const { resume, locale } = useResumeStore.getState();
    const empty = detectEmptySections(resume, locale);
    if (empty.length > 0) {
      setPending({ exporter, empty });
    } else {
      runExport(exporter);
    }
  };

  const confirmExport = () => {
    if (pending) runExport(pending.exporter);
    setPending(null);
  };

  return (
    <>
      <div className="no-print ml-1 flex items-center">
        <Button
          size="sm"
          className={cn(others.length > 0 && "rounded-r-none")}
          onClick={() => defaultExporter && handleExport(defaultExporter)}
        >
          <Printer size={16} />
          <span className="hidden sm:inline">
            {defaultExporter ? t(defaultExporter.labelKey) : t("editor.print")}
          </span>
        </Button>

        {others.length > 0 && (
          <DropdownMenu
            align="end"
            trigger={
              <span
                className="grid h-8 w-6 place-items-center rounded-r-md border-l border-primary-foreground/25 bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                aria-label={t("export.others")}
                title={t("export.others")}
              >
                <ChevronDown size={14} />
              </span>
            }
            items={others.map((e) => ({
              label: t(e.labelKey),
              icon: <Download size={16} />,
              onClick: () => handleExport(e),
            }))}
          />
        )}
      </div>

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={t("export.emptyCheck")}
      >
        <p className="text-sm text-muted-foreground">
          {t("export.emptyHint", { n: String(pending?.empty.length ?? 0) })}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {pending?.empty.map((s, i) => (
            <li key={`${s.kind}-${i}`} className="flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              <span>{s.title || t(`sec.${s.kind}`)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPending(null)}>
            {t("export.emptyGoEdit")}
          </Button>
          <Button onClick={confirmExport}>{t("export.emptyStillExport")}</Button>
        </div>
      </Dialog>
    </>
  );
}
