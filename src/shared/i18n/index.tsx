import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/entities/locale";
import { dictionaries, type Dict } from "./dictionaries";

export type TParams = Record<string, string | number>;

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}

/**
 * 纯函数翻译：当前语言缺失 → 默认语言 → 返回 key（绝不崩溃）。
 *
 * `dicts` 可选：插件化后字典 = 核心字典 + 插件自带文案，由 app 层（I18nProvider）
 * 注入合并结果。shared 因此不必 import plugins（FSD：shared 不得反向依赖上层）。
 */
export function translate(
  locale: Locale,
  key: string,
  params?: TParams,
  dicts?: Record<string, Dict>,
): string {
  const dict: Dict = dicts?.[locale] ?? dictionaries[locale] ?? {};
  const fallback: Dict = dicts?.[DEFAULT_LOCALE] ?? dictionaries[DEFAULT_LOCALE] ?? {};
  const text = dict[key] ?? fallback[key] ?? key;
  return interpolate(text, params);
}

export interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: TParams) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
});

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
