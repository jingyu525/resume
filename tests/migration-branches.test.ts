import { describe, it, expect, vi, afterEach } from "vitest";
import * as registry from "@/plugins/core/registry";
import { migrate, validateBackup, STORAGE_VERSION } from "@/store/migrations";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";

describe("migrations 分支全覆盖（提升覆盖率至门槛）", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // —— knownLocales 兜底路径：registeredLocales 返回空，走兜底 LOCALES，未知语言被剥离 ——
  // 注意：只 spy registeredLocales，不能 clearRegistry —— 否则 createEmptyResume 的兜底章节会消失。
  it("knownLocales：registeredLocales 返回空，走兜底 LOCALES，未知语言被剥离", () => {
    vi.spyOn(registry, "registeredLocales").mockReturnValue([]);
    const r = migrate({
      version: 2,
      resume: {
        basics: { name: { zh: "李", xx: "bad" } },
        sections: [
          {
            id: "s",
            kind: "experience",
            title: { zh: "T", xx: "no" },
            visible: true,
            order: 0,
            items: [{ title: { zh: "a", yy: "no" } }],
          },
        ],
      },
      appearance: {},
    });
    expect(r.resume.basics.name.zh).toBe("李");
    expect((r.resume.basics.name as Record<string, string>).xx).toBeUndefined();
    expect(r.resume.sections[0].items[0].title.zh).toBe("a");
  });

  // —— knownLocales 兜底路径：registeredLocales 抛错时进入 catch，退化为 LOCALES ——
  it("knownLocales：registeredLocales 抛错时 catch 兜底 LOCALES（不丢数据）", () => {
    vi.spyOn(registry, "registeredLocales").mockImplementation(() => {
      throw new Error("registry unavailable");
    });
    const r = migrate({
      version: 2,
      resume: { basics: { name: { zh: "李" } }, sections: [] },
      appearance: {},
    });
    expect(r.resume.basics.name.zh).toBe("李");
  });

  // —— migrate 入口分支 ——
  it("版本字段缺失时退化为 STORAGE_VERSION", () => {
    const r = migrate({ resume: { basics: {}, sections: [] }, appearance: {} });
    expect(r.version).toBe(STORAGE_VERSION);
  });

  it("raw 为非对象时回退空简历", () => {
    const r = migrate("string" as never);
    expect(r.resume.sections.length).toBeGreaterThan(0);
  });

  // —— normalizeAppearance 各分支 ——
  it("appearance：sidebar/lively/越界 density/空 theme 分支", () => {
    const r = migrate({
      version: 2,
      resume: { basics: {}, sections: [] },
      appearance: { layout: "sidebar", accent: "#123", tone: "lively", density: 5, theme: "" },
    });
    expect(r.appearance.layout).toBe("sidebar");
    expect(r.appearance.tone).toBe("lively");
    expect(r.appearance.density).toBe(1); // 上界夹紧
    expect(r.appearance.theme).toBe(DEFAULT_APPEARANCE.theme); // 空串 → 默认
  });

  it("appearance：soft tone / 负 density / 非空 theme / 缺字段分支", () => {
    const r = migrate({
      version: 2,
      resume: { basics: {}, sections: [] },
      appearance: { tone: "soft", density: -3, theme: "midnight" },
    });
    expect(r.appearance.tone).toBe("soft");
    expect(r.appearance.density).toBe(0); // 下界夹紧
    expect(r.appearance.theme).toBe("midnight");
    expect(r.appearance.layout).toBe("single"); // 缺 layout → 默认
    expect(r.appearance.accent).toBe(DEFAULT_APPEARANCE.accent);
  });

  it("appearance 非对象时整体回退默认", () => {
    const r = migrate({
      version: 2,
      resume: { basics: {}, sections: [] },
      appearance: "bad",
    } as never);
    expect(r.appearance).toEqual(DEFAULT_APPEARANCE);
  });

  // —— normalizeResume 分支 ——
  it("resume 非对象时回退默认章节", () => {
    const r = migrate({ version: 2, resume: "bad", appearance: {} } as never);
    expect(r.resume.sections.length).toBeGreaterThan(0); // fallback
  });

  it("空 sections 数组时回退默认章节", () => {
    const r = migrate({ version: 2, resume: { basics: {}, sections: [] }, appearance: {} });
    expect(r.resume.sections.length).toBeGreaterThan(0);
  });

  // —— normalizeSection 分支 ——
  it("section：非对象/空 kind/visible:false/缺 order/items·groups 非数组", () => {
    const r = migrate({
      version: 2,
      resume: {
        basics: { name: { zh: "X" } },
        sections: [
          null,
          "bad",
          { kind: "", title: {}, visible: true, order: 0, items: [] },
          {
            id: "s1",
            kind: "experience",
            title: { zh: "E" },
            visible: false,
            order: "x" as never,
            items: "bad",
            groups: "bad",
          },
        ],
      },
      appearance: {},
    } as never);
    // 非对象 / 空 kind 被剔除，仅剩 s1
    expect(r.resume.sections).toHaveLength(1);
    const sec = r.resume.sections[0];
    expect(sec.visible).toBe(false);
    expect(typeof sec.order).toBe("number");
    expect(sec.items).toEqual([]); // 非数组 → []
    expect(sec.groups).toEqual([]);
  });

  // —— normalizeItem / normalizeGroup 分支 ——
  it("item/group：null 或非对象、缺 id、current 缺省", () => {
    const r = migrate({
      version: 2,
      resume: {
        basics: { name: { zh: "X" } },
        sections: [
          {
            id: "s",
            kind: "skills",
            title: { zh: "S" },
            visible: true,
            order: 0,
            items: [null, {}],
            groups: [null, "bad", {}],
          },
        ],
      },
      appearance: {},
    });
    expect(r.resume.sections[0].items).toHaveLength(1);
    expect(r.resume.sections[0].items[0].id).toBe("it_1"); // 原数组第 1 项（第 0 项 null 被过滤）
    expect(r.resume.sections[0].items[0].current).toBe(false);
    expect(r.resume.sections[0].groups).toHaveLength(1);
    expect(r.resume.sections[0].groups[0].id).toBe("grp_2"); // 原数组第 2 项
  });

  // —— sanitizeLocales scrub 分支 ——
  it("sanitizeLocales：未知语言键被剥离，结构保留", () => {
    const r = migrate({
      version: 2,
      resume: {
        basics: { name: { zh: "李", xx: "bad" }, city: "plain" },
        sections: [
          {
            id: "s",
            kind: "experience",
            title: { zh: "T", xx: "no" },
            visible: true,
            order: 0,
            items: [{ title: { zh: "a", yy: "no" }, description: "plain" }],
            groups: [{ name: { zh: "g", zz: "no" } }],
          },
        ],
      },
      appearance: {},
    });
    expect((r.resume.basics.name as Record<string, string>).zh).toBe("李");
    expect((r.resume.basics.name as Record<string, string>).xx).toBeUndefined();
    expect(r.resume.sections).toHaveLength(1);
    expect(r.resume.sections[0].items[0].title.zh).toBe("a");
    expect(r.resume.sections[0].groups[0].name.zh).toBe("g");
  });

  // —— validateBackup 分支 ——
  it("validateBackup：resume 非对象 / basics 缺 / sections 非数组 均拒绝", () => {
    expect(validateBackup({ resume: "bad" })).toBe(false);
    expect(validateBackup({ resume: { sections: [] } })).toBe(false); // 缺 basics
    expect(validateBackup({ resume: { basics: {}, sections: "bad" } })).toBe(false); // sections 非数组
    expect(validateBackup({ resume: { basics: {}, sections: [] } })).toBe(true);
  });
});
