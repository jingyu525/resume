import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { PaginatedResume } from "@/features/pagination/PaginatedResume";

const PAGE_W_PX = (210 * 96) / 25.4;

/** 右侧 A4 实时预览：自动缩放保证整页可见，实时显示总页数（FR-7） */
export function PreviewPane({ coach = false }: { coach?: boolean }) {
  const { t } = useI18n();
  const resume = useResumeStore((s) => s.resume);
  const locale = useResumeStore((s) => s.locale);
  const appearance = useResumeStore((s) => s.appearance);
  // 就地编辑：预览区即编辑器，把 store 的改写动作注入分页组件
  const updateBasicLocalized = useResumeStore((s) => s.updateBasicLocalized);
  const updateBasicPlain = useResumeStore((s) => s.updateBasicPlain);
  const renameSection = useResumeStore((s) => s.renameSection);

  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.68);
  const [box, setBox] = useState({ w: PAGE_W_PX, h: 0 });
  const [pages, setPages] = useState(1);

  // 首用序列关闭后，给首段可编辑文字一次性高亮，把"点字即改"落到真实文字上
  useEffect(() => {
    if (!coach) return;
    const id = window.setTimeout(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(".rs-editable"));
      const target = els.find((el) => el.getBoundingClientRect().width > 0) ?? els[0];
      if (!target) return;
      target.classList.add("coach-highlight");
      window.setTimeout(() => target.classList.remove("coach-highlight"), 3800);
    }, 450);
    return () => window.clearTimeout(id);
  }, [coach]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const recompute = () => {
      const avail = wrap.clientWidth - 32;
      setScale(Math.max(0.3, Math.min(1, avail / PAGE_W_PX)));
      setBox({ w: inner.scrollWidth, h: inner.scrollHeight });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(wrap);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="h-full overflow-auto bg-secondary/40 p-4">
      <div
        className="mx-auto"
        style={{ width: box.w * scale, height: box.h * scale }}
      >
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <PaginatedResume
            resume={resume}
            locale={locale}
            appearance={appearance}
            onTotalPages={setPages}
            editors={{ updateBasicLocalized, updateBasicPlain, renameSection }}
          />
        </div>
      </div>
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-popover/90 px-3 py-1 text-xs text-popover-foreground shadow-lg backdrop-blur no-print">
        {t("editor.totalPages", { n: pages })}
      </div>
    </div>
  );
}
