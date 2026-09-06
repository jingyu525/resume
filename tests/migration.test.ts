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
});
