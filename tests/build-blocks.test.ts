import { describe, it, expect } from "vitest";
import { buildBlocks, itemDateLabel, type Block } from "@/features/pagination/buildBlocks";
import { createSampleResume } from "@/plugins/resume-template";
import type { ResumeData, ResumeSection, ResumeItem } from "@/entities/resume/model";

type HeadBlock = Extract<Block, { type: "section-head" }>;
type Tree = ReturnType<typeof buildBlocks>;

function headSectionIds(blocks: Block[]): string[] {
  return blocks.filter((b): b is HeadBlock => b.type === "section-head").map((b) => b.sectionId);
}

function findHead(tree: Tree, sid: string): HeadBlock {
  const hit = [...tree.sidebar, ...tree.main].find(
    (b) => b.type === "section-head" && b.sectionId === sid,
  );
  if (!hit) throw new Error(`section head not found: ${sid}`);
  return hit as HeadBlock;
}

function idOf(resume: ResumeData, kind: ResumeSection["kind"]): string {
  const s = resume.sections.find((x) => x.kind === kind);
  if (!s) throw new Error(`no section: ${kind}`);
  return s.id;
}

describe("buildBlocks (FR-7 上游：简历内容 → 有序原子块)", () => {
  it("单栏：基本信息置于正文顶部，侧栏为空", () => {
    const tree = buildBlocks(createSampleResume(), "zh", "single");
    expect(tree.sidebar).toHaveLength(0);
    expect(tree.main[0].id).toBe("basics");
  });

  it("侧栏：自我评价+专业技能入侧栏，经历类入主栏，且 basics 只在侧栏出现一次", () => {
    const r = createSampleResume();
    const summaryId = idOf(r, "summary");
    const skillsId = idOf(r, "skills");
    const expId = idOf(r, "experience");
    const tree = buildBlocks(r, "zh", "sidebar");
    expect(tree.sidebar.filter((b) => b.type === "basics")).toHaveLength(1);
    expect(tree.sidebar[0].id).toBe("basics");
    const sideKinds = headSectionIds(tree.sidebar);
    expect(sideKinds).toContain(summaryId);
    expect(sideKinds).toContain(skillsId);
    const mainKinds = headSectionIds(tree.main);
    expect(mainKinds).toContain(expId);
    expect(mainKinds).not.toContain(skillsId);
  });

  it("skills 章节展开为 skill-group 块，experience 展开为 item 块", () => {
    const tree = buildBlocks(createSampleResume(), "en", "sidebar");
    expect(tree.sidebar.filter((b) => b.type === "skill-group").length).toBe(2);
    expect(tree.main.filter((b) => b.type === "item").length).toBeGreaterThan(0);
  });

  it("隐藏章节被完全排除在两侧之外", () => {
    const r = createSampleResume();
    const eduId = idOf(r, "education");
    r.sections.find((s) => s.kind === "education")!.visible = false;
    const tree = buildBlocks(r, "zh", "single");
    expect(headSectionIds([...tree.sidebar, ...tree.main])).not.toContain(eduId);
  });

  it("章节按 order 升序排列（与源码顺序无关）", () => {
    const r = createSampleResume();
    const expId = idOf(r, "experience");
    const sumId = idOf(r, "summary");
    r.sections.find((s) => s.kind === "summary")!.order = 10;
    r.sections.find((s) => s.kind === "experience")!.order = 1;
    const ids = headSectionIds(buildBlocks(r, "zh", "single").main);
    expect(ids.indexOf(expId)).toBeLessThan(ids.indexOf(sumId));
  });

  it("keepWithNext：含条目/分组的章节标题为 true，空章节为 false", () => {
    const r = createSampleResume();
    const expId = idOf(r, "experience");
    const skillsId = idOf(r, "skills");
    const empty: ResumeSection = {
      id: "empty1",
      kind: "project",
      title: { zh: "空", en: "Empty" },
      visible: true,
      order: 99,
      items: [],
      groups: [],
    };
    r.sections.push(empty);
    const tree = buildBlocks(r, "zh", "sidebar");
    expect(findHead(tree, expId).keepWithNext).toBe(true);
    expect(findHead(tree, skillsId).keepWithNext).toBe(true);
    expect(findHead(tree, "empty1").keepWithNext).toBe(false);
  });

  it("章节标题随语言本地化", () => {
    const zh = buildBlocks(createSampleResume(), "zh", "single").main.find(
      (b) => b.type === "section-head",
    ) as HeadBlock;
    const en = buildBlocks(createSampleResume(), "en", "single").main.find(
      (b) => b.type === "section-head",
    ) as HeadBlock;
    expect(zh.title).toBe("自我评价");
    expect(en.title).toBe("Summary");
  });

  it("侧栏中 skills 排在 summary 之前时 basics 仍唯一且在最前（回归：避免重复推入）", () => {
    const r = createSampleResume();
    r.sections.find((s) => s.kind === "skills")!.order = 0;
    r.sections.find((s) => s.kind === "summary")!.order = 1;
    const tree = buildBlocks(r, "zh", "sidebar");
    expect(tree.sidebar.filter((b) => b.type === "basics")).toHaveLength(1);
    expect(tree.sidebar[0].id).toBe("basics");
  });

  it("skills 章节无任何分组时 keepWithNext 为 false", () => {
    const r = createSampleResume();
    const skills = r.sections.find((s) => s.kind === "skills")!;
    skills.groups = [];
    const tree = buildBlocks(r, "zh", "sidebar");
    expect(findHead(tree, skills.id).keepWithNext).toBe(false);
  });

  it("itemDateLabel 委托 formatPeriod（含'至今'文案随语言）", () => {
    const base: ResumeItem = {
      id: "x",
      title: {},
      subtitle: {},
      startDate: "2021-03",
      endDate: "",
      current: true,
      description: {},
    };
    expect(itemDateLabel(base, "zh")).toBe("2021.03 – 至今");
    expect(itemDateLabel(base, "en")).toBe("2021.03 – Present");
    const ended = { ...base, current: false, endDate: "2023-05" };
    expect(itemDateLabel(ended, "en")).toBe("2021.03 – 2023.05");
  });
});
