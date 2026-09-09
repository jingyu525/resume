// 隐私优先的轻量埋点（Plausible）。
//
// 设计原则（与「本地优先 / 不碰你的数据」定位一致）：
// - 默认完全关闭：构建时未设置 VITE_PLAUSIBLE_DOMAIN 时，不加载任何脚本、不发起任何网络请求。
// - 开启后采用 Plausible：无 cookie、不收集个人身份信息、GDPR 友好；
//   可指向自建 Plausible 实例（VITE_PLAUSIBLE_SRC），数据不出自有域名。
// - 纯前端 SPA：首屏由 Plausible 脚本自动记录，路由切换由 trackPageview() 触发。
//
// 用法：入口调用 initAnalytics()；SPA 路由切换调用 trackPageview()。

const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
const SRC =
  (import.meta.env.VITE_PLAUSIBLE_SRC as string | undefined) ||
  "https://plausible.io/js/script.js";

let started = false;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

/** 加载埋点脚本（仅当配置了域名）。幂等，多次调用安全。 */
export function initAnalytics(): void {
  if (started || !DOMAIN) return;
  started = true;

  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = SRC;
  script.setAttribute("data-domain", DOMAIN);
  document.head.appendChild(script);
}

/** 记录一次页面浏览（用于 SPA 路由切换）。未配置时静默跳过。 */
export function trackPageview(): void {
  if (!DOMAIN) return;
  window.plausible?.("pageview");
}
