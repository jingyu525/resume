import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { createSampleResume } from "@/plugins/resume-template";
import { buildBlocks, type Block } from "@/features/pagination/buildBlocks";
import { BlockView, type BlockEditors } from "@/features/pagination/BlockView";
import { localizedText } from "@/shared/lib/localized";
import { DEFAULT_LOCALE } from "@/entities/locale";
import type { ResumeData } from "@/entities/resume/model";

beforeAll(() => bootstrapPlugins());

function firstSectionHead(resume: ResumeData): Block {
  const { main } = buildBlocks(resume, DEFAULT_LOCALE, "single");
  return main.find((b) => b.type === "section-head")!;
}

describe("BlockView 只读展示（落地页示例场景）", () => {
  it("章节标题从传入 resume 读取，不再因 store 缺失而全空", () => {
    const resume = createSampleResume();
    const head = firstSectionHead(resume) as Extract<Block, { type: "section-head" }>;
    const { container } = render(
      <BlockView block={head} resume={resume} locale={DEFAULT_LOCALE} />,
    );
    const expected = localizedText(
      resume.sections.find((s) => s.id === head.sectionId)?.title,
      DEFAULT_LOCALE,
    );
    expect(expected).not.toBe("");
    expect(container.textContent).toContain(expected);
  });

  it("不传 editors 时为只读：contentEditable=false，不会碰全局 store", () => {
    const resume = createSampleResume();
    const head = firstSectionHead(resume);
    const { container } = render(
      <BlockView block={head} resume={resume} locale={DEFAULT_LOCALE} />,
    );
    expect(container.querySelector('[contenteditable="false"]')).not.toBeNull();
    // 没有任何可编辑（true）字段
    expect(container.querySelector('[contenteditable="true"]')).toBeNull();
  });

  it("传入 editors 时为可编辑：contentEditable=true，写回走注入的回调", () => {
    const resume = createSampleResume();
    const head = firstSectionHead(resume) as Extract<Block, { type: "section-head" }>;
    const editors: BlockEditors = {
      updateBasicLocalized: vi.fn(),
      updateBasicPlain: vi.fn(),
      renameSection: vi.fn(),
    };
    const { container } = render(
      <BlockView block={head} resume={resume} locale={DEFAULT_LOCALE} editors={editors} />,
    );
    expect(container.querySelector('[contenteditable="true"]')).not.toBeNull();
  });
});
