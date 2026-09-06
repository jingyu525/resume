import type { Locale } from "@/entities/locale";

const PRESENT: Record<Locale, string> = {
  zh: "至今",
  en: "Present",
  ja: "現在",
  de: "Heute",
  ko: "현재",
};

function fmt(d: string): string {
  if (!d) return "";
  return d.replace("-", ".");
}

/** 起止时间格式化，含"至今"；时间字段与语言无关，仅"至今"文案随语言 */
export function formatPeriod(
  start: string,
  end: string,
  current: boolean,
  locale: Locale,
): string {
  const s = fmt(start);
  if (current) {
    return s ? `${s} – ${PRESENT[locale]}` : PRESENT[locale];
  }
  const e = fmt(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  if (e) return e;
  return "";
}
