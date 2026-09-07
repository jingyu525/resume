import { describe, it, expect, beforeAll } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { listSectionTypes, getSectionType } from "@/plugins/core/registry";
import { buildBlocks } from "@/features/pagination/buildBlocks";
import { createEmptyResume } from "@/plugins/resume-template";
import type { ResumeData } from "@/entities/resume/model";

beforeAll(() => bootstrapPlugins());

describe("章节类型插件 (M2)", () => {
  it("toBlocks 产出 section-head + 条目块，且块带 sectionKind 供 BlockView 回查", () => {
    const plugin = getSectionType("experience");
    expect(plugin).toBeDefined();
    const section = createEmptyResume().sections.find((s) => s.kind === "experience")!;
    section.items = [
      { id: "i1", title: {}, subtitle: {}, startDate: "2020-01", endDate: "", current: true, description: {} },
    ];
    const ctx = { locale: "zh" as const, layout: "single" as const };
    const blocks = plugin!.toBlocks(section, ctx);
    expect(blocks[0].type).toBe("section-head");
    const itemBlock = blocks.find((b) => b.type === "item");
    expect(itemBlock).toBeDefined();
    expect((itemBlock as { sectionKind?: string }).sectionKind).toBe("experience");
  });

  it("侧栏版式下：summary/skills 入 sidebar，experience/project/education 入 main", () => {
    const resume: ResumeData = createEmptyResume();
    // 去掉默认示例章节，避免条目数量干扰分流断言
    for (const s of resume.sections) s.items = []; for (const s of resume.sections) s.groups = [];

    const tree = buildBlocks(resume, "zh", "sidebar");

    const sidebarKinds = new Set(
      tree.sidebar.filter((b) => b.type === "section-head").map((b) => (b as { title: string }).title),
    );
    const mainKinds = new Set(
      tree.main.filter((b) => b.type === "section-head").map((b) => (b as { title: string }).title),
    );

    // 默认标题可直接区分：summary/skills 在侧栏
    expect(sidebarKinds.has("自我评价")).toBe(true);
    expect(sidebarKinds.has("专业技能")).toBe(true);
    expect(mainKinds.has("工作经历")).toBe(true);
    expect(mainKinds.has("项目经历")).toBe(true);
    expect(mainKinds.has("教育背景")).toBe(true);
  });

  it("未安装插件的未知 kind 章节：buildBlocks 跳过渲染但保留数据", () => {
    const resume: ResumeData = createEmptyResume();
    resume.sections.push({
      id: "sec-x",
      kind: "certifications" as never,
      title: { zh: "证书" },
      visible: true,
      order: 99,
      items: [],
      groups: [],
    });
    const tree = buildBlocks(resume, "zh", "single");
    // 不渲染、不崩溃：未知 kind 的块类型不会是 certifications
    expect(tree.main.every((b) => (b.type as string) !== "certifications")).toBe(true);
  });

  it("每个章节插件的 defaultTitle 五语齐全（规则 C4 运行时兜底）", () => {
    for (const p of listSectionTypes()) {
      for (const loc of ["zh", "en", "ja", "de", "ko"]) {
        expect((p.defaultTitle as Record<string, string>)[loc], `${p.id} 缺 ${loc}`).toBeTruthy();
      }
    }
  });

  it("placement 字段声明侧栏归属（skills 在侧栏，经历类在主栏）", () => {
    expect(getSectionType("skills")?.placement).toBe("sidebar");
    expect(getSectionType("experience")?.placement).toBe("main");
    expect(getSectionType("summary")?.placement).toBe("sidebar");
  });
});
