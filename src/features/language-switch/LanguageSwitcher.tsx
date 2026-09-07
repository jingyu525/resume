import type { Locale } from "@/entities/locale";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { listLocalePacks } from "@/plugins/core/registry";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { Languages, Check } from "lucide-react";
import { Globe } from "lucide-react";

/**
 * 界面语言切换：切换时界面文案与简历正文（预览/打印/导出）同步切换（FR-6）。
 *
 * 语言列表来自语言包插件注册表（不再是硬编码 LOCALES）：
 * 安装新语言包后这里自动出现，无需改本组件。
 */
export function LanguageSwitcher({ showLabel = true }: { showLabel?: boolean }) {
  const locale = useResumeStore((s) => s.locale);
  const setLocale = useResumeStore((s) => s.setLocale);
  const { t } = useI18n();

  const packs = listLocalePacks();
  const current = packs.find((p) => p.code === locale);

  return (
    <DropdownMenu
      align="end"
      trigger={
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-secondary">
          <Languages size={16} />
          {showLabel && (
            <span className="i18n-truncate max-w-[6rem]">
              {current ? t(current.labelKey) : String(locale)}
            </span>
          )}
        </span>
      }
      items={packs.map((p) => ({
        label: t(p.labelKey),
        icon:
          locale === (p.code as Locale) ? (
            <Check size={15} className="text-primary" />
          ) : (
            <Globe size={15} className="opacity-0" />
          ),
        onClick: () => setLocale(p.code as Locale),
      }))}
    />
  );
}
