import { useEffect, type ReactNode } from "react";

/** 深浅色：跟随系统偏好自动切换（FR-1） */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return <>{children}</>;
}
