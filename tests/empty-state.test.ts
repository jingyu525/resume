import { beforeAll, describe, expect, it } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { createEmptyResume, createSampleResume } from "@/plugins/resume-template";
import { detectEmptiness } from "@/features/empty-state/detect";
import { DEFAULT_LOCALE } from "@/entities/locale";
import type { ResumeData } from "@/entities/resume/model";

beforeAll(() => bootstrapPlugins());

const locale = DEFAULT_LOCALE;

describe("detectEmptiness 区分三种空", () => {
  it("结构空：0 章节（系统故障，应自愈）", () => {
    const resume: ResumeData = { ...createEmptyResume(), sections: [] };
    expect(detectEmptiness(resume, locale)).toEqual({ kind: "no-sections" });
  });

  it("事实空：5 个默认章节但字段全空（正常初始态，应引导）", () => {
    const resume = createEmptyResume();
    expect(detectEmptiness(resume, locale).kind).toBe("no-content");
  });

  it("正常：示例简历有内容", () => {
    const resume = createSampleResume();
    expect(detectEmptiness(resume, locale).kind).toBe("ok");
  });

  it("渲染空（全隐藏）：所有章节 visible=false → 内容在但看不见", () => {
    const base = createEmptyResume();
    const resume: ResumeData = {
      ...base,
      sections: base.sections.map((s) => ({ ...s, visible: false })),
    };
    const r = detectEmptiness(resume, locale);
    expect(r.kind).toBe("all-hidden");
    if (r.kind === "all-hidden") expect(r.count).toBe(base.sections.length);
  });

  it("渲染空（缺插件）：章节 kind 未注册 → 内容在但渲染不出", () => {
    const base = createEmptyResume();
    const resume: ResumeData = {
      ...base,
      sections: [{ ...base.sections[0], kind: "nonexistent-kind" as ResumeData["sections"][number]["kind"] }],
    };
    const r = detectEmptiness(resume, locale);
    expect(r.kind).toBe("missing-plugin");
    if (r.kind === "missing-plugin") expect(r.titles.length).toBeGreaterThan(0);
  });
});
