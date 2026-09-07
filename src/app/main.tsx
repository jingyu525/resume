// 插件注册必须最先执行：store 初始化与 migrate 都依赖注册表（见 app/bootstrap.ts）
import "@/app/bootstrap";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/styles/globals.css";
import { App } from "@/app/App";
import { useResumeStore } from "@/store/useResumeStore";
import { hydrateFromStorage } from "@/store/persistence";

// 远程存储插件（M5）无法同步读取，启动后异步回填一次；本地插件会直接跳过。
void hydrateFromStorage((resume, appearance) =>
  useResumeStore.getState().loadState(resume, appearance),
);

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
