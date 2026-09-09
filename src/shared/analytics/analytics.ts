// 隐私优先的轻量埋点（GoatCounter）。
//
// 设计原则（与「本地优先 / 不碰你的数据」定位一致）：
// - 免费、无 cookie、不收集个人身份信息，适合新手与隐私定位。
// - 默认完全关闭：构建时未设置 VITE_GOATCOUNTER_CODE 时，不加载任何脚本、零外部请求。
// - 用法：① 在 https://www.goatcounter.com 注册并创建站点，得到 code（如 resume-studio）；
//        ② 构建时设置 VITE_GOATCOUNTER_CODE=resume-studio（仓库 Variables）；③ 重新部署即可。
//
// 首屏页面浏览由 GoatCounter 脚本自动记录；SPA 路由切换由 trackPageview() 触发。

const CODE = import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined;
const SRC =
  (import.meta.env.VITE_GOATCOUNTER_SRC as string | undefined) ||
  "https://gc.zgo.at/count.js";

let started = false;

declare global {
  interface Window {
    goatcounter?: {
      count: (opts?: { path?: string; title?: string; event?: boolean }) => void;
      [key: string]: unknown;
    };
  }
}

/** 加载埋点脚本（仅当配置了 code）。幂等，多次调用安全。 */
export function initAnalytics(): void {
  if (started || !CODE) return;
  started = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = SRC;
  script.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`;
  document.head.appendChild(script);
}

/** 记录一次页面浏览（用于 SPA 路由切换）。未配置时静默跳过。 */
export function trackPageview(): void {
  if (!CODE) return;
  window.goatcounter?.count();
}

/**
 * 记录一个自定义事件（用于转化漏斗 / 功能使用统计）。未配置时静默跳过。
 * 仅用粗粒度分类名（如 "export:pdf-generate" / "template_switch"），
 * 切勿传入用户输入或报错原文——既保隐私，也避免高基数污染看板。
 */
export function trackEvent(name: string): void {
  if (!CODE) return;
  window.goatcounter?.count({ event: true, path: name });
}

/**
 * 全局错误遥测：捕获未处理的 JS 错误与未兑现的 Promise rejection，
 * 上报粗粒度分类（error:js / error:promise），不传报错原文或堆栈。
 * 与 initAnalytics 一致：未配置 code 时不绑定任何监听、零副作用。
 */
export function initErrorTracking(): void {
  if (!CODE || typeof window === "undefined") return;
  const report = (kind: string) =>
    window.goatcounter?.count({ event: true, path: `error:${kind}` });
  window.addEventListener("error", () => report("js"));
  window.addEventListener("unhandledrejection", () => report("promise"));
}
