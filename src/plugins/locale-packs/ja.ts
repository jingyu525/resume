import type { LocalePackPlugin } from "@/plugins/core/types";

/** 内置日语语言包（文案真源为核心 dictionaries.ts） */
export const jaPack: LocalePackPlugin = {
  id: "locale-ja",
  kind: "locale-pack",
  labelKey: "language.ja",
  version: 1,
  code: "ja",
  label: "日本語",
  builtin: true,
};
