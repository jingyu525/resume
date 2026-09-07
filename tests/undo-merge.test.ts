import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useResumeStore } from "@/store/useResumeStore";
import { createEmptyResume } from "@/plugins/resume-template";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";

describe("撤销/重做合并步（FR-10）", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useResumeStore.temporal.getState().clear();
    // 用 setState 直接重置并冲刷可能残留的防抖入栈，再清一次历史
    useResumeStore.setState({
      resume: createEmptyResume(),
      appearance: { ...DEFAULT_APPEARANCE },
    });
    vi.advanceTimersByTime(450);
    useResumeStore.temporal.getState().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("连续打字合并为一步", () => {
    const before = useResumeStore.temporal.getState().pastStates.length;
    const { updateBasicPlain } = useResumeStore.getState();
    updateBasicPlain("phone", "1");
    updateBasicPlain("phone", "12");
    updateBasicPlain("phone", "123");
    vi.advanceTimersByTime(500);
    const after = useResumeStore.temporal.getState().pastStates.length;
    expect(after - before).toBe(1);
  });

  it("界面语言切换不进入撤销历史", () => {
    const before = useResumeStore.temporal.getState().pastStates.length;
    useResumeStore.getState().setLocale("en");
    vi.advanceTimersByTime(500);
    const after = useResumeStore.temporal.getState().pastStates.length;
    expect(after).toBe(before);
  });

  it("撤销可恢复原值", () => {
    useResumeStore.getState().updateBasicPlain("website", "a.com");
    vi.advanceTimersByTime(500);
    useResumeStore.temporal.getState().undo();
    expect(useResumeStore.getState().resume.basics.website).toBe("");
  });
});
