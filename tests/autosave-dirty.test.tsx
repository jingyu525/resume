import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useResumeStore } from "@/store/useResumeStore";
import { useAutoSave } from "@/features/persistence/useAutoSave";
import { clearDirty, isDirty } from "@/features/persistence/dirty";
import { savePersisted, STORAGE_VERSION } from "@/store/persistence";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { createEmptyResume } from "@/plugins/resume-template";

/**
 * 模拟浏览器存储：failWrite=true 等价于配额写满 / 隐私模式（setItem 抛错）。
 * 不 mock 任何模块，走真实的「防抖 → savePersisted → 存储插件」链路。
 */
function installStorage(failWrite: boolean): void {
  const mem = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
      setItem: (k: string, v: string) => {
        if (failWrite) throw new Error("QuotaExceededError");
        mem.set(k, String(v));
      },
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() {
        return mem.size;
      },
    },
    configurable: true,
    writable: true,
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Probe() {
  useAutoSave();
  return null;
}

describe("自动保存：写盘失败不得假装成功", () => {
  it("savePersisted 如实返回写盘结果", async () => {
    const payload = {
      version: STORAGE_VERSION,
      resume: createEmptyResume(),
      appearance: { ...DEFAULT_APPEARANCE },
    };
    installStorage(false);
    expect(await savePersisted(payload)).toBe(true);

    installStorage(true);
    expect(await savePersisted(payload)).toBe(false);
  });

  it("写盘失败时保留未保存标记 —— 退出拦截才会继续生效", async () => {
    installStorage(true);
    clearDirty();
    render(<Probe />);

    act(() => {
      useResumeStore.getState().updateBasicPlain("phone", "138-0000-0000");
    });
    await act(async () => {
      await sleep(750); // > 600ms 防抖
    });

    // 没存上就必须仍是「脏」：否则关闭页面时不拦截，内容静默丢失
    expect(isDirty()).toBe(true);
  });

  it("写盘成功时清除未保存标记", async () => {
    installStorage(false);
    clearDirty();
    render(<Probe />);

    act(() => {
      useResumeStore.getState().updateBasicPlain("phone", "139-0000-0000");
    });
    await act(async () => {
      await sleep(750);
    });

    expect(isDirty()).toBe(false);
  });
});
