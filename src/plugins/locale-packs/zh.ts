import type { LocalePackPlugin } from "@/plugins/core/types";

/**
 * 内置简体中文语言包。
 *
 * builtin: true 表示界面文案由核心 `shared/i18n/dictionaries.ts` 提供，
 * 插件本身不带 dict —— 核心字典就是它的真源，避免同一份文案存两处。
 * 新增语言（M3）则相反：用 dict 自带文案，并可声明 fallback 走回退链。
 */
export const zhPack: LocalePackPlugin = {
  id: "locale-zh",
  kind: "locale-pack",
  labelKey: "language.zh",
  version: 1,
  code: "zh",
  label: "中文",
  builtin: true,
};
