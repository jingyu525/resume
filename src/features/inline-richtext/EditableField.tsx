import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  sanitizeRichText,
  textToRichText,
} from "@/shared/lib/sanitize";
import { cn } from "@/shared/lib/cn";
import { useI18n } from "@/shared/i18n";
import { Bold, Highlighter, RemoveFormatting } from "lucide-react";

export interface EditableFieldProps {
  html: string;
  onChange: (html: string) => void;
  rich?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  editable?: boolean;
}

interface ToolbarState {
  visible: boolean;
  top: number;
  left: number;
}

/**
 * 就地编辑字段：预览区文字点按即编辑（FR-3）。
 * 富文本仅允许 加粗 / 强调色 / 还原格式 三个感知级动作；
 * 粘贴外部内容自动清洗（仅留语义与强调色），编辑/预览/打印共用同一份处理后文档。
 */
export function EditableField({
  html,
  onChange,
  rich = false,
  multiline = true,
  placeholder,
  className,
  ariaLabel,
  editable = true,
}: EditableFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<ToolbarState>({ visible: false, top: 0, left: 0 });
  const { t } = useI18n();

  /**
   * 展示前清洗（NFR-3 集中收口）：无论数据来自编辑面板输入、就地编辑、
   * 还是导入的备份，写入 DOM 前一律经过 sanitize，杜绝脚本注入。
   */
  const toSafeHtml = (value: string): string =>
    rich ? sanitizeRichText(value ?? "") : sanitizePlain(value ?? "");

  // 非受控：仅在外部值变化且未聚焦时同步，避免编辑时光标丢失（NFR-2）
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    const next = toSafeHtml(html);
    if (el.innerHTML !== next) el.innerHTML = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, rich]);

  useEffect(() => {
    const el = ref.current;
    if (el) el.innerHTML = toSafeHtml(html);
    // 初始化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const cleaned = rich ? sanitizeRichText(el.innerHTML) : sanitizePlain(el.innerHTML);
    onChange(cleaned);
  };

  const onInput = () => {
    window.clearTimeout((ref.current as unknown as { _t?: number })?._t);
    (ref.current as unknown as { _t?: number })._t = window.setTimeout(emit, 300);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const htmlData = e.clipboardData.getData("text/html");
    const textData = e.clipboardData.getData("text/plain");
    const fragment = rich
      ? htmlData
        ? sanitizeRichText(htmlData)
        : textToRichText(textData)
      : sanitizePlain(textData || htmlData);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const tmp = document.createElement("div");
      tmp.innerHTML = fragment;
      const frag = document.createDocumentFragment();
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      range.insertNode(frag);
      sel.collapseToEnd();
    } else {
      el.innerHTML += fragment;
    }
    emit();
  };

  const updateToolbar = () => {
    if (!rich) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) {
      setToolbar((s) => ({ ...s, visible: false }));
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setToolbar({ visible: true, top: rect.top - 44, left: rect.left + rect.width / 2 });
  };

  const applyBold = () => {
    document.execCommand("bold");
    emit();
    updateToolbar();
  };

  const applyEmphasis = () => {
    wrapEmphasis();
    emit();
    updateToolbar();
  };

  const applyReset = () => {
    document.execCommand("removeFormat");
    unwrapEmphasis(ref.current);
    emit();
    updateToolbar();
  };

  return (
    <>
      <div
        ref={ref}
        role={multiline ? "textbox" : "text"}
        aria-multiline={multiline}
        aria-label={ariaLabel}
        contentEditable={editable}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={onInput}
        onPaste={onPaste}
        onMouseUp={updateToolbar}
        onKeyUp={updateToolbar}
        onBlur={() => setToolbar((s) => ({ ...s, visible: false }))}
        className={cn(
          "rs-editable outline-none",
          !html && "rs-empty-hint",
          className,
        )}
        style={placeholder && !html ? ({ ["--ph" as string]: placeholder } as CSSProperties) : undefined}
      />
      {toolbar.visible && rich && (
        <div
          className="fixed z-[70] flex -translate-x-1/2 gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-xl no-print"
          style={{ top: toolbar.top, left: toolbar.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <ToolbarBtn label={t("inline.bold")} onClick={applyBold}>
            <Bold size={15} />
          </ToolbarBtn>
          <ToolbarBtn label={t("inline.emphasis")} onClick={applyEmphasis}>
            <Highlighter size={15} />
          </ToolbarBtn>
          <ToolbarBtn label={t("inline.reset")} onClick={applyReset}>
            <RemoveFormatting size={15} />
          </ToolbarBtn>
        </div>
      )}
    </>
  );
}

function ToolbarBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md text-popover-foreground hover:bg-secondary"
    >
      {children}
    </button>
  );
}

function sanitizePlain(dirty: string): string {
  const div = document.createElement("div");
  div.innerHTML = dirty;
  return div.textContent ?? "";
}

/** 强调色：将当前选区包裹为 <span class="rs-em">（经 sanitize 仅允许该类） */
function wrapEmphasis() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  span.className = "rs-em";
  try {
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(span);
    sel.addRange(r);
  } catch {
    // 跨节点选择失败则放弃，避免破坏结构
  }
}

function unwrapEmphasis(root: HTMLDivElement | null) {
  if (!root) return;
  root.querySelectorAll("span.rs-em").forEach((s) => {
    const parent = s.parentNode;
    if (!parent) return;
    while (s.firstChild) parent.insertBefore(s.firstChild, s);
    parent.removeChild(s);
  });
}
