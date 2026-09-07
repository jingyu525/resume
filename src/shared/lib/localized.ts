import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/entities/locale";
import type { Localized } from "@/entities/resume/model";

/**
 * 带来源的读取：返回值 + 实际命中语言 + 是否走了回退。
 * 编辑区据此提示「当前语言缺失，正在显示 X 回退」，避免静默串语言。
 */
export function localizedSource<T>(
  field: Localized<T> | undefined,
  locale: Locale,
): { value: T | undefined; source: Locale | undefined; fallback: boolean } {
  if (!field) return { value: undefined, source: undefined, fallback: false };
  if (field[locale] !== undefined && field[locale] !== null)
    return { value: field[locale], source: locale, fallback: false };
  if (field[DEFAULT_LOCALE] !== undefined && field[DEFAULT_LOCALE] !== null)
    return { value: field[DEFAULT_LOCALE], source: DEFAULT_LOCALE, fallback: true };
  for (const l of LOCALES) {
    if (l === locale || l === DEFAULT_LOCALE) continue;
    if (field[l] !== undefined && field[l] !== null)
      return { value: field[l], source: l, fallback: true };
  }
  return { value: undefined, source: undefined, fallback: false };
}

/**
 * 多语言字段回退：当前语言 → 默认语言(zh) → 任一已有语言。
 * 保证缺语言也能出片（FR-6）。
 */
export function localizedValue<T>(
  field: Localized<T> | undefined,
  locale: Locale,
): T | undefined {
  return localizedSource(field, locale).value;
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
