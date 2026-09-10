import { describe, it, expect, beforeEach } from "vitest";
// CODE 由 vite.config.ts 的 test.env 注入（非空时才会真正上报）
import { trackError, trackErrorOnce, trackDiagnostic } from "@/shared/analytics/analytics";

const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)";
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

function setUA(ua: string): void {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: ua,
  });
}

type Call = { path?: string; event?: boolean };

/** 用假的 goatcounter 捕获上报内容 */
function capture(): Call[] {
  const calls: Call[] = [];
  Object.defineProperty(window, "goatcounter", {
    configurable: true,
    value: {
      count: (opts?: Call) => {
        calls.push(opts ?? {});
      },
    },
  });
  return calls;
}

describe("异常上报统一入口", () => {
  let calls: Call[];

  beforeEach(() => {
    calls = capture();
  });

  it("自动附带平台标签（iOS）", () => {
    setUA(IOS_UA);
    trackError("export");
    expect(calls[0].path).toBe("error:export/ios");
  });

  it("自动附带平台标签（非 iOS）", () => {
    setUA(DESKTOP_UA);
    trackError("export");
    expect(calls[0].path).toBe("error:export/other");
  });

  it("附加额外低基数标签", () => {
    setUA(IOS_UA);
    trackError("save", "no-storage");
    expect(calls[0].path).toBe("error:save/ios/no-storage");
  });

  it("诊断事件使用 diag 前缀", () => {
    setUA(IOS_UA);
    trackDiagnostic("fonts-pending");
    expect(calls[0].path).toBe("diag:fonts-pending/ios");
  });

  it("Once 变体每会话只上报一次（自动保存等高频路径限流）", () => {
    setUA(DESKTOP_UA);
    trackErrorOnce("save");
    trackErrorOnce("save");
    trackErrorOnce("save");
    expect(calls.length).toBe(1);
    expect(calls[0].path).toBe("error:save/other");
  });

  it("以事件（而非页面浏览）形式上送", () => {
    setUA(DESKTOP_UA);
    trackError("preview-empty");
    expect(calls[0].event).toBe(true);
  });
});
