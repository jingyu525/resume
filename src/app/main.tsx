// 插件注册必须最先执行：store 初始化与 migrate 都依赖注册表（见 app/bootstrap.ts）
import "@/app/bootstrap";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/styles/globals.css";
import { App } from "@/app/App";
import { useResumeStore, hydrateFromPersisted } from "@/store/useResumeStore";
import { hydrateFromStorage } from "@/store/persistence";
import { initAnalytics, initErrorTracking } from "@/shared/analytics/analytics";
import { registerWebMcpTools } from "@/app/webmcp";

// 本地存储恢复：必须在插件注册之后（第一个 import 已保证），详见 hydrateFromPersisted 注释
hydrateFromPersisted();

// 隐私优先埋点：未配置 VITE_GOATCOUNTER_CODE 时不加载、零外部请求
initAnalytics();
// 全局错误遥测：未配置时零副作用（与埋点一致）
initErrorTracking();

// WebMCP：把简历能力注册为浏览器内 AI 代理可调用的工具。
// 必须晚于 hydrateFromPersisted()：工具的 execute 直接读写 store。
// 不支持该协议的浏览器（需 Chrome 149+ 且开启源试用）静默跳过，零副作用。
void registerWebMcpTools();

// 异步存储插件（无 loadSync）启动后回填一次；本地插件会直接跳过。
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
