import { LOCALES, LOCALE_LABELS, type Locale } from "@/entities/locale";
import { useResumeStore } from "@/store/useResumeStore";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { Languages, Check } from "lucide-react";
import { Globe } from "lucide-react";

/** 界面语言切换：切换时界面文案与简历正文（预览/打印/导出）同步切换（FR-6） */
export function LanguageSwitcher({ showLabel = true }: { showLabel?: boolean }) {
  const locale = useResumeStore((s) => s.locale);
  const setLocale = useResumeStore((s) => s.setLocale);

  return (
    <DropdownMenu
      align="end"
      trigger={
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-secondary">
          <Languages size={16} />
          {showLabel && (
            <span className="i18n-truncate max-w-[6rem]">{LOCALE_LABELS[locale]}</span>
          )}
        </span>
      }
      items={LOCALES.map((l: Locale) => ({
        label: LOCALE_LABELS[l],
        icon: locale === l ? <Check size={15} className="text-primary" /> : <Globe size={15} className="opacity-0" />,
        onClick: () => setLocale(l),
      }))}
    />
  );
}
