import { fireEvent, render } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { createSampleResume } from "@/plugins/resume-template";
import { BlockView, type BlockEditors } from "@/features/pagination/BlockView";
import type { Block } from "@/shared/types/block";
import type { ResumeData, ResumeItem } from "@/entities/resume/model";
import { DEFAULT_LOCALE } from "@/entities/locale";
import { formatPeriod } from "@/shared/lib/format";
import { newId } from "@/shared/lib/id";

beforeAll(() => bootstrapPlugins());

/** 构造一个最小可用的 ResumeData + 单个 item block，便于聚焦日期按钮的 a11y 行为 */
function fixture(opts: {
  item?: Partial<ResumeItem>;
}): { resume: ResumeData; block: Extract<Block, { type: "item" }> } {
  const item: ResumeItem = {
    id: newId("it"),
    title: { en: "Galaxy Tech" },
    subtitle: { en: "Senior PM" },
    startDate: "",
    endDate: "",
    current: false,
    description: {},
    ...opts.item,
  };
  const sectionId = "sec_test";
  const resume: ResumeData = {
    basics: { name: {}, title: {}, city: {}, phone: "", email: "", wechat: "", website: "" },
    sections: [
      {
        id: sectionId,
        kind: "experience",
        title: { en: "Experience" },
        visible: true,
        order: 0,
        items: [item],
        groups: [],
      },
    ],
  };
  const block: Extract<Block, { type: "item" }> = {
    id: `it_${item.id}`,
    type: "item",
    sectionId,
    hasHeader: true,
    item,
    sectionKind: "experience",
  };
  return { resume, block };
}

/** 把 editors 桩完整传齐；具体断言只取关心的几个，其余 vi.fn() 占位 */
function stubEditors(): BlockEditors {
  return {
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
}

/** 拿预览区里唯一的日期按钮（无日期时是占位、有日期时是日期文本弹层触发器） */
function getDateBtn(container: HTMLElement): HTMLButtonElement {
  const btn = container.querySelector<HTMLButtonElement>("button.rs-item-date");
  if (!btn) throw new Error("预览日期按钮未渲染");
  return btn;
}

describe("预览区日期按钮 a11y（Fix 回归）", () => {
  it("无日期：aria-label/可见文字均为「Add date」，且带 Plus 图标", () => {
    const { resume, block } = fixture({});
    const { container } = render(
      <BlockView block={block} resume={resume} locale={DEFAULT_LOCALE} editors={stubEditors()} />,
    );
    const btn = getDateBtn(container);
    expect(btn.getAttribute("aria-label")).toBe("Add date");
    expect(btn.getAttribute("title")).toBe("Add date");
    expect(btn.textContent?.trim()).toBe("Add date");
    // 视觉上要有「可点击加号」提示（bug 修复前只有纯文字"Add dates (can be removed)"）
    expect(btn.querySelector("svg")).not.toBeNull();
  });

  it("无日期：aria-haspopup/aria-expanded 标记弹层状态（屏幕阅读器能感知是触发器）", () => {
    const { resume, block } = fixture({});
    const { container } = render(
      <BlockView block={block} resume={resume} locale={DEFAULT_LOCALE} editors={stubEditors()} />,
    );
    const btn = getDateBtn(container);
    expect(btn.getAttribute("aria-haspopup")).toBe("dialog");
    // 初始未展开
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("点击占位按钮 → aria-expanded 切换为 true", () => {
    const { resume, block } = fixture({});
    const { container } = render(
      <BlockView block={block} resume={resume} locale={DEFAULT_LOCALE} editors={stubEditors()} />,
    );
    const btn = getDateBtn(container);
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("有日期：aria-label 跟随日期变化，Plus 图标消失（bug 修复前会卡在「Add dates」上）", () => {
    const { resume, block } = fixture({
      item: { startDate: "2024-01", endDate: "2024-12", current: false },
    });
    const { container } = render(
      <BlockView block={block} resume={resume} locale={DEFAULT_LOCALE} editors={stubEditors()} />,
    );
    const btn = getDateBtn(container);
    const expected = formatPeriod("2024-01", "2024-12", false, DEFAULT_LOCALE);
    expect(expected).not.toBe("");
    // 关键回归点：aria-label 必须跟日期走
    expect(btn.getAttribute("aria-label")).toBe(expected);
    expect(btn.getAttribute("title")).toBe(expected);
    expect(btn.textContent?.trim()).toBe(expected);
    // 有日期就不需要「加号」占位提示
    expect(btn.querySelector("svg")).toBeNull();
  });

  it("showDate=false：渲染「Add date」恢复按钮（与左面板恢复入口文案一致）", () => {
    const { resume, block } = fixture({ item: { showDate: false } });
    const editors = stubEditors();
    const { container } = render(
      <BlockView block={block} resume={resume} locale={DEFAULT_LOCALE} editors={editors} />,
    );
    const btn = getDateBtn(container);
    expect(btn.textContent?.trim()).toBe("Add date");
    fireEvent.click(btn);
    // 必须把 setItemShowDate 透传给 store
    expect(editors.setItemShowDate).toHaveBeenCalledWith(block.sectionId, block.item.id, true);
  });

  it("只读模式（editors 缺失）：日期为纯文本，没有弹层按钮", () => {
    const { resume, block } = fixture({ item: { startDate: "2024-01" } });
    const { container } = render(
      <BlockView block={block} resume={resume} locale={DEFAULT_LOCALE} />,
    );
    // 只读分支不渲染 button.rs-item-date，只渲染 div.rs-item-date
    expect(container.querySelector("button.rs-item-date")).toBeNull();
    const div = container.querySelector(".rs-item-date");
    expect(div?.textContent?.trim()).toBe(formatPeriod("2024-01", "", false, DEFAULT_LOCALE));
  });

  // 防止依赖项意外回填导致旧 bug 复活
  it("确认示例简历里真实条目按上面规则渲染（默认 showDate 未设置，渲染为有日期的弹层触发器）", () => {
    const sample = createSampleResume();
    // 示例里第一条 experience 项是 startDate="2021-03", current=true
    const sec = sample.sections.find((s) => s.kind === "experience");
    const item = sec?.items[0];
    if (!sec || !item) throw new Error("示例简历缺 experience 条目");
    const block: Extract<Block, { type: "item" }> = {
      id: `it_${item.id}`,
      type: "item",
      sectionId: sec.id,
      hasHeader: true,
      item,
      sectionKind: "experience",
    };
    const { container } = render(
      <BlockView block={block} resume={sample} locale={DEFAULT_LOCALE} editors={stubEditors()} />,
    );
    const btn = getDateBtn(container);
    const expected = formatPeriod(item.startDate, item.endDate, item.current, DEFAULT_LOCALE);
    expect(btn.getAttribute("aria-label")).toBe(expected);
    expect(btn.getAttribute("aria-haspopup")).toBe("dialog");
  });
});