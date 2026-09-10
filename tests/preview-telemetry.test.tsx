import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

const { trackErrorMock, trackDiagnosticOnceMock, distributeMock } = vi.hoisted(() => ({
  trackErrorMock: vi.fn(),
  trackDiagnosticOnceMock: vi.fn(),
  distributeMock: vi.fn(),
}));

// 保留模块其它导出，只替换异常 / 诊断入口。
// 必须 mock 统一入口（trackError）而非底层 trackEvent：模块内部调用的是模块作用域内的
// 原函数，只替换导出不会影响内部引用，断言会永远落空。
vi.mock("@/shared/analytics/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/analytics/analytics")>();
  return {
    ...actual,
    trackError: trackErrorMock,
    trackDiagnosticOnce: trackDiagnosticOnceMock,
  };
});

// 默认走真实实现；用例可用 mockReturnValue([]) 覆盖成「分不出页」的异常
vi.mock("@/features/pagination/distribute", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/pagination/distribute")>();
  return {
    distributeBlocks: (...args: Parameters<typeof actual.distributeBlocks>) =>
      distributeMock(...args) ?? actual.distributeBlocks(...args),
  };
});

import { PaginatedResume } from "@/features/pagination/PaginatedResume";
import { createSampleResume } from "@/plugins/resume-template";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { DEFAULT_LOCALE } from "@/entities/locale";

function renderResume() {
  return render(
    <PaginatedResume
      resume={createSampleResume()}
      locale={DEFAULT_LOCALE}
      appearance={{ ...DEFAULT_APPEARANCE, layout: "single" }}
    />,
  );
}

describe("预览自检埋点（静默失效可观测）", () => {
  beforeEach(() => {
    trackErrorMock.mockClear();
    trackDiagnosticOnceMock.mockClear();
    distributeMock.mockClear();
    // 未设置返回值 → 走真实分页实现
    distributeMock.mockReturnValue(undefined);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    try {
      delete (document as { fonts?: unknown }).fonts;
    } catch {
      /* ignore */
    }
  });

  it("有块却分出 0 页时上报 error:preview-empty（错误遥测抓不到的静默失效）", async () => {
    distributeMock.mockReturnValue([]);
    await act(async () => {
      renderResume();
    });
    // 断言分类名即可：拼上平台维度的逻辑由 analytics-errors.test.ts 单独覆盖
    expect(trackErrorMock).toHaveBeenCalledWith("preview-empty");
  });

  it("正常分页时不误报 error:preview-empty", async () => {
    await act(async () => {
      renderResume();
    });
    expect(trackErrorMock).not.toHaveBeenCalledWith("preview-empty");
  });

  it("字体迟迟不 resolve 时上报 diag:fonts-pending（iOS 根因信号）", async () => {
    // 重置模块以还原「每会话仅一次」的上报标记，保证用例可独立运行
    vi.resetModules();
    vi.useFakeTimers();
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: new Promise(() => {}) },
    });
    const { PaginatedResume: Fresh } = await import(
      "@/features/pagination/PaginatedResume"
    );
    await act(async () => {
      render(
        <Fresh
          resume={createSampleResume()}
          locale={DEFAULT_LOCALE}
          appearance={{ ...DEFAULT_APPEARANCE, layout: "single" }}
        />,
      );
    });
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(trackDiagnosticOnceMock).toHaveBeenCalledWith("fonts-pending");
    vi.useRealTimers();
  });
});
