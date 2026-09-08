import { useEffect, useRef } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { savePersisted, STORAGE_VERSION } from "@/store/persistence";
import { useI18n } from "@/shared/i18n";
import { useToast } from "@/shared/ui/toast";
import { markDirty, clearDirty } from "./dirty";

/** 写盘失败只在「首次失败」提示一次：配额写满时每次防抖都会失败，反复弹窗会刷屏 */
let notifiedFailure = false;

/**
 * 自动保存（FR-9 / NFR-2）：与历史/写盘解耦，防抖写盘，不阻塞编辑。写盘经 StoragePlugin。
 *
 * 写盘失败时**保留未保存标记**：退出拦截因此继续生效，
 * 不会出现「以为存了、其实没存」的静默丢数据。
 */
export function useAutoSave() {
  const toast = useToast();
  const { t } = useI18n();
  // 用 ref 持有最新提示函数，effect 只订阅一次。
  // 若把 toast/t 放进依赖，每次渲染都会重建订阅并重置防抖计时器，
  // 频繁渲染时防抖永远等不到触发，反而真的写不了盘。
  const notifyFailure = useRef<() => void>(() => {});
  notifyFailure.current = () => toast(t("toast.saveFailed"), "error");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useResumeStore.subscribe((state) => {
      markDirty();
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const ok = await savePersisted({
          version: STORAGE_VERSION,
          resume: state.resume,
          appearance: state.appearance,
        });
        if (ok) {
          clearDirty();
          notifiedFailure = false;
          return;
        }
        // 写盘失败：保留 dirty 让退出拦截继续兜住，并提示用户尽快导出备份
        if (!notifiedFailure) {
          notifyFailure.current();
          notifiedFailure = true;
        }
      }, 600);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, []);
}
