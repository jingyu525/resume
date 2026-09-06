import { useResumeStore } from "@/store/useResumeStore";
import { importPersisted, savePersisted, STORAGE_VERSION } from "@/store/persistence";
import { validateBackup } from "@/store/migrations";
import { useToast } from "@/shared/ui/toast";
import { useI18n } from "@/shared/i18n";

/** 导出备份：将当前简历与外观导出为本地 JSON 文件（FR-9） */
export function exportBackup() {
  const { resume, appearance } = useResumeStore.getState();
  const payload = { version: STORAGE_VERSION, resume, appearance };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  savePersisted(payload);
}

/** 导入备份：读取本地文件并恢复（带 schema 校验，失败给出明确提示，FR-9） */
export function useImportBackup() {
  const toast = useToast();
  const { t } = useI18n();
  return () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as unknown;
          if (!validateBackup(parsed)) {
            toast(t("toast.importFailed"), "error");
            return;
          }
          const { resume, appearance } = importPersisted(parsed);
          useResumeStore.getState().loadState(resume, appearance);
          toast(t("toast.imported"), "success");
        } catch {
          toast(t("toast.importFailed"), "error");
        }
      };
      reader.onerror = () => toast(t("toast.importFailed"), "error");
      reader.readAsText(file);
    };
    input.click();
  };
}
