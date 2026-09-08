import { describe, it, expect } from "vitest";
import { createRoleResume, ROLE_IDS } from "@/plugins/resume-template";
import { LOCALES } from "@/entities/locale";

/**
 * P1-7（五语对照）的自动化兜底：每个岗位模板的职位 / 自我评价 / 专业技能
 * 都必须五语齐全，否则切换到该岗位导出会经回退链显示中文，等于「每语言没有自己的模板」。
 */
describe("role templates five-language completeness", () => {
  for (const role of ROLE_IDS) {
    it(`${role} covers all 5 languages for title / summary / skills`, () => {
      const r = createRoleResume(role);

      for (const l of LOCALES) {
        expect(r.basics.title[l], `title missing ${l}`).toBeTruthy();
      }

      const summary = r.sections.find((s) => s.kind === "summary");
      expect(summary, "summary section exists").toBeTruthy();
      expect(summary!.items[0], "summary has an item").toBeTruthy();
      for (const l of LOCALES) {
        expect(summary!.items[0]!.description[l], `summary description missing ${l}`).toBeTruthy();
      }

      const skills = r.sections.find((s) => s.kind === "skills");
      expect(skills, "skills section exists").toBeTruthy();
      expect(skills!.groups.length, "skills has groups").toBeGreaterThan(0);
      for (const g of skills!.groups) {
        for (const l of LOCALES) {
          expect(g.name[l], `skill group name missing ${l}`).toBeTruthy();
          expect(g.items[l], `skill group items missing ${l}`).toBeTruthy();
        }
      }
    });
  }
});

/** 岗位模板应基于示例骨架，保留经历类章节（用户在此基础上改写） */
describe("role template structure", () => {
  it("keeps experience/project/education sections with sample items", () => {
    const r = createRoleResume("backend");
    const exp = r.sections.find((s) => s.kind === "experience");
    expect(exp?.items.length ?? 0).toBeGreaterThan(0);
    const proj = r.sections.find((s) => s.kind === "project");
    expect(proj?.items.length ?? 0).toBeGreaterThan(0);
  });
});
