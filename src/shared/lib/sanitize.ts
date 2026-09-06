import DOMPurify from "dompurify";

/** 富文本仅允许的安全语义标签 */
const ALLOWED_RICH_TAGS = ["p", "br", "strong", "b", "em", "i", "span", "ul", "ol", "li"];

/** 强调色 span 允许的唯一类名（通过 CSS 变量着色，绝不内联 style，杜绝样式注入） */
const ALLOWED_SPAN_CLASS = "rs-em";

let hookInstalled = false;
function installHook() {
  if (hookInstalled) return;
  hookInstalled = true;
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName === "class") {
      const el = node as Element;
      if (el.tagName.toLowerCase() === "span") {
        if (data.attrValue !== ALLOWED_SPAN_CLASS) {
          data.attrValue = "";
          data.keepAttr = false;
        }
      } else {
        data.attrValue = "";
        data.keepAttr = false;
      }
    }
  });
}
installHook();

/**
 * 清洗富文本，杜绝 XSS（NFR-3）。
 * 仅保留安全语义标签与强调色类名；移除所有 style / on* 事件属性与危险标签。
 */
export function sanitizeRichText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ALLOWED_RICH_TAGS,
    ALLOWED_ATTR: ["class"],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style", "onerror", "onload", "onclick", "onmouseover"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "link", "meta"],
  });
}

/** 还原格式：保留段落结构，移除所有加粗/强调等内联语义 */
export function resetRichFormat(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
    FORBID_ATTR: ["style", "class"],
  });
}

/** 将纯文本转为保留分段结构的富文本（换行 -> 段落） */
export function textToRichText(text: string): string {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return "";
  const blocks = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return blocks
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** 富文本 -> 纯文本（用于测量与导出校验） */
export function richTextToPlain(html: string): string {
  return html
    .replace(/<\/(p|li|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}
