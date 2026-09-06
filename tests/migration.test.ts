import { describe, it, expect } from "vitest";
import { migrate, validateBackup } from "@/store/migrations";

describe("持久化迁移与校验（FR-9）", () => {
  it("损坏数据为 null 时回退到带章节的空简历", () => {
    const r = migrate(null);
    expect(r.resume.sections.length).toBeGreaterThan(0);
    expect(r.version).toBe(1);
  });

  it("缺少 sections 的旧数据被补全", () => {
    const r = migrate({ version: 1, resume: { basics: {} }, appearance: {} });
    expect(Array.isArray(r.resume.sections)).toBe(true);
    expect(r.resume.sections.length).toBeGreaterThan(0);
  });

  it("非法语言字段在导入时被剔除", () => {
    const r = migrate({
      version: 1,
      resume: { basics: { name: { zh: "李", xx: "bad" } }, sections: [] },
      appearance: {},
    });
    expect((r.resume.basics.name as Record<string, string>).xx).toBeUndefined();
    expect((r.resume.basics.name as Record<string, string>).zh).toBe("李");
  });

  it("validateBackup 拒绝非法文件", () => {
    expect(validateBackup({ foo: 1 })).toBe(false);
    expect(validateBackup("string")).toBe(false);
  });

  it("validateBackup 接受合法结构", () => {
    expect(validateBackup({ version: 1, resume: { basics: {}, sections: [] }, appearance: {} })).toBe(
      true,
    );
  });

  it("畸形输入（缺 basics / 字段为非对象 / 缺 items·groups 数组 / 非 1 版本）迁移不崩且兜底", () => {
    const r = migrate({
      version: 2,
      resume: {
        basics: undefined,
        sections: [
          {
            id: "s1",
            kind: "experience",
            title: "plain-string",
            visible: true,
            order: 0,
            items: undefined,
          },
        ],
      },
      appearance: {},
    });
    expect(r.version).toBe(1);
    expect(r.resume.sections.length).toBe(1);
  });

  it("稀疏字段（条目/分组缺 id·时间·描述，groups 含 null）被补全且不崩", () => {
    const sparse = {
      version: 1,
      resume: {
        basics: { name: { zh: "X" } },
        sections: [
          {
            id: "s",
            kind: "experience",
            title: { zh: "E" },
            visible: true,
            order: 0,
            items: [{}],
            groups: [{}, null],
          },
        ],
      },
      appearance: {},
    };
    const r = migrate(sparse);
    const sec = r.resume.sections[0];
    expect(sec.items[0].id).toBe("it_0");
    expect(sec.items[0].startDate).toBe("");
    expect(sec.groups[0].id).toBe("grp_0");
    expect(sec.groups).toHaveLength(1); // null 分组被剔除
    expect(validateBackup(sparse)).toBe(true);
  });

  it("validateBackup 的 || 双分支：缺 basics 或 sections 非数组均拒绝", () => {
    expect(validateBackup({ resume: { sections: [] } })).toBe(false); // 缺 basics
    expect(validateBackup({ resume: { basics: {}, sections: "x" } })).toBe(false); // sections 非数组
  });
});
