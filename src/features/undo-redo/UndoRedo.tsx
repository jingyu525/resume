import { useEffect } from "react";
import { useResumeStore, useTemporalStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { IconButton } from "@/shared/ui/button";
import { Undo2, Redo2 } from "lucide-react";

/** 全局撤销/重做（FR-10）：合并连续打字为一步（store 内 handleSet 防抖），快捷键与按钮一致 */
export function UndoRedoButtons() {
  const { t } = useI18n();
  const undo = useTemporalStore((s) => s.undo);
  const redo = useTemporalStore((s) => s.redo);
  const canUndo = useTemporalStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalStore((s) => s.futureStates.length > 0);

  return (
    <div className="flex items-center gap-0.5">
      <IconButton
        label={t("editor.undo")}
        onClick={() => undo()}
        disabled={!canUndo}
        className="no-print"
      >
        <Undo2 size={18} />
      </IconButton>
      <IconButton
        label={t("editor.redo")}
        onClick={() => redo()}
        disabled={!canRedo}
        className="no-print"
      >
        <Redo2 size={18} />
      </IconButton>
    </div>
  );
}

/** 快捷键：Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做 */
export function useUndoRedoShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        useResumeStore.temporal.getState().undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        useResumeStore.temporal.getState().redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
