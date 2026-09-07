import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  sanitizeRichText,
  resetRichFormat,
  textToRichText,
  richTextToPlain,
} from "@/shared/lib/sanitize";
import { EditableField } from "@/shared/ui/editable-field";

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

describe("富文本辅助纯函数", () => {
  it("resetRichFormat 仅保留段落结构，剥离 class/style", () => {
    const out = resetRichFormat('<p class="rs-em"><strong>b</strong></p><ul><li>x</li></ul>');
    expect(out).not.toContain("class");
    expect(out).not.toContain("<strong>");
    expect(out).toContain("<p>");
    expect(out).toContain("<ul>");
  });

  it("textToRichText 空串返回空，双换行分段", () => {
    expect(textToRichText("   ")).toBe("");
    expect(textToRichText("A\n\nB")).toBe("<p>A</p><p>B</p>");
    expect(textToRichText("a\nb")).toBe("<p>a<br>b</p>");
  });

  it("richTextToPlain 还原为纯文本并保留换行", () => {
    expect(richTextToPlain("<p>第一行<br>第二行</p><ul><li>项</li></ul>")).toBe(
      "第一行\n第二行\n项",
    );
  });

  it("textToRichText 转义用户输入的 < 与 &，避免被当标签", () => {
    expect(textToRichText("C++ < 2020 & Co")).toBe("<p>C++ &lt; 2020 &amp; Co</p>");
  });

  it("richTextToPlain->textToRichText：单行换行变 <br>，空白行分段变 <p>", () => {
    const html = "<p>第一段</p><p>第二段<br>续</p>";
    expect(textToRichText(richTextToPlain(html))).toBe("<p>第一段<br>第二段<br>续</p>");
  });
});
