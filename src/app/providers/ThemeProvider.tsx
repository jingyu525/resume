import { useEffect, type ReactNode } from "react";
import { useResumeStore } from "@/store/useResumeStore";

/** 明暗模式：light 强制浅色、dark 强制深色、system 跟随系统偏好（FR-1） */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useResumeStore((s) => s.appearance.mode);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const isDark = mode === "dark" || (mode === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", isDark);
    };
    apply();
    // 仅 system 模式需要跟随系统切换；手动模式不监听，避免用户选择被系统偏好覆盖
    if (mode === "system") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [mode]);
  return <>{children}</>;
}
