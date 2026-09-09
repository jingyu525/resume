/**
 * 章节插件共享的表单件：预览区弹层与左面板编辑器共用同一份实现，
 * 避免「同一控件两处各写一遍、改一处漏一处」。
 *
 * 放在插件层而非 features：章节插件要自带渲染与编辑能力，而插件不得反向依赖
 * features（否则 features → plugins → features 成环）。这里只依赖 shared。
 */
import { useI18n } from "@/shared/i18n";
import { localizedSource } from "@/shared/lib/localized";
import { LOCALE_LABELS, type BuiltinLocale, type Locale } from "@/entities/locale";
import type { Localized } from "@/entities/resume/model";
import { Input, Textarea } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { cn } from "@/shared/lib/cn";

const identity = (v: string) => v;

/**
 * 多语言字段输入：当前语言缺失时以虚线边框 + 浅色标出「正在显示回退」，
 * 避免编辑区静默显示其它语言而被误认为 bug（输入即按当前语言保存）。
 */
export function LocalizedField({
  field,
  locale,
  onChange,
  className,
  placeholder,
  ariaLabel,
  multiline = false,
  toView = identity,
  fromView = identity,
}: {
  field: Localized<string>;
  locale: Locale;
  onChange: (raw: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  multiline?: boolean;
  toView?: (raw: string) => string;
  fromView?: (view: string) => string;
}) {
  const { t } = useI18n();
  const { value, source, fallback } = localizedSource(field, locale);
  const hint =
    fallback && source ? t("edit.fallbackHint", { lang: LOCALE_LABELS[source as BuiltinLocale] }) : undefined;
  const shared = {
    className: cn(className, fallback && "border-dashed text-muted-foreground"),
    placeholder,
    "aria-label": ariaLabel,
    title: hint,
    value: toView(value ?? ""),
  };

  return multiline ? (
    <Textarea {...shared} onChange={(e) => onChange(fromView(e.target.value))} />
  ) : (
    <Input {...shared} onChange={(e) => onChange(fromView(e.target.value))} />
  );
}

/** 日期字段的编辑补丁（与 store 的 updateItemDate 对齐） */
export interface DatePatch {
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

/**
 * 起止时间编辑（起始 / 结束 / 至今）。
 *
 * 预览区日期弹层与左面板条目编辑器的唯一实现：今后改日期语义（粒度、"至今"
 * 之外的选项等）只需改这一处，两个编辑面自动一致。
 */
export function DateRangeFields({
  startDate,
  endDate,
  current,
  onChange,
}: {
  startDate: string;
  endDate: string;
  current: boolean;
  onChange: (patch: DatePatch) => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{t("edit.startDate")}</label>
        <Input
          type="month"
          className="h-8"
          aria-label={t("edit.startDate")}
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </div>
      <div className="mt-2 space-y-1">
        <label className="text-xs text-muted-foreground">{t("edit.endDate")}</label>
        <Input
          type="month"
          className="h-8"
          aria-label={t("edit.endDate")}
          value={endDate}
          disabled={current}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Switch checked={current} onChange={(v) => onChange({ current: v })} />
        {t("edit.current")}
      </label>
    </>
  );
}
