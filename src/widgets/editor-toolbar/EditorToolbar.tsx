import { Link } from "react-router-dom";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { Button, IconButton } from "@/shared/ui/button";
import { UndoRedoButtons } from "@/features/undo-redo/UndoRedo";
import { LanguageSwitcher } from "@/features/language-switch/LanguageSwitcher";
import { MoreMenu } from "@/widgets/editor-toolbar/MoreMenu";
import { triggerPrint } from "@/features/print-export/usePrint";
import { ACCENT_COLORS } from "@/shared/config/presets";
import { cn } from "@/shared/lib/cn";
import { FileText, Palette, Printer } from "lucide-react";

export function EditorToolbar({
  onToggleAppearance,
}: {
  onToggleAppearance: () => void;
}) {
  const { t } = useI18n();
  const appearance = useResumeStore((s) => s.appearance);
  const setAppearance = useResumeStore((s) => s.setAppearance);
  const locale = useResumeStore((s) => s.locale);

  return (
    <header className="flex h-14 items-center gap-2 overflow-x-auto border-b border-border bg-background/80 px-3 backdrop-blur-xl no-scrollbar">
      <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
          <FileText size={16} />
        </span>
        <span className="i18n-truncate hidden max-w-[8rem] sm:inline">{t("nav.brand")}</span>
      </Link>

      <div className="ml-1">
        <UndoRedoButtons />
      </div>

      {/* 主色快捷（宽屏） */}
      <div className="ml-2 hidden items-center gap-1 lg:flex">
        {ACCENT_COLORS.slice(0, 6).map((c) => (
          <button
            key={c.value}
            type="button"
            aria-label={c.label}
            title={c.label}
            onClick={() => setAppearance({ accent: c.value })}
            className={cn(
              "h-5 w-5 rounded-full border transition-transform",
              appearance.accent === c.value ? "border-foreground scale-110" : "border-transparent",
            )}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <IconButton label={t("appearance.title")} onClick={onToggleAppearance}>
          <Palette size={18} />
        </IconButton>
        <LanguageSwitcher showLabel={false} />
        <MoreMenu />
        <Button size="sm" className="ml-1 no-print" onClick={triggerPrint}>
          <Printer size={16} /> <span className="hidden sm:inline">{t("editor.print")}</span>
        </Button>
        <span className="sr-only">{locale}</span>
      </div>
    </header>
  );
}
