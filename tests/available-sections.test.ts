import { describe, it, expect } from "vitest";
import { getAvailableSectionTypes } from "@/features/resume-editing/availableSections";
import type { ResumeSection, SectionKind } from "@/entities/resume/model";
import type { SectionTypePlugin } from "@/plugins/core/types";

function fakePlugin(kind: string): SectionTypePlugin {
  return {
    kind: "section-type",
    id: `section-${kind}`,
    sectionKind: kind,
    labelKey: `section.${kind}`,
    defaultTitle: {},
    toBlocks: () => [],
    renderBlock: () => null,
    renderEditor: () => null,
  } as unknown as SectionTypePlugin;
}

function fakeSection(kind: SectionKind): ResumeSection {
  return {
    id: `sec_${kind}`,
    kind,
    title: {},
    visible: true,
    order: 0,
    items: [],
    groups: [],
  };
}

describe("getAvailableSectionTypes", () => {
  const all = [fakePlugin("summary"), fakePlugin("experience"), fakePlugin("certification")];

  it("简历为空时返回全部章节类型", () => {
    expect(getAvailableSectionTypes(all, []).map((p) => p.sectionKind)).toEqual([
      "summary",
      "experience",
      "certification",
    ]);
  });

  it("排除简历里已存在的章节类型", () => {
    const sections = [fakeSection("summary"), fakeSection("experience")];
    expect(getAvailableSectionTypes(all, sections).map((p) => p.sectionKind)).toEqual([
      "certification",
    ]);
  });

  it("全部类型都已存在时返回空", () => {
    const sections = [
      fakeSection("summary"),
      fakeSection("experience"),
      fakeSection("certification"),
    ];
    expect(getAvailableSectionTypes(all, sections)).toEqual([]);
  });

  it("仅去除已存在 kind，其余保留", () => {
    const sections = [fakeSection("experience")];
    const result = getAvailableSectionTypes(all, sections);
    expect(result.some((p) => p.sectionKind === "experience")).toBe(false);
    expect(result).toHaveLength(2);
  });
});
