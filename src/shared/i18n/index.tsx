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

/** 纯函数翻译：当前语言缺失 → 默认语言 → 返回 key（绝不崩溃） */
export function translate(
  locale: Locale,
  key: string,
  params?: TParams,
): string {
  const dict: Dict = dictionaries[locale] ?? {};
  const text = dict[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
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
