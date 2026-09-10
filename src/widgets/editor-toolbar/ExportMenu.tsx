import { useRef, useState } from "react";
import { useI18n } from "@/shared/i18n";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/cn";
import { ChevronDown, Download, AlertTriangle, Loader2 } from "lucide-react";
import { getDefaultExporter, listExporters } from "@/plugins/core/registry";
import type { ExporterPlugin } from "@/plugins/core/types";
import { runExport } from "@/features/print-export/runExport";
import { useResumeStore } from "@/store/useResumeStore";
import { detectEmptySections, type EmptySection } from "@/shared/lib/emptySections";
import { detectEmptiness } from "@/features/empty-state/detect";
import { useToast } from "@/shared/ui/toast";

/**
 * 导出入口：主按钮执行默认导出（M4：导出器可插拔，默认由插件 default 决定），
 * 箭头下拉列出其余导出器。导出前校验空章节（P1-6）：存在空章节时弹确认框，
 * 用户确认后才真正导出。只有注册了除默认之外的导出器时才渲染箭头。
 */
export function ExportMenu() {
  const { t } = useI18n();
  const toast = useToast();
  const defaultExporter = getDefaultExporter();
  const others = listExporters().filter((e) => e.id !== defaultExporter?.id);
  const [pending, setPending] = useState<{ exporter: ExporterPlugin; empty: EmptySection[] } | null>(null);
  const [busy, setBusy] = useState(false);
  // 生成耗时数秒，期间必须挡住重复点击：否则会叠加多个导出任务（iOS 上尤其明显）
  const busyRef = useRef(false);

  const fire = async (exporter: ExporterPlugin) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const ok = await runExport(exporter);
      // 失败必须让用户看见：旧实现只埋点，用户侧表现为「点了没反应」
      if (!ok) toast(t("export.fail"), "error");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const doExport = (exporter: ExporterPlugin) => {
    const { resume, locale } = useResumeStore.getState();
    /*
     * 整份简历还停在「事实空」（有章节但字段全空）：此时弹确认框等于只问
     * 「确定导出一份空简历？」，而用户真正的困惑是「不知道怎么开始」。
     * 直接引导去填，不提供「导出空白」这个选项。
     */
    if (detectEmptiness(resume, locale).kind === "no-content") {
      toast(t("export.emptyAll"), "error");
      return;
    }
    const empty = detectEmptySections(resume, locale);
    if (empty.length > 0) {
      setPending({ exporter, empty });
    } else {
      void fire(exporter);
    }
  };

  const confirmExport = () => {
    if (pending) void fire(pending.exporter);
    setPending(null);
  };

  return (
    <>
      <div className="no-print ml-1 flex items-center">
        <Button
          size="sm"
          className={cn(others.length > 0 && "rounded-r-none")}
          disabled={busy}
          onClick={() => defaultExporter && doExport(defaultExporter)}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span className="hidden sm:inline">
            {busy
              ? t("export.preparing")
              : defaultExporter
                ? t(defaultExporter.labelKey)
                : t("editor.print")}
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
              onClick: () => doExport(e),
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
