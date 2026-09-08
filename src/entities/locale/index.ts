/** 内置语言：M3 起通过语言包插件可注册更多语言，但内置五语保留字面量补全。 */
export type BuiltinLocale = "zh" | "en" | "ja" | "de" | "ko";

/**
 * 界面语言：内置五语保留字面量补全，同时开放给语言包插件扩展（M3）。
 * 插件语言包与内置语言共存——注册表未就绪时（如单测未 bootstrap）
 * `knownLocales()` 退化为内置清单，绝不返回空集（见 store/migrations.ts）。
 */
export type Locale = BuiltinLocale | (string & {});

export const BUILTIN_LOCALES: BuiltinLocale[] = ["zh", "en", "ja", "de", "ko"];

/** 已注册语言列表：语言包插件注册后追加。当前阶段等于内置五语，但类型开放。 */
export const LOCALES: Locale[] = [...BUILTIN_LOCALES];

// 国际化产品：默认界面语言为英语（DEFAULT_LOCALE 同时是 localized/translate 的兜底回退语言）
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<BuiltinLocale, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  de: "Deutsch",
  ko: "한국어",
};

/**
 * 运行时判断某值是否为已内置语言。
 *
 * 注意：实体层（entities）严禁反向依赖 plugins（规则 A1），故此处只校验内置五语。
 * 已安装语言包的语言由 `plugins/core/registry` 的 `registeredLocales()` 判定，
 * 其消费方是 I18nProvider / LanguageSwitcher / migrations，不在此处。
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (BUILTIN_LOCALES as string[]).includes(value);
}
