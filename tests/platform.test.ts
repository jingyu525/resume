import { describe, it, expect } from "vitest";
import { isIOS, platformTag } from "@/shared/lib/platform";

function setUA(ua: string, maxTouchPoints = 0): void {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: ua,
  });
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: maxTouchPoints,
  });
}

describe("platform 判定（埋点诊断用）", () => {
  it("iPhone / iPad / iPod 判定为 iOS", () => {
    setUA("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)");
    expect(isIOS()).toBe(true);
    expect(platformTag()).toBe("ios");

    setUA("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)");
    expect(isIOS()).toBe(true);

    setUA("Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0 like Mac OS X)");
    expect(isIOS()).toBe(true);
  });

  it("带触控的 Mac（iPad 桌面模式）判定为 iOS", () => {
    setUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5);
    expect(isIOS()).toBe(true);
    expect(platformTag()).toBe("ios");
  });

  it("普通 Mac / Android / Windows 判定为非 iOS", () => {
    setUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0);
    expect(isIOS()).toBe(false);
    expect(platformTag()).toBe("other");

    setUA("Mozilla/5.0 (Linux; Android 13)");
    expect(isIOS()).toBe(false);

    setUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    expect(isIOS()).toBe(false);
  });
});
