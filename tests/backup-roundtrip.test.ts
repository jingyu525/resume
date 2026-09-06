import { describe, it, expect } from "vitest";
import { createSampleResume } from "@/entities/resume/defaults";
import { DEFAULT_APPEARANCE, type AppearancePref } from "@/entities/appearance/model";
import { STORAGE_VERSION, validateBackup } from "@/store/migrations";
import { importPersisted } from "@/store/persistence";

/** 模拟"导出→落盘→重新读入"的纯数据往返（不涉及 Blob/DOM） */
function roundtrip(resume: unknown, appearance: AppearancePref) {
  const payload = { version: STORAGE_VERSION, resume, appearance };
  const parsed = JSON.parse(JSON.stringify(payload)) as unknown;
  if (!validateBackup(parsed)) throw new Error("validateBackup 拒绝合法数据");
  return importPersisted(parsed);
}

describe("导出→导入往返一致性（FR-9 闭环）", () => {
  it("示例简历往返后结构与内容等价", () => {
    const resume = createSampleResume();
    const appearance = { ...DEFAULT_APPEARANCE };
    const back = roundtrip(resume, appearance);
    expect(back.resume).toEqual(resume);
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

  it("非法 kind 的章节在导入时被丢弃", () => {
    const resume = createSampleResume();
    (resume.sections as unknown[]).push({
      id: "x",
      kind: "bogus",
      title: {},
      visible: true,
      order: 99,
      items: [],
      groups: [],
    });
    const back = roundtrip(resume, { ...DEFAULT_APPEARANCE });
    expect(
      back.resume.sections.find((s) => (s as { kind: string }).kind === "bogus"),
    ).toBeUndefined();
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
