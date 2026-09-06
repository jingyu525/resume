import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Locale } from "@/entities/locale";
import type { AppearancePref } from "@/entities/appearance/model";
import type { ResumeData } from "@/entities/resume/model";
import { A4, SAFE_ZONE_MM, pageMarginMm, resolveResumeTheme } from "@/shared/config/presets";
import { useI18n } from "@/shared/i18n";
import { buildBlocks, type Block } from "./buildBlocks";
import { distributeBlocks } from "./distribute";
import { BlockView } from "./BlockView";

const MM = 96 / 25.4;
const SIDEBAR_MM = 62;
const GAP_MM = 6;

export interface PaginatedResumeProps {
  resume: ResumeData;
  locale: Locale;
  appearance: AppearancePref;
  onTotalPages?: (n: number) => void;
}

export function PaginatedResume({
  resume,
  locale,
  appearance,
  onTotalPages,
}: PaginatedResumeProps) {
  const { t } = useI18n();
  const theme = resolveResumeTheme(appearance);
  const marginMm = pageMarginMm(appearance.density);
  const mainWidthMm =
    appearance.layout === "sidebar"
      ? A4.widthMm - 2 * marginMm - SIDEBAR_MM - GAP_MM
      : A4.widthMm - 2 * marginMm;

  const { sidebar, main } = buildBlocks(resume, locale, appearance.layout);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [pages, setPages] = useState<Block[][]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      const contentHmm = A4.heightMm - 2 * marginMm - SAFE_ZONE_MM;
      const contentHpx = contentHmm * MM;
      const heights = new Map<string, number>();
      refs.current.forEach((el, id) => {
        heights.set(id, el.offsetHeight);
      });

      const laid = distributeBlocks(main, heights, contentHpx);
      if (!cancelled) {
        setPages(laid.length ? laid : [[]]);
        onTotalPages?.(laid.length || 1);
      }
    };
    const raf = requestAnimationFrame(() => {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(run).catch(run);
      } else {
        run();
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, locale, appearance.layout, appearance.density, appearance.tone, appearance.accent, main.length, sidebar.length]);

  const register = (el: HTMLDivElement | null, id: string) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  };

  const pageStyle: CSSProperties = {
    ...(theme as CSSProperties),
    width: `${A4.widthMm}mm`,
  };
  const mainWidth = { width: `${mainWidthMm}mm` };

  const wrap = (b: Block, isMeasure: boolean) => (
    <div
      key={b.id}
      ref={(el) => {
        if (isMeasure) register(el, b.id);
      }}
      style={{ display: "flow-root" }}
    >
      <BlockView block={b} locale={locale} />
    </div>
  );

  return (
    <div className="rs-paginated">
      {/* 测量层：隐藏，仅用于取得真实高度（FR-7 防抖重排） */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <div className="a4-page rs-doc" style={pageStyle}>
          <div style={mainWidth}>{main.map((b) => wrap(b, true))}</div>
          {appearance.layout === "sidebar" && (
            <div className="rs-sidebar" style={{ width: `${SIDEBAR_MM}mm` }}>
              {sidebar.map((b) => wrap(b, true))}
            </div>
          )}
        </div>
      </div>

      {/* 可见页 */}
      {pages.map((pg, idx) => (
        <div key={idx} className="a4-page rs-doc rs-page print-area" style={pageStyle}>
          {appearance.layout === "sidebar" ? (
            <div style={{ display: "flex", gap: `${GAP_MM}mm` }}>
              <div
                className="rs-sidebar"
                style={{ width: `${SIDEBAR_MM}mm`, flexShrink: 0 }}
              >
                {sidebar.map((b) => wrap(b, false))}
              </div>
              <div style={{ ...mainWidth, flex: 1 }}>{pg.map((b) => wrap(b, false))}</div>
            </div>
          ) : (
            <div style={mainWidth}>
              {pg.length === 0 ? (
                <p className="rs-empty-hint" style={{ textAlign: "center", marginTop: "40mm" }}>
                  {t("editor.viewHint")}
                </p>
              ) : (
                pg.map((b) => wrap(b, false))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
