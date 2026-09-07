import { useEffect } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { savePersisted, STORAGE_VERSION } from "@/store/persistence";

/** 自动保存（FR-9 / NFR-2）：与历史/写盘解耦，防抖写盘，不阻塞编辑。写盘经 StoragePlugin。 */
export function useAutoSave() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useResumeStore.subscribe((state) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void savePersisted({
          version: STORAGE_VERSION,
          resume: state.resume,
          appearance: state.appearance,
        });
      }, 600);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, []);
}
