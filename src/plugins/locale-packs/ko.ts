import type { LocalePackPlugin } from "@/plugins/core/types";

/** 内置韩语语言包（文案真源为核心 dictionaries.ts） */
export const koPack: LocalePackPlugin = {
  id: "locale-ko",
  kind: "locale-pack",
  labelKey: "language.ko",
  version: 1,
  code: "ko",
  label: "한국어",
  builtin: true,
};
