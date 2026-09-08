import { useState } from "react";
import { useI18n } from "@/shared/i18n";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/cn";
import { ChevronDown, Download, Printer, AlertTriangle } from "lucide-react";
import { getDefaultExporter, listExporters } from "@/plugins/core/registry";
import type { ExporterPlugin } from "@/plugins/core/types";
import { getUiPref, setUiPref } from "@/plugins/core/enabled";
import { runExport } from "@/features/print-export/runExport";
import { useResumeStore } from "@/store/useResumeStore";
import { detectEmptySections, type EmptySection } from "@/shared/lib/emptySections";

const GUIDE_DISMISS_KEY = "rs_pdfGuideDismissed";

/** 走打印对话框的导出器（pdf-print / pdf-download）才需要"如何选 PDF"引导；
 *  markdown 为直接文件下载，无打印步骤。 */
function needsPrintGuide(exporter: ExporterPlugin): boolean {
  return exporter.id !== "markdown";
}

/**
 * 导出入口：主按钮执行默认导出，箭头下拉列出其余导出器（M4：导出器可插拔）。
 *
 * 打印类导出前先弹一次跨平台"如何另存为 PDF"引导（P：消除 Windows/Linux 认知落差），
 * 用户勾选"不再提示"后写入 localStorage 永久跳过。导出前再校验空章节
 * （P1-6）：存在空章节时弹确认框，用户确认后才真正导出。
 * 只有注册了除默认之外的导出器时才渲染箭头。
 */
export function ExportMenu() {
  const { t } = useI18n();
  const defaultExporter = getDefaultExporter();
  const others = listExporters().filter((e) => e.id !== defaultExporter?.id);
  const [pending, setPending] = useState<{ exporter: ExporterPlugin; empty: EmptySection[] } | null>(null);
  const [guideExporter, setGuideExporter] = useState<ExporterPlugin | null>(null);
  const [dontShow, setDontShow] = useState(false);

  const doExport = (exporter: ExporterPlugin) => {
    const { resume, locale } = useResumeStore.getState();
    const empty = detectEmptySections(resume, locale);
    if (empty.length > 0) {
      setPending({ exporter, empty });
    } else {
      runExport(exporter);
    }
  };

  const startExport = (exporter: ExporterPlugin) => {
    // 实时读取：若统一首用序列已教过 PDF 用法（或用户曾在引导里勾选"不再提示"），则不重复弹
    const pdfGuideDismissed = getUiPref(GUIDE_DISMISS_KEY);
    if (needsPrintGuide(exporter) && !pdfGuideDismissed) {
      setGuideExporter(exporter);
      return;
    }
    doExport(exporter);
  };

  const confirmExport = () => {
    if (pending) runExport(pending.exporter);
    setPending(null);
  };

  const confirmGuide = () => {
    if (dontShow) setUiPref(GUIDE_DISMISS_KEY, true);
    const exporter = guideExporter;
    setGuideExporter(null);
    setDontShow(false);
    if (exporter) doExport(exporter);
  };

  const closeGuide = () => {
    setGuideExporter(null);
    setDontShow(false);
  };

  return (
    <>
      <div className="no-print ml-1 flex items-center">
        <Button
          size="sm"
          className={cn(others.length > 0 && "rounded-r-none")}
          onClick={() => defaultExporter && startExport(defaultExporter)}
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
              onClick: () => startExport(e),
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

      <Dialog
        open={guideExporter !== null}
        onClose={closeGuide}
        title={t("export.pdfGuide.title")}
      >
        <p className="text-sm text-muted-foreground">{t("export.pdfGuide.desc")}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <span className="font-medium">macOS</span>
            <span className="text-muted-foreground">{t("export.pdfGuide.mac")}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="font-medium">Windows</span>
            <span className="text-muted-foreground">{t("export.pdfGuide.win")}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="font-medium">Linux</span>
            <span className="text-muted-foreground">{t("export.pdfGuide.linux")}</span>
          </li>
        </ul>
        <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
          />
          {t("export.pdfGuide.dontShow")}
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={closeGuide}>
            {t("common.cancel")}
          </Button>
          <Button onClick={confirmGuide}>{t("export.pdfGuide.continue")}</Button>
        </div>
      </Dialog>
    </>
  );
}
