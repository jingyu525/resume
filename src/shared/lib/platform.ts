/**
 * 运行环境判定（仅用于埋点诊断）。
 *
 * 隐私边界：只做粗粒度归类（ios / other），不采集 UA 原文、不传报错堆栈——
 * 与项目「本地优先 / 不碰你的数据」定位一致，也避免高基数污染看板。
 */

/** iOS 判定：iPhone/iPad/iPod，或带触控的 Mac（iPad 桌面模式会被识别成 Mac）。 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iP(hone|ad|od)/.test(ua) ||
    (ua.includes("Mac") && (navigator.maxTouchPoints ?? 0) > 1)
  );
}

/** 埋点用的平台标签，仅 ios / other 两类（低基数，便于看板聚合）。 */
export function platformTag(): string {
  return isIOS() ? "ios" : "other";
}
