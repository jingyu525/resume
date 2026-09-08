import { describe, expect, it } from "vitest";
import { createRoleResume, roleSkillHints, ROLE_IDS } from "@/plugins/resume-template";
import { LOCALES } from "@/entities/locale";

/**
 * 岗位模板的边界（第一性原理）：系统只能给【结构 / 领域知识】，不能给【事实】。
 *
 * 因此模板写入的只有岗位名与技能分类维度，其余一律留空。
 * 编造的经历、数字、具体技能一旦入库，用户漏改一处即以虚构身份投递——
 * 这是必须拦住的风险，故由本测试守住。
 */
describe("岗位模板：只给框架，不给事实", () => {
  for (const role of ROLE_IDS) {
    it(`${role}：岗位名与技能分类五语齐全`, () => {
      const r = createRoleResume(role);

      for (const l of LOCALES) {
        expect(r.basics.title[l], `title missing ${l}`).toBeTruthy();
      }

      const skills = r.sections.find((s) => s.kind === "skills");
      expect(skills, "skills section exists").toBeTruthy();
      expect(skills!.groups.length, "has skill categories").toBeGreaterThan(0);
      for (const g of skills!.groups) {
        for (const l of LOCALES) {
          expect(g.name[l], `group name missing ${l}`).toBeTruthy();
        }
      }
    });

    it(`${role}：不写入编造的自我评价 / 经历 / 技能`, () => {
      const r = createRoleResume(role);

      // 自我评价留空：系统不知道用户做过什么
      const summary = r.sections.find((s) => s.kind === "summary");
      expect(summary, "summary section exists").toBeTruthy();
      expect(summary!.items.length, "summary must be empty").toBe(0);

      // 技能只给分类维度，不给具体技能——「会不会」是用户的事实
      const skills = r.sections.find((s) => s.kind === "skills")!;
      for (const g of skills.groups) {
        expect(Object.keys(g.items).length, "skill items must be empty").toBe(0);
      }

      // 经历 / 项目 / 教育 一律留空
      for (const kind of ["experience", "project", "education"]) {
        const sec = r.sections.find((s) => s.kind === kind);
        expect(sec, `${kind} section exists`).toBeTruthy();
        expect(sec!.items.length, `${kind} must be empty`).toBe(0);
      }
    });
  }

  it("典型技能仅作只读参考，不进入简历数据", () => {
    const hints = roleSkillHints("backend", "zh");
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0]!.name).toBeTruthy();
    expect(hints[0]!.items).toBeTruthy();

    // 参考里有内容，但同岗位的简历里对应分组必须是空的
    const r = createRoleResume("backend");
    const first = r.sections.find((s) => s.kind === "skills")!.groups[0]!;
    expect(first.name.zh).toBe(hints[0]!.name);
    expect(Object.keys(first.items).length).toBe(0);
  });
});
