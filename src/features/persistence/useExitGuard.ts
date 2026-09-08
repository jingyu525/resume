import { useEffect } from "react";
import { isDirty } from "./dirty";

/**
 * 退出拦截（P1-11）：存在尚未写盘的改动时，离开页面 / 刷新触发原生确认。
 *
 * 自动保存防抖 600ms 已写盘的不算「未保存」，因此只在写盘前那一小段时间拦截，
 * 既满足「未保存改动时提醒」，也不会在每次正常离开时误拦。
 */
export function useExitGuard(): void {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
}
