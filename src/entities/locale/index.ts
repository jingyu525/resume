export type Locale = "zh" | "en" | "ja" | "de" | "ko";

export const LOCALES: Locale[] = ["zh", "en", "ja", "de", "ko"];

export const DEFAULT_LOCALE: Locale = "zh";

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  de: "Deutsch",
  ko: "한국어",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}
