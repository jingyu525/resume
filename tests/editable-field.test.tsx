import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { EditableField } from "@/shared/ui/editable-field";

function getEl(container: HTMLElement): HTMLDivElement {
  return container.querySelector("[contenteditable]") as HTMLDivElement;
}

describe("EditableField 非受控同步（NFR-2 防光标丢失）", () => {
  it("聚焦时外部 html 变化不回写，避免吞掉用户输入/光标", () => {
    const { container, rerender } = render(
      <EditableField html="<p>Hello</p>" onChange={() => {}} />,
    );
    const el = getEl(container);
    el.focus();
    expect(document.activeElement).toBe(el);
    // 外部 prop 变化（如其它面板改了同字段）
    rerender(<EditableField html="<p>World</p>" onChange={() => {}} />);
    // 仍显示旧内容，未被覆盖
    expect(el.textContent).toContain("Hello");
    expect(el.textContent).not.toContain("World");
  });

  it("失焦后外部 html 变化才同步回写", () => {
    const { container, rerender } = render(
      <EditableField html="<p>Hello</p>" onChange={() => {}} />,
    );
    const el = getEl(container);
    act(() => {
      el.focus();
      el.blur();
    });
    act(() => {
      rerender(<EditableField html="<p>World</p>" onChange={() => {}} />);
    });
    expect(el.textContent).toContain("World");
  });

  it("初始渲染即把脏数据清洗后写入 DOM（NFR-3 收口）", () => {
    const { container } = render(
      <EditableField html='<p>ok</p><script>alert(1)</script>' onChange={() => {}} />,
    );
    const el = getEl(container);
    expect(el.innerHTML).not.toContain("<script");
    expect(el.innerHTML).toContain("ok");
  });
});

describe("EditableField 输入防抖与提交", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("输入后 300ms 才提交一次（防抖）", () => {
    const onChange = vi.fn();
    const { container } = render(<EditableField html="" onChange={onChange} />);
    const el = getEl(container);
    el.innerHTML = "<p>abc</p>";

    fireEvent.input(el);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("连续输入只产生一次提交（防抖合并）", () => {
    const onChange = vi.fn();
    const { container } = render(<EditableField html="" onChange={onChange} />);
    const el = getEl(container);
    el.innerHTML = "<p>a</p>";
    fireEvent.input(el);
    vi.advanceTimersByTime(100);
    el.innerHTML = "<p>ab</p>";
    fireEvent.input(el);
    vi.advanceTimersByTime(100);
    el.innerHTML = "<p>abc</p>";
    fireEvent.input(el);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("abc");
  });
});

describe("EditableField 粘贴清洗（NFR-3）", () => {
  it("富文本粘贴剥离 script / on* / style，仅留语义与 rs-em", () => {
    const onChange = vi.fn();
    const { container } = render(<EditableField html="" rich onChange={onChange} />);
    const el = getEl(container);
    const dirty =
      '<p>hi</p><script>alert(1)</script><img src=x onerror=alert(1)><span class="rs-em">em</span>';
    fireEvent.paste(el, {
      clipboardData: {
        getData: (type: string) => (type === "text/html" ? dirty : ""),
      },
    });
    const got = onChange.mock.calls[0][0] as string;
    expect(got).not.toContain("<script");
    expect(got).not.toContain("onerror");
    expect(got).not.toContain("style");
    expect(got).toContain("rs-em");
    expect(got).toContain("hi");
  });

  it("纯文本字段粘贴只保留纯文本（无标签）", () => {
    const onChange = vi.fn();
    const { container } = render(<EditableField html="" onChange={onChange} />);
    const el = getEl(container);
    fireEvent.paste(el, {
      clipboardData: {
        getData: (type: string) =>
          type === "text/html" ? "<b>bold</b>" : "plain text",
      },
    });
    const got = onChange.mock.calls[0][0] as string;
    expect(got).toBe("plain text");
  });
});

describe("EditableField IME 组合输入（中文/日文）", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("合成期间不提交中间态，合成结束才提交完整文本", () => {
    const onChange = vi.fn();
    const { container } = render(<EditableField html="" onChange={onChange} />);
    const el = getEl(container);

    // 拼音上屏前：合成开始 + 多次 input（中间态）
    fireEvent.compositionStart(el);
    el.innerHTML = "<p>ni</p>";
    fireEvent.input(el);
    el.innerHTML = "<p>nihao</p>";
    fireEvent.input(el);
    // 合成期间不应提交
    vi.advanceTimersByTime(300);
    expect(onChange).not.toHaveBeenCalled();

    // 上屏：合成结束，最终文本为「你好」
    el.innerHTML = "<p>你好</p>";
    fireEvent.compositionEnd(el);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("你好");
  });

  it("合成结束后再正常输入仍可防抖提交", () => {
    const onChange = vi.fn();
    const { container } = render(<EditableField html="" onChange={onChange} />);
    const el = getEl(container);
    fireEvent.compositionStart(el);
    el.innerHTML = "<p>你好</p>";
    fireEvent.compositionEnd(el);
    expect(onChange).toHaveBeenCalledTimes(1);

    // 合成后继续追加输入
    onChange.mockClear();
    el.innerHTML = "<p>你好世界</p>";
    fireEvent.input(el);
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("你好世界");
  });
});

describe("EditableField 空值占位", () => {
  it("html 为空时渲染占位符类，不写脏数据", () => {
    const onChange = vi.fn();
    const { container } = render(
      <EditableField html="" placeholder="请填写" onChange={onChange} />,
    );
    const el = getEl(container);
    expect(el.className).toContain("rs-empty-hint");
    expect(el.textContent).toBe("");
  });
});
