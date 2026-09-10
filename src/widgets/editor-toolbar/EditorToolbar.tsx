import { Link } from "react-router-dom";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { IconButton } from "@/shared/ui/button";
import { UndoRedoButtons } from "@/features/undo-redo/UndoRedo";
import { LanguageSwitcher } from "@/features/language-switch/LanguageSwitcher";
import { MoreMenu } from "@/widgets/editor-toolbar/MoreMenu";
import { ExportMenu } from "./ExportMenu";
import { FeedbackButton } from "@/widgets/feedback/FeedbackButton";
import { exportBackup } from "@/features/backup-io/backup";
import { useToast } from "@/shared/ui/toast";
import { ACCENT_COLORS } from "@/shared/config/presets";
import { cn } from "@/shared/lib/cn";
import { FileText, Palette, DatabaseBackup, Sun, Moon } from "lucide-react";

export function EditorToolbar({
  onToggleAppearance,
}: {
  onToggleAppearance: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const appearance = useResumeStore((s) => s.appearance);
  const setAppearance = useResumeStore((s) => s.setAppearance);
  const locale = useResumeStore((s) => s.locale);
  const mode = appearance.mode;
  const prefersDark =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);

  return (
    <header className="relative z-50 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-xl">
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
        {/*
          窄屏工具栏放不下这么多控件，而多出来的宽度会把最右侧的「导出 PDF」
          挤出视口（点不到 → 用户只能点到旁边的备份按钮）。这里让明暗快捷
          在小屏退场，外观面板内仍有等价的「主题模式」三选。
        */}
        <IconButton
          label={t("appearance.mode")}
          title={`${t("appearance.mode")}: ${t(`appearance.mode.${mode}`)}`}
          className="hidden sm:grid"
          onClick={() => setAppearance({ mode: isDark ? "light" : "dark" })}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
        <LanguageSwitcher showLabel={false} />
        {/*
          备份是一级入口，不藏在「更多」里：本地存储是易失的（清缓存 / 换设备 /
          配额写满），而简历内容是用户唯一无法重建的东西——备份才是它真正的保险。

          保持紧凑图标、不带文字：工具栏右端入口已经很密，文字会把最右侧的
          「导出 PDF 文件」挤出窄屏视口（那正是用户点不到它、转而误点备份的原因）。
        */}
        <IconButton
          label={t("more.export")}
          onClick={() => {
            exportBackup();
            toast(t("toast.exported"));
          }}
        >
          <DatabaseBackup size={18} />
        </IconButton>
        <FeedbackButton />
        <MoreMenu />
        <ExportMenu />
        <span className="sr-only">{locale}</span>
      </div>
    </header>
  );
}
