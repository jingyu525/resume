import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { localizedSource } from "@/shared/lib/localized";
import { LOCALE_LABELS, type Locale } from "@/entities/locale";
import type { Localized, ResumeSection, SectionKind } from "@/entities/resume/model";
import { Input, Textarea } from "@/shared/ui/input";
import { richTextToPlain, textToRichText } from "@/shared/lib/sanitize";
import { Button, IconButton } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { DropdownMenu } from "@/shared/ui/dropdown";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

const ADDABLE: SectionKind[] = ["summary", "experience", "project", "education", "skills"];

const identity = (v: string) => v;

/**
 * 多语言字段输入：当前语言缺失时，以虚线边框 + 浅色标出「正在显示回退」，
 * 避免编辑区静默显示其它语言而被误认为 bug（输入即按当前语言保存）。
 */
function LocalizedField({
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
    fallback && source ? t("edit.fallbackHint", { lang: LOCALE_LABELS[source] }) : undefined;
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

/** 左编辑面板：基本信息 + 动态章节列表（增删改排序、隐藏、改标题、增删条目），FR-2 */
export function EditPanel() {
  const { t } = useI18n();
  const locale = useResumeStore((s) => s.locale);
  const basics = useResumeStore((s) => s.resume.basics);
  const sections = useResumeStore((s) => s.resume.sections);
  const updateLocalized = useResumeStore((s) => s.updateBasicLocalized);
  const updatePlain = useResumeStore((s) => s.updateBasicPlain);
  const addSection = useResumeStore((s) => s.addSection);

  const ordered = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 p-4">
      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("edit.basic")}</h3>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("edit.name")}>
            <LocalizedField
              field={basics.name}
              locale={locale}
              onChange={(v) => updateLocalized("name", locale, v)}
            />
          </Field>
          <Field label={t("edit.jobTitle")}>
            <LocalizedField
              field={basics.title}
              locale={locale}
              onChange={(v) => updateLocalized("title", locale, v)}
            />
          </Field>
          <Field label={t("edit.phone")}>
            <Input value={basics.phone} onChange={(e) => updatePlain("phone", e.target.value)} />
          </Field>
          <Field label={t("edit.email")}>
            <Input value={basics.email} onChange={(e) => updatePlain("email", e.target.value)} />
          </Field>
          <Field label={t("edit.city")}>
            <LocalizedField
              field={basics.city}
              locale={locale}
              onChange={(v) => updateLocalized("city", locale, v)}
            />
          </Field>
          <Field label={t("edit.wechat")}>
            <Input value={basics.wechat} onChange={(e) => updatePlain("wechat", e.target.value)} />
          </Field>
          <Field label={t("edit.website")} className="col-span-2">
            <Input value={basics.website} onChange={(e) => updatePlain("website", e.target.value)} />
          </Field>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("edit.sections")}</h3>
          <DropdownMenu
            align="end"
            trigger={
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
                <Plus size={15} /> {t("edit.addSection")}
              </span>
            }
            items={ADDABLE.map((k) => ({
              label: t(`sec.${k}`),
              onClick: () => addSection(k),
            }))}
          />
        </div>
        <div className="space-y-3">
          {ordered.map((sec, i) => (
            <SectionCard key={sec.id} section={sec} index={i} total={ordered.length} locale={locale} />
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">{t("edit.fillHint")}</p>
    </div>
  );
}

function SectionCard({
  section,
  index,
  total,
  locale,
}: {
  section: ResumeSection;
  index: number;
  total: number;
  locale: Locale;
}) {
  const { t } = useI18n();
  const moveSection = useResumeStore((s) => s.moveSection);
  const removeSection = useResumeStore((s) => s.removeSection);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const renameSection = useResumeStore((s) => s.renameSection);
  const addItem = useResumeStore((s) => s.addItem);
  const addGroup = useResumeStore((s) => s.addGroup);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <IconButton label={t("edit.up")} size="sm" onClick={() => moveSection(section.id, -1)} disabled={index === 0}>
          <ArrowUp size={15} />
        </IconButton>
        <IconButton label={t("edit.down")} size="sm" onClick={() => moveSection(section.id, 1)} disabled={index === total - 1}>
          <ArrowDown size={15} />
        </IconButton>
        <LocalizedField
          className="h-8 flex-1 text-sm font-medium"
          field={section.title}
          locale={locale}
          onChange={(v) => renameSection(section.id, locale, v)}
          ariaLabel={t("edit.rename")}
        />
        <IconButton
          label={section.visible ? t("edit.hide") : t("edit.show")}
          size="sm"
          onClick={() => toggleSection(section.id)}
        >
          {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </IconButton>
        <IconButton label={t("edit.delete")} size="sm" variant="ghost" onClick={() => removeSection(section.id)}>
          <Trash2 size={15} />
        </IconButton>
      </div>

      {section.kind === "skills" ? (
        <GroupsEditor sectionId={section.id} groups={section.groups} locale={locale} />
      ) : (
        <ItemsEditor sectionId={section.id} items={section.items} locale={locale} />
      )}

      <Button
        variant="subtle"
        size="sm"
        className="mt-2 w-full"
        onClick={() => (section.kind === "skills" ? addGroup(section.id) : addItem(section.id))}
      >
        <Plus size={15} /> {section.kind === "skills" ? t("edit.addGroup") : t("edit.addItem")}
      </Button>
    </div>
  );
}

function ItemsEditor({
  sectionId,
  items,
  locale,
}: {
  sectionId: string;
  items: ResumeSection["items"];
  locale: Locale;
}) {
  const { t } = useI18n();
  const updateLocalized = useResumeStore((s) => s.updateItemLocalized);
  const updateDate = useResumeStore((s) => s.updateItemDate);
  const updateDesc = useResumeStore((s) => s.updateItemDesc);
  const removeItem = useResumeStore((s) => s.removeItem);
  const moveItem = useResumeStore((s) => s.moveItem);

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.id} className="rounded-lg bg-secondary/50 p-2">
          <div className="mb-1.5 flex items-center gap-1">
            <IconButton label={t("edit.up")} size="sm" onClick={() => moveItem(sectionId, it.id, -1)} disabled={i === 0}>
              <ArrowUp size={14} />
            </IconButton>
            <IconButton label={t("edit.down")} size="sm" onClick={() => moveItem(sectionId, it.id, 1)} disabled={i === items.length - 1}>
              <ArrowDown size={14} />
            </IconButton>
            <div className="flex-1" />
            <IconButton label={t("edit.delete")} size="sm" onClick={() => removeItem(sectionId, it.id)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
          <div className="space-y-1.5">
            <LocalizedField
              className="h-8"
              placeholder={t("edit.itemTitlePlaceholder")}
              field={it.title}
              locale={locale}
              onChange={(v) => updateLocalized(sectionId, it.id, "title", locale, v)}
            />
            <LocalizedField
              className="h-8"
              placeholder={t("edit.itemSubtitlePlaceholder")}
              field={it.subtitle}
              locale={locale}
              onChange={(v) => updateLocalized(sectionId, it.id, "subtitle", locale, v)}
            />
            <div className="flex items-center gap-2">
              <Input
                className="h-8"
                type="month"
                aria-label={t("edit.startDate")}
                value={it.startDate}
                onChange={(e) => updateDate(sectionId, it.id, { startDate: e.target.value })}
              />
              <Input
                className="h-8"
                type="month"
                aria-label={t("edit.endDate")}
                value={it.endDate}
                disabled={it.current}
                onChange={(e) => updateDate(sectionId, it.id, { endDate: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={it.current} onChange={(v) => updateDate(sectionId, it.id, { current: v })} />
              {t("edit.current")}
            </label>
            <LocalizedField
              className="min-h-16 text-xs"
              placeholder={t("edit.summaryPlaceholder")}
              field={it.description}
              locale={locale}
              multiline
              toView={richTextToPlain}
              fromView={textToRichText}
              onChange={(v) => updateDesc(sectionId, it.id, locale, v)}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">{t("edit.fillHint")}</p>
      )}
    </div>
  );
}

function GroupsEditor({
  sectionId,
  groups,
  locale,
}: {
  sectionId: string;
  groups: ResumeSection["groups"];
  locale: Locale;
}) {
  const { t } = useI18n();
  const updateName = useResumeStore((s) => s.updateGroupName);
  const updateItems = useResumeStore((s) => s.updateGroupItems);
  const removeGroup = useResumeStore((s) => s.removeGroup);
  const moveGroup = useResumeStore((s) => s.moveGroup);

  return (
    <div className="space-y-2">
      {groups.map((g, i) => (
        <div key={g.id} className="rounded-lg bg-secondary/50 p-2">
          <div className="mb-1.5 flex items-center gap-1">
            <IconButton label={t("edit.up")} size="sm" onClick={() => moveGroup(sectionId, g.id, -1)} disabled={i === 0}>
              <ArrowUp size={14} />
            </IconButton>
            <IconButton label={t("edit.down")} size="sm" onClick={() => moveGroup(sectionId, g.id, 1)} disabled={i === groups.length - 1}>
              <ArrowDown size={14} />
            </IconButton>
            <div className="flex-1" />
            <IconButton label={t("edit.delete")} size="sm" onClick={() => removeGroup(sectionId, g.id)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
          <LocalizedField
            className="h-8"
            placeholder={t("edit.groupNamePlaceholder")}
            field={g.name}
            locale={locale}
            onChange={(v) => updateName(sectionId, g.id, locale, v)}
          />
          <LocalizedField
            className="mt-1.5 min-h-14 text-xs"
            placeholder={t("edit.skillItemPlaceholder")}
            field={g.items}
            locale={locale}
            multiline
            onChange={(v) => updateItems(sectionId, g.id, locale, v)}
          />
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
