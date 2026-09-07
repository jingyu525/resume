import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { readBasicField } from "@/shared/lib/basics";
import type { Locale } from "@/entities/locale";
import type { BasicInfo, ResumeSection } from "@/entities/resume/model";
import { Input } from "@/shared/ui/input";
import { IconButton } from "@/shared/ui/button";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { listBasicsFields, listSectionTypes, getSectionType } from "@/plugins/core/registry";
import { LocalizedField } from "@/plugins/section-types/parts";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

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
  const fields = listBasicsFields();

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
          {/* 联系方式由字段插件驱动：地域差异（微信 / LinkedIn）靠增删插件解决 */}
          {fields.map((field) => (
            <Field key={field.id} label={t(field.labelKey)}>
              {field.localized ? (
                <LocalizedField
                  field={localizedOrEmpty(basics, field.fieldKey)}
                  locale={locale}
                  onChange={(v) => updateLocalized(field.fieldKey as "city", locale, v)}
                />
              ) : (
                <Input
                  value={readBasicField(basics, field, locale)}
                  onChange={(e) => updatePlain(field.fieldKey as "phone", e.target.value)}
                />
              )}
            </Field>
          ))}
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
            items={listSectionTypes().map((p) => ({
              label: t(p.labelKey),
              onClick: () => addSection(p.sectionKind),
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

/** 取字段的 Localized 值（仅多语言字段使用） */
function localizedOrEmpty(basics: BasicInfo, fieldKey: string) {
  return (basics as unknown as Record<string, { [k: string]: string }>)[fieldKey] ?? {};
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

  // 一次查表、多处复用：章节的编辑器由插件自带
  const plugin = getSectionType(section.kind);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <IconButton
          label={t("edit.up")}
          size="sm"
          onClick={() => moveSection(section.id, -1)}
          disabled={index === 0}
        >
          <ArrowUp size={15} />
        </IconButton>
        <IconButton
          label={t("edit.down")}
          size="sm"
          onClick={() => moveSection(section.id, 1)}
          disabled={index === total - 1}
        >
          <ArrowDown size={15} />
        </IconButton>
        <LocalizedField
          className="h-8 flex-1 text-sm font-medium"
          field={section.title}
          locale={locale}
          onChange={(v) => renameSection(section.id, locale, v)}
        />
        <IconButton
          label={section.visible ? t("edit.hide") : t("edit.show")}
          size="sm"
          onClick={() => toggleSection(section.id)}
        >
          {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </IconButton>
        <IconButton
          label={t("edit.delete")}
          size="sm"
          variant="ghost"
          onClick={() => removeSection(section.id)}
        >
          <Trash2 size={15} />
        </IconButton>
      </div>
      <div className="space-y-2">
        {plugin ? (
          plugin.renderEditor({ section, locale, t })
        ) : (
          <p className="px-1 text-xs text-muted-foreground">{t("edit.missingPlugin")}</p>
        )}
      </div>
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
