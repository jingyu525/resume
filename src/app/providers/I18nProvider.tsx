import type { ReactNode } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { I18nContext, translate, type I18nContextValue } from "@/shared/i18n";

/** 语言 Provider：界面文案与简历正文同源切换（FR-6） */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useResumeStore((s) => s.locale);
  const value: I18nContextValue = { locale, t: (k, p) => translate(locale, k, p) };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
