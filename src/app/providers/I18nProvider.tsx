import type { ReactNode } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { I18nContext, translate, type I18nContextValue } from "@/shared/i18n";
import { getDictionaries } from "@/plugins/core/dict";

/**
 * 语言 Provider：界面文案与简历正文同源切换（FR-6）。
 *
 * 字典来自"核心字典 + 已启用插件自带文案"的合并结果（plugins/core/dict），
 * 由 app 层注入给纯函数 translate，shared 因此无需感知插件存在。
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useResumeStore((s) => s.locale);
  const dicts = getDictionaries();
  const value: I18nContextValue = {
    locale,
    t: (k, p) => translate(locale, k, p, dicts),
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
