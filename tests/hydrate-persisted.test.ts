import { describe, expect, it } from "vitest";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { STORAGE_VERSION } from "@/store/migrations";

const KEY = "resume-studio:v1";

/**
 * 当前 Node 下 jsdom 不提供可用的 localStorage，用内存实现替身，
 * 让"读盘 → 迁移 → 恢复到 store"这条链路可以被真实调用（浏览器内另有人工实测）。
 */
function installMemoryStorage(): Map<string, string> {
  const mem = new Map<string, string>();
  const stub = {
    getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: stub,
    configurable: true,
    writable: true,
  });
  return mem;
}

/**
 * 回归：本地数据必须在「插件注册之后」显式恢复（FR-9 刷新不丢）。
 *
 * 曾经的 bug：store 在模块顶层就调用 loadPersisted()，而 section 类型插件反向 import 了 store，
 * 于是「注册插件」与「初始化 store」形成循环依赖 —— store 求值时注册表还是空的，
 * getActiveStorage() 返回 undefined，本地简历被静默丢弃。用户看到的就是"刷新后简历没了"。
 */
describe("本地存储恢复（FR-9）", () => {
  it("注册插件后显式 hydrate 才能把本地数据恢复到 store", async () => {
    const mem = installMemoryStorage();
    mem.set(
      KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        resume: {
          basics: {
            name: { zh: "张三" },
            title: {},
            city: {},
            phone: "",
            email: "",
            wechat: "",
            website: "",
          },
          sections: [],
        },
        appearance: { ...DEFAULT_APPEARANCE },
      }),
    );

    const { bootstrapPlugins } = await import("@/plugins/bootstrap");
    bootstrapPlugins();

    const { useResumeStore, hydrateFromPersisted } = await import("@/store/useResumeStore");
    expect(hydrateFromPersisted()).toBe(true);
    expect(useResumeStore.getState().resume.basics.name?.zh).toBe("张三");
  });

  it("恢复不进撤销历史（否则用户第一次撤销就把简历清空）", async () => {
    installMemoryStorage();
    const { useResumeStore, hydrateFromPersisted } = await import("@/store/useResumeStore");
    hydrateFromPersisted();
    expect(useResumeStore.temporal.getState().pastStates.length).toBe(0);
  });

  it("首次访问（无本地数据）补种默认简历：含 5 个内置章节且不进撤销历史", async () => {
    installMemoryStorage();
    const { useResumeStore, hydrateFromPersisted } = await import("@/store/useResumeStore");
    const seeded = hydrateFromPersisted();
    expect(seeded).toBe(false); // 没有恢复任何已存数据
    const sections = useResumeStore.getState().resume.sections;
    expect(sections.length).toBe(5); // summary/experience/project/education/skills
    // 章节顺序与默认一致，且均有标题
    expect(sections.map((s) => s.kind)).toEqual([
      "summary",
      "experience",
      "project",
      "education",
      "skills",
    ]);
    expect(sections.every((s) => typeof s.title === "object" && Object.keys(s.title).length > 0)).toBe(
      true,
    );
    // 补种不是一次编辑，不该进撤销历史
    expect(useResumeStore.temporal.getState().pastStates.length).toBe(0);
  });
});
