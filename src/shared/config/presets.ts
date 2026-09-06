import type { AppearancePref, Layout, Tone } from "@/entities/appearance/model";

/** A4 纸张尺寸（毫米） */
export const A4 = { widthMm: 210, heightMm: 297 } as const;

/** 精选专业主色，避免选色压力 */
export const ACCENT_COLORS: { value: string; label: string }[] = [
  { value: "#2563EB", label: "Classic Blue" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#16A34A", label: "Emerald" },
  { value: "#DC2626", label: "Crimson" },
  { value: "#7C3AED", label: "Violet" },
  { value: "#D97706", label: "Amber" },
  { value: "#0F172A", label: "Ink" },
  { value: "#DB2777", label: "Rose" },
];

export const LAYOUTS: { value: Layout; labelKey: string }[] = [
  { value: "single", labelKey: "layout.single" },
  { value: "sidebar", labelKey: "layout.sidebar" },
];

export const TONES: { value: Tone; labelKey: string }[] = [
  { value: "formal", labelKey: "tone.formal" },
  { value: "soft", labelKey: "tone.soft" },
  { value: "lively", labelKey: "tone.lively" },
];

/** density(0~1) -> 页边距(mm)，紧凑↔舒展 */
export function pageMarginMm(density: number): number {
  return Math.round(12 + clamp01(density) * 10);
}

/** 底栏保护区（mm），避免正文贴底 */
export const SAFE_ZONE_MM = 10;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

const TONE_TYPO: Record<Tone, { headingFont: string; bodyFont: string; headingWeight: number }> = {
  formal: {
    headingFont: "Georgia, 'Times New Roman', 'Songti SC', serif",
    bodyFont: "'Inter', 'PingFang SC', system-ui, sans-serif",
    headingWeight: 600,
  },
  soft: {
    headingFont: "'Inter', 'PingFang SC', system-ui, sans-serif",
    bodyFont: "'Inter', 'PingFang SC', system-ui, sans-serif",
    headingWeight: 600,
  },
  lively: {
    headingFont: "'Inter', 'PingFang SC', system-ui, sans-serif",
    bodyFont: "'Inter', 'PingFang SC', system-ui, sans-serif",
    headingWeight: 800,
  },
};

/** 将"直觉轴"翻译为具体版面 CSS 变量，供简历预览/打印使用 */
export function resolveResumeTheme(a: AppearancePref): React.CSSProperties {
  const density = clamp01(a.density);
  const margin = pageMarginMm(density);
  const typo = TONE_TYPO[a.tone];
  const baseFont = 10.5 + density * 1.5; // 10.5pt ~ 12pt
  const lineHeight = 1.35 + density * 0.55; // 紧凑↔舒展
  const gap = 6 + density * 10;
  const sectionGap = 10 + density * 12;
  return {
    ["--rs-accent" as string]: a.accent,
    ["--rs-margin" as string]: `${margin}mm`,
    ["--rs-safe" as string]: `${SAFE_ZONE_MM}mm`,
    ["--rs-font-size" as string]: `${baseFont}pt`,
    ["--rs-line-height" as string]: String(lineHeight),
    ["--rs-gap" as string]: `${gap}px`,
    ["--rs-section-gap" as string]: `${sectionGap}px`,
    ["--rs-heading-font" as string]: typo.headingFont,
    ["--rs-body-font" as string]: typo.bodyFont,
    ["--rs-heading-weight" as string]: String(typo.headingWeight),
  } as React.CSSProperties;
}
