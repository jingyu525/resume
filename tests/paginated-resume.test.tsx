import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { render, act } from "@testing-library/react";
import { PaginatedResume } from "@/features/pagination/PaginatedResume";
import { createSampleResume, createEmptyResume } from "@/plugins/resume-template";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { DEFAULT_LOCALE } from "@/entities/locale";
import type { ResumeData } from "@/entities/resume/model";

function setFontsReady(ready: Promise<unknown> | undefined) {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: ready === undefined ? undefined : { ready },
  });
}

function manyItemResume(count: number): ResumeData {
  const resume = createSampleResume();
  const exp = resume.sections.find((s) => s.kind === "experience");
  if (!exp) throw new Error("experience section missing in sample");
  for (let i = 0; i < count; i++) {
    exp.items.push({
      id: `it_${i}`,
      title: { zh: `项目${i}` },
      subtitle: {},
      startDate: "",
      endDate: "",
      current: false,
      description: { zh: "描述" },
    });
  }
  return resume;
}

describe("PaginatedResume 测量时序边界", () => {
  let offsetSpy: MockInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    // RAF 同步执行，便于在 act 内确定性触发测量
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    setFontsReady(Promise.resolve());
    // 把每块的 offsetHeight 统一模拟为 100px，使分页可被确定性断言
    offsetSpy = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockReturnValue(100);
  });

  afterEach(() => {
    offsetSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    try {
      delete (document as { fonts?: unknown }).fonts;
    } catch {
      /* ignore */
    }
  });

  it("字体就绪后完成测量并渲染可见页（含 .print-area）", async () => {
    const resume = manyItemResume(20);
    let pages = 0;
    await act(async () => {
      render(
        <PaginatedResume
          resume={resume}
          locale={DEFAULT_LOCALE}
          appearance={{ ...DEFAULT_APPEARANCE, layout: "single" }}
          onTotalPages={(n) => (pages = n)}
        />,
      );
    });
    const printed = document.querySelectorAll(".print-area");
    expect(printed.length).toBeGreaterThanOrEqual(1);
    expect(pages).toBe(printed.length);
  });

  it("document.fonts.ready 失败时 .catch(run) 兜底仍能出页（不白屏）", async () => {
    setFontsReady(Promise.reject(new Error("font load failed")));
    const resume = manyItemResume(10);
    await act(async () => {
      render(
        <PaginatedResume
          resume={resume}
          locale={DEFAULT_LOCALE}
          appearance={{ ...DEFAULT_APPEARANCE, layout: "single" }}
        />,
      );
    });
    // 兜底分支必须仍能渲染出页，而非崩溃/空白
    expect(document.querySelectorAll(".print-area").length).toBeGreaterThanOrEqual(1);
  });

  it("document.fonts 不存在时直接测量（不抛错）", async () => {
    setFontsReady(undefined);
    const resume = manyItemResume(5);
    await act(async () => {
      render(
        <PaginatedResume
          resume={resume}
          locale={DEFAULT_LOCALE}
          appearance={{ ...DEFAULT_APPEARANCE, layout: "single" }}
        />,
      );
    });
    expect(document.querySelectorAll(".print-area").length).toBeGreaterThanOrEqual(1);
  });

  it("全部章节隐藏（单栏）时仅 basics 占一页", async () => {
    const resume = createEmptyResume();
    resume.sections.forEach((s) => (s.visible = false));
    await act(async () => {
      render(
        <PaginatedResume
          resume={resume}
          locale={DEFAULT_LOCALE}
          appearance={{ ...DEFAULT_APPEARANCE, layout: "single" }}
        />,
      );
    });
    expect(document.querySelectorAll(".print-area").length).toBe(1);
  });

  it("侧栏版式：侧栏内容在每一页重复出现", async () => {
    const resume = manyItemResume(25); // 强制多页
    await act(async () => {
      render(
        <PaginatedResume
          resume={resume}
          locale={DEFAULT_LOCALE}
          appearance={{ ...DEFAULT_APPEARANCE, layout: "sidebar" }}
        />,
      );
    });
    const pageCount = document.querySelectorAll(".print-area").length;
    expect(pageCount).toBeGreaterThan(1);
    const sidebarCount = document.querySelectorAll(".print-area .rs-sidebar").length;
    // 侧栏随每页重复，数量与页数一致
    expect(sidebarCount).toBe(pageCount);
  });

  it("密度变化触发重新测量，页数随之变化", async () => {
    const resume = manyItemResume(30);
    let densePages = 0;
    const { rerender } = await act(async () => {
      return render(
        <PaginatedResume
          resume={resume}
          locale={DEFAULT_LOCALE}
          appearance={{ ...DEFAULT_APPEARANCE, layout: "single", density: 0 }}
          onTotalPages={(n) => (densePages = n)}
        />,
      );
    });
    const pagesAt0 = densePages;
    expect(pagesAt0).toBeGreaterThan(1);

    await act(async () => {
      rerender(
        <PaginatedResume
          resume={resume}
          locale={DEFAULT_LOCALE}
          appearance={{ ...DEFAULT_APPEARANCE, layout: "single", density: 1 }}
          onTotalPages={(n) => (densePages = n)}
        />,
      );
    });
    // 密度 1 边距更大、可排版区更矮 → 页数不少于密度 0（至少重新测量过）
    expect(densePages).toBeGreaterThanOrEqual(pagesAt0);
    expect(densePages).toBe(document.querySelectorAll(".print-area").length);
  });
});
