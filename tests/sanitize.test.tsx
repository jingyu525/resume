import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { sanitizeRichText } from "@/shared/lib/sanitize";
import { EditableField } from "@/features/inline-richtext/EditableField";

describe("sanitizeRichText (NFR-3 XSS 防护)", () => {
  it("移除 script 与 on* 事件属性", () => {
    const dirty = '<p>hi</p><script>alert(1)</script><img src=x onerror="alert(1)">';
    const clean = sanitizeRichText(dirty);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onerror");
  });

  it("保留加粗与强调色 span", () => {
    const clean = sanitizeRichText('<p><strong>b</strong><span class="rs-em">e</span></p>');
    expect(clean).toContain("<strong>");
    expect(clean).toContain("rs-em");
  });

  it("剥离 style 与未授权 class", () => {
    const clean = sanitizeRichText('<span class="evil" style="color:red">x</span>');
    expect(clean).not.toContain("style");
    expect(clean).not.toContain("evil");
  });

  it("剔除 iframe / object 等危险标签", () => {
    const clean = sanitizeRichText('<p>ok</p><iframe src="//x"></iframe>');
    expect(clean).not.toContain("<iframe");
  });

  it("展示前清洗收口：未清洗的入库内容写入 DOM 前被净化（NFR-3）", () => {
    const dirty = '<p>ok</p><img src=x onerror="alert(1)"><script>alert(2)</script>';
    const { container } = render(<EditableField html={dirty} rich onChange={() => {}} />);
    const el = container.querySelector("[contenteditable]") as HTMLElement;
    expect(el.innerHTML).not.toContain("onerror");
    expect(el.innerHTML).not.toContain("<img");
    expect(el.innerHTML).not.toContain("<script");
    expect(el.innerHTML).toContain("ok");
  });
});
