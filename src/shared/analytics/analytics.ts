// 隐私优先的轻量埋点（GoatCounter）。
//
// 设计原则（与「本地优先 / 不碰你的数据」定位一致）：
// - 免费、无 cookie、不收集个人身份信息，适合新手与隐私定位。
// - 默认完全关闭：构建时未设置 VITE_GOATCOUNTER_CODE 时，不加载任何脚本、零外部请求。
// - 用法：① 在 https://www.goatcounter.com 注册并创建站点，得到 code（如 resume-studio）；
//        ② 构建时设置 VITE_GOATCOUNTER_CODE=resume-studio（仓库 Variables）；③ 重新部署即可。
//
// 首屏页面浏览由 GoatCounter 脚本自动记录；SPA 路由切换由 trackPageview() 触发。

import { platformTag } from "../lib/platform";

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

// 保持与既有看板数据一致的形状：error:<kind>/<platform>/<tag...>
function errorPath(kind: string, tags: string[]): string {
  return [`error:${kind}`, platformTag(), ...tags].join("/");
}

function diagPath(kind: string, tags: string[]): string {
  return [`diag:${kind}`, platformTag(), ...tags].join("/");
}

/** 「每会话仅一次」标记：用于自动保存等高频路径限流，避免刷屏污染看板 */
const onceKeys = new Set<string>();

function markOnce(path: string): boolean {
  if (onceKeys.has(path)) return false;
  onceKeys.add(path);
  return true;
}

/**
 * 异常上报**统一入口**：自动附带平台等诊断维度。
 *
 * 之所以收敛成入口而非各处手拼字符串：平台这类通用维度靠人工拼接极易漏，
 * 漏了就只剩次数、看不出是不是 iOS 专属（error:export 就漏过一次）。
 * 走这里则自动带上，新增埋点不会再漏维度。
 *
 * 只接受粗粒度分类名 + 低基数标签；切勿传报错原文、堆栈或用户输入。
 */
export function trackError(kind: string, ...tags: string[]): void {
  trackEvent(errorPath(kind, tags));
}

/** 诊断 / 健康度上报：不是错误，但指示环境异常风险（如字体迟迟未就绪）。 */
export function trackDiagnostic(kind: string, ...tags: string[]): void {
  trackEvent(diagPath(kind, tags));
}

/** 每会话仅上报一次的异常（高频路径用）。 */
export function trackErrorOnce(kind: string, ...tags: string[]): void {
  const path = errorPath(kind, tags);
  if (markOnce(path)) trackEvent(path);
}

/** 每会话仅上报一次的诊断（高频路径用）。 */
export function trackDiagnosticOnce(kind: string, ...tags: string[]): void {
  const path = diagPath(kind, tags);
  if (markOnce(path)) trackEvent(path);
}

/**
 * 全局错误遥测：捕获未处理的 JS 错误与未兑现的 Promise rejection。
 * 未配置 code 时不绑定任何监听、零副作用。
 */
export function initErrorTracking(): void {
  if (!CODE || typeof window === "undefined") return;
  window.addEventListener("error", () => trackError("js"));
  window.addEventListener("unhandledrejection", () => trackError("promise"));
}
