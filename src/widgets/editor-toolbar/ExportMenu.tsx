import { useI18n } from "@/shared/i18n";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { ChevronDown, Download, Printer } from "lucide-react";
import { getDefaultExporter, listExporters } from "@/plugins/core/registry";
import { runExport } from "@/features/print-export/runExport";

/**
 * 导出入口：主按钮执行默认导出，箭头下拉列出其余导出器（M4：导出器可插拔）。
 *
 * 只有注册了除默认之外的导出器时才渲染箭头，避免多出一个无意义的按钮。
 * 新增导出器只需注册 ExporterPlugin，无需改动本组件。
 */
export function ExportMenu() {
  const { t } = useI18n();
  const defaultExporter = getDefaultExporter();
  const others = listExporters().filter((e) => e.id !== defaultExporter?.id);

  return (
    <div className="no-print ml-1 flex items-center">
      <Button
        size="sm"
        className={cn(others.length > 0 && "rounded-r-none")}
        onClick={() => defaultExporter && runExport(defaultExporter)}
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
            onClick: () => runExport(e),
          }))}
        />
      )}
    </div>
  );
}
