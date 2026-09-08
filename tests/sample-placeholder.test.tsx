import { beforeAll, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { createEmptyResume } from "@/plugins/resume-template";
import { GroupsSectionEditor, ItemsSectionEditor } from "@/plugins/section-types/parts";
import { sampleHints } from "@/plugins/sample-hints";
import { useResumeStore } from "@/store/useResumeStore";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";

beforeAll(() => bootstrapPlugins());

function emptySection(kind: string) {
  const resume = createEmptyResume();
  return resume.sections.find((s) => s.kind === kind)!;
}

describe("示例以占位提示呈现，永不写入简历", () => {
  it("空章节（无条目）也给出示例，用户面对空白不无从下手", () => {
    const sec = emptySection("experience");
    const hints = sampleHints("experience", "zh");
    const { container } = render(<ItemsSectionEditor section={sec} locale="zh" />);
    expect(container.textContent).toContain(hints.title!);
  });

  it("空条目的输入框 placeholder 带示例，一输入即消失", () => {
    useResumeStore.getState().loadState(createEmptyResume(), { ...DEFAULT_APPEARANCE });
    const sec = useResumeStore.getState().resume.sections.find((s) => s.kind === "experience")!;
    useResumeStore.getState().addItem(sec.id);
    const withItem = useResumeStore
      .getState()
      .resume.sections.find((s) => s.id === sec.id)!;

    const hints = sampleHints("experience", "zh");
    const { container } = render(<ItemsSectionEditor section={withItem} locale="zh" />);
    const first = container.querySelector("input") as HTMLInputElement;
    expect(first?.placeholder).toContain(hints.title!);
  });

  it("分组型空章节给出分组示例", () => {
    const sec = emptySection("skills");
    const hints = sampleHints("skills", "zh");
    const { container } = render(<GroupsSectionEditor section={sec} locale="zh" />);
    expect(container.textContent).toContain(hints.groupName!);
  });
});
