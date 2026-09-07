import { describe, it, expect } from "vitest";
import { createSampleResume } from "@/plugins/resume-template";
import { DEFAULT_APPEARANCE, type AppearancePref } from "@/entities/appearance/model";
import { STORAGE_VERSION, validateBackup } from "@/store/migrations";
import { importPersisted } from "@/store/persistence";
import type { ResumeData } from "@/entities/resume/model";

/** 模拟"导出→落盘→重新读入"的纯数据往返（不涉及 Blob/DOM） */
function roundtrip(resume: unknown, appearance: AppearancePref) {
  const payload = { version: STORAGE_VERSION, resume, appearance };
  const parsed = JSON.parse(JSON.stringify(payload)) as unknown;
  if (!validateBackup(parsed)) throw new Error("validateBackup 拒绝合法数据");
  return importPersisted(parsed);
}

describe("导出→导入往返一致性（FR-9 闭环）", () => {
  it("示例简历往返后内容与结构等价（v2 迁移补的扩展容器 fields 不计入差异）", () => {
    const resume = createSampleResume();
    const appearance = { ...DEFAULT_APPEARANCE };
    const back = roundtrip(resume, appearance);
    // v2 迁移会为每个条目/章节补 fields: {} 扩展容器；这是无损扩展，往返比较时剔除
    const stripExt = (r: ResumeData) => {
      for (const s of r.sections) {
        delete s.fields;
        for (const it of s.items) delete it.fields;
      }
      return r;
    };
    expect(stripExt(back.resume)).toEqual(stripExt(resume));
    expect(back.appearance).toEqual(appearance);
  });

  it("非法语言字段在导入时被剔除（脏数据不传入库）", () => {
    const resume = createSampleResume();
    (resume.basics.name as Record<string, string>).xx = "bad";
    const back = roundtrip(resume, { ...DEFAULT_APPEARANCE });
    const name = back.resume.basics.name as Record<string, string>;
    expect(name.xx).toBeUndefined();
    expect(name.zh).toBeDefined();
  });

  it("未知 kind 的章节在导入时保留（不静默丢弃，FR-9 升级不丢数据）", () => {
    const resume = createSampleResume();
    (resume.sections as unknown[]).push({
      id: "x",
      kind: "bogus",
      title: { zh: "证书" },
      visible: true,
      order: 99,
      items: [],
      groups: [],
    });
    const back = roundtrip(resume, { ...DEFAULT_APPEARANCE });
    const kept = back.resume.sections.find((s) => (s as { kind: string }).kind === "bogus");
    expect(kept).toBeDefined();
    expect((kept as { title: Record<string, string> }).title.zh).toBe("证书");
  });

  it("密度越界被收敛到 [0,1]", () => {
    expect(roundtrip(createSampleResume(), { ...DEFAULT_APPEARANCE, density: 5 }).appearance.density).toBe(1);
    expect(
      roundtrip(createSampleResume(), { ...DEFAULT_APPEARANCE, density: -3 }).appearance.density,
    ).toBe(0);
  });

  it("损坏数据无法通过校验（validateBackup 兜底）", () => {
    expect(validateBackup("not json")).toBe(false);
    expect(validateBackup(null)).toBe(false);
    expect(validateBackup({ foo: 1 })).toBe(false);
  });
});
