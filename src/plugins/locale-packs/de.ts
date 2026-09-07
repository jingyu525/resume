import type { LocalePackPlugin } from "@/plugins/core/types";

/** 内置德语语言包（文案真源为核心 dictionaries.ts） */
export const dePack: LocalePackPlugin = {
  id: "locale-de",
  kind: "locale-pack",
  labelKey: "language.de",
  version: 1,
  code: "de",
  label: "Deutsch",
  builtin: true,
};
