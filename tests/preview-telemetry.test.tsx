import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

const { trackEventMock, distributeMock } = vi.hoisted(() => ({
  trackEventMock: vi.fn(),
  distributeMock: vi.fn(),
}));

// 保留模块其它导出，只替换 trackEvent，避免影响加载链上的其他消费者
vi.mock("@/shared/analytics/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/analytics/analytics")>();
  return { ...actual, trackEvent: trackEventMock };
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
    trackEventMock.mockClear();
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
    expect(trackEventMock).toHaveBeenCalledWith(
      expect.stringContaining("error:preview-empty"),
    );
  });

  it("正常分页时不误报 error:preview-empty", async () => {
    await act(async () => {
      renderResume();
    });
    expect(trackEventMock).not.toHaveBeenCalledWith(
      expect.stringContaining("error:preview-empty"),
    );
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
    expect(trackEventMock).toHaveBeenCalledWith(
      expect.stringContaining("diag:fonts-pending"),
    );
    vi.useRealTimers();
  });
});
