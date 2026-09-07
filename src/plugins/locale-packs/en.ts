import type { LocalePackPlugin } from "@/plugins/core/types";

/** 内置英语语言包（文案真源为核心 dictionaries.ts） */
export const enPack: LocalePackPlugin = {
  id: "locale-en",
  kind: "locale-pack",
  labelKey: "language.en",
  version: 1,
  code: "en",
  label: "English",
  builtin: true,
};
