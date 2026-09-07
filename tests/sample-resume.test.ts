import { describe, it, expect } from "vitest";
import { LOCALES } from "@/entities/locale";
import { createSampleResume, createEmptyResume } from "@/plugins/resume-template";
import type { Localized } from "@/entities/resume/model";

function expectAllLangs<T>(field: Localized<T> | undefined, label: string): void {
  expect(field, label).toBeDefined();
  for (const l of LOCALES) {
    expect(field?.[l], `${label} 缺语言 ${l}`).not.toBeUndefined();
  }
}

describe("示例/空白简历模板五语齐全（FR-6）", () => {
  it("示例简历 basics 五语齐全", () => {
    const r = createSampleResume();
    expectAllLangs(r.basics.name, "basics.name");
    expectAllLangs(r.basics.title, "basics.title");
    expectAllLangs(r.basics.city, "basics.city");
  });

  it("示例简历各章节标题与条目五语齐全", () => {
    const r = createSampleResume();
    for (const s of r.sections) {
      expectAllLangs(s.title, `section ${s.kind} title`);
      for (const it of s.items) {
        // summary 条目为自由段落，title/subtitle 按设计留空，仅校验 description
        if (s.kind !== "summary") {
          expectAllLangs(it.title, `${s.kind} item title`);
          expectAllLangs(it.subtitle, `${s.kind} item subtitle`);
        }
        expectAllLangs(it.description, `${s.kind} item description`);
      }
      for (const g of s.groups) {
        expectAllLangs(g.name, `${s.kind} group name`);
        expectAllLangs(g.items, `${s.kind} group items`);
      }
    }
  });

  it("空白简历章节默认标题五语齐全", () => {
    const r = createEmptyResume();
    for (const s of r.sections) expectAllLangs(s.title, `empty section ${s.kind} title`);
  });
});
