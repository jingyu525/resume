import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/entities/locale";
import type { Localized } from "@/entities/resume/model";

/**
 * 多语言字段回退：当前语言 → 默认语言(zh) → 任一已有语言。
 * 保证缺语言也能出片（FR-6）。
 */
export function localizedValue<T>(
  field: Localized<T> | undefined,
  locale: Locale,
): T | undefined {
  if (!field) return undefined;
  if (field[locale] !== undefined && field[locale] !== null) return field[locale];
  if (field[DEFAULT_LOCALE] !== undefined && field[DEFAULT_LOCALE] !== null)
    return field[DEFAULT_LOCALE];
  for (const l of LOCALES) {
    if (l === locale || l === DEFAULT_LOCALE) continue;
    if (field[l] !== undefined && field[l] !== null) return field[l];
  }
  return undefined;
}

/** 取展示用字符串，缺值回退为空串 */
export function localizedText(
  field: Localized<string> | undefined,
  locale: Locale,
): string {
  return localizedValue(field, locale) ?? "";
}

/** 富文本是否为空（无可见文本且无标签） */
export function isRichEmpty(html: string | undefined): boolean {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length === 0;
}
