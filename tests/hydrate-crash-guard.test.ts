import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 存储读取异常不得导致整页白屏。
 *
 * 关键点：main.tsx 里 `hydrateFromPersisted()` 一旦抛出，后面的 createRoot 就不会执行，
 * 用户看到的是纯白页面——连一行错误提示都渲染不出来。所以这里必须守住「不抛出」。
 *
 * 用模块级 mock 让 migrate() 抛错来模拟脏数据：
 * vi.spyOn 对 ESM 命名导出不生效（已实测会导致测试假通过），故用 vi.mock。
 * 这样走的仍是真实的 loadPersisted → hydrateFromPersisted 链路。
 */
vi.mock("@/store/migrations", () => ({
  STORAGE_VERSION: 2,
  migrate: () => {
    throw new Error("corrupted storage");
  },
  validateBackup: () => false,
}));

/**
 * setup.ts 已经把真实的 migrations 加载进模块缓存了。
 * resetModules 让用例内的动态 import 重新加载，mock 才会真正生效
 * （否则拿到的是缓存里的真实 migrate，测试会假通过）。
 */
beforeEach(() => {
  vi.resetModules();
});

/** resetModules 会清空插件注册表，需重新注册 */
async function reBootstrap() {
  const { bootstrapPlugins } = await import("@/plugins/bootstrap");
  bootstrapPlugins();
}

const KEY = "resume-studio:v1";

/** 装一份"存在的数据"：没有数据时 loadPersisted 根本不会去调用 migrate，测不到异常 */
function installMemoryStorage(): void {
  const mem = new Map<string, string>([
    [KEY, JSON.stringify({ version: 2, resume: { basics: {}, sections: [] } })],
  ]);
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
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

describe("存储读取异常兜底（脏数据不得整页白屏）", () => {
  it("loadPersisted 降级为「无数据」并留下失败标记", async () => {
    installMemoryStorage();
    await reBootstrap();
    const { loadPersisted, loadError } = await import("@/store/persistence");
    expect(loadPersisted()).toBeNull();
    // 失败被记录：UI 据此告知用户「数据没丢，是打不开」
    expect(loadError()).not.toBeNull();
  });

  it("hydrateFromPersisted 不抛错，补种默认简历", async () => {
    installMemoryStorage();
    await reBootstrap();
    const { useResumeStore, hydrateFromPersisted } = await import("@/store/useResumeStore");

    let threw = false;
    let seeded = true;
    try {
      seeded = hydrateFromPersisted();
    } catch {
      threw = true;
    }

    expect(threw, "抛出会让 createRoot 不执行 → 整页白屏").toBe(false);
    expect(seeded).toBe(false);
    // 降级为默认简历：用户至少看到 5 个章节，而不是一片空白
    expect(useResumeStore.getState().resume.sections.length).toBe(5);
  });
});
