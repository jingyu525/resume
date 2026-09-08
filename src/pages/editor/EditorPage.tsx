import { useEffect, useState } from "react";
import { useI18n } from "@/shared/i18n";
import { useToast } from "@/shared/ui/toast";
import { loadError } from "@/store/persistence";
import { ensureStructure } from "@/store/useResumeStore";
import { useUndoRedoShortcuts } from "@/features/undo-redo/UndoRedo";
import { useExitGuard } from "@/features/persistence/useExitGuard";
import { EditPanel } from "@/features/resume-editing/EditPanel";
import { AppearancePanel } from "@/features/appearance-control/AppearancePanel";
import { EditorToolbar } from "@/widgets/editor-toolbar/EditorToolbar";
import { PreviewPane } from "@/widgets/preview-pane/PreviewPane";
import { FirstRunGuide } from "@/widgets/first-run/FirstRunGuide";
import { getUiPref } from "@/plugins/core/enabled";
import { Tabs } from "@/shared/ui/tabs";
import { IconButton } from "@/shared/ui/button";
import { X } from "lucide-react";

/** 编辑器页：桌面左编辑面板 + 右 A4 预览；移动端底部 Tab 切换编辑/预览，默认进预览（FR-2） */
export function EditorPage() {
  useUndoRedoShortcuts();
  useExitGuard();
  const { t } = useI18n();
  const toast = useToast();
  const [showAppearance, setShowAppearance] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("preview");
  const [onboarded, setOnboarded] = useState(() => getUiPref("rs_onboarded"));
  const [coach, setCoach] = useState(false);
  // 本地数据读取失败时明确告知：否则"打不开"会被当成"简历被清空"
  const [loadFailed] = useState(() => loadError() !== null);
  // 结构空是系统故障（章节结构没给到），兜底补种并提示，避免面对一片空白
  const [structureRepaired] = useState(() => ensureStructure());

  useEffect(() => {
    if (loadFailed) toast(t("toast.loadFailed"), "error");
    if (structureRepaired) toast(t("empty.noSections"), "error");
  }, [loadFailed, structureRepaired, toast, t]);

  return (
    <div className="flex h-screen flex-col">
      <EditorToolbar onToggleAppearance={() => setShowAppearance((v) => !v)} />

      {/* 桌面：双栏 */}
      <div className="hidden min-h-0 flex-1 md:flex">
        <aside className="w-[360px] shrink-0 overflow-auto border-r border-border">
          <EditPanel />
        </aside>
        <div className="min-h-0 flex-1">
          <PreviewPane coach={coach} />
        </div>
      </div>

      {/* 移动端：底部 Tab */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="border-b border-border p-2">
          <Tabs
            value={mobileTab}
            onChange={setMobileTab}
            options={[
              { value: "edit", label: t("editor.edit") },
              { value: "preview", label: t("editor.preview") },
            ]}
            className="w-full justify-center"
          />
        </div>
        <div className="min-h-0 flex-1">
          {mobileTab === "edit" ? (
            <div className="h-full overflow-auto">
              <EditPanel />
            </div>
          ) : (
            <PreviewPane coach={coach} />
          )}
        </div>
      </div>

      {/* 外观抽屉 */}
      {showAppearance && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAppearance(false)} />
          <div className="relative h-full w-80 max-w-[88vw] overflow-auto border-l border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-sm font-semibold">{t("appearance.title")}</span>
              <IconButton label={t("common.close")} onClick={() => setShowAppearance(false)}>
                <X size={16} />
              </IconButton>
            </div>
            <AppearancePanel />
          </div>
        </div>
      )}

      {!onboarded && (
        <FirstRunGuide
          onClose={() => {
            setOnboarded(true);
            setCoach(true);
          }}
        />
      )}
    </div>
  );
}
