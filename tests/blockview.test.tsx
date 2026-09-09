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
      updateItemLocalized: vi.fn(),
      updateItemDesc: vi.fn(),
      updateItemDate: vi.fn(),
      setItemShowDate: vi.fn(),
      updateGroupName: vi.fn(),
      updateGroupItems: vi.fn(),
    };
    const { container } = render(
      <BlockView block={head} resume={resume} locale={DEFAULT_LOCALE} editors={editors} />,
    );
    expect(container.querySelector('[contenteditable="true"]')).not.toBeNull();
  });
});

describe("落地页示例多语言标题（i18n 五语齐全）", () => {
  const locales = ["zh", "en", "ja", "de", "ko"] as const;

  it.each(locales)(
    "locale=%s：示例每个章节标题均从传入 resume 正确读出且非空",
    (locale) => {
      const resume = createSampleResume();
      const { main } = buildBlocks(resume, locale, "single");
      const heads = main.filter(
        (b): b is Extract<Block, { type: "section-head" }> => b.type === "section-head",
      );
      expect(heads.length).toBeGreaterThan(0);
      for (const head of heads) {
        const { container, unmount } = render(
          <BlockView block={head} resume={resume} locale={locale} />,
        );
        const expected = localizedText(
          resume.sections.find((s) => s.id === head.sectionId)?.title,
          locale,
        );
        // 回归：解耦前落地页章节标题因 store 找不到 sectionId 而归空
        expect(expected).not.toBe("");
        expect(container.textContent).toContain(expected);
        unmount();
      }
    },
  );

  it("切换语言时同一章节显示对应语言标题（非写死单一语言）", () => {
    const resume = createSampleResume();
    const head = firstSectionHead(resume) as Extract<Block, { type: "section-head" }>;
    const section = resume.sections.find((s) => s.id === head.sectionId)!;

    const { container: zhC, unmount: u1 } = render(
      <BlockView block={head} resume={resume} locale="zh" />,
    );
    const zhText = localizedText(section.title, "zh");
    expect(zhC.textContent).toContain(zhText);
    u1();

    const { container: enC } = render(
      <BlockView block={head} resume={resume} locale="en" />,
    );
    const enText = localizedText(section.title, "en");
    expect(enC.textContent).toContain(enText);
    // 若两种语言标题相同，说明没真正走本地化（或模版该语言缺失经回退链显示中文）
    expect(zhText).not.toEqual(enText);
  });
});
