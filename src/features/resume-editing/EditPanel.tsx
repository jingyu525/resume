import { useMemo } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { detectEmptiness } from "@/features/empty-state/detect";
import { EmptyStateNotice } from "@/features/empty-state/EmptyStateNotice";
import { readBasicField } from "@/shared/lib/basics";
import type { Locale } from "@/entities/locale";
import type { BasicInfo, ResumeSection } from "@/entities/resume/model";
import { Input } from "@/shared/ui/input";
import { IconButton } from "@/shared/ui/button";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { listBasicsFields, listSectionTypes, getSectionType } from "@/plugins/core/registry";
import { LocalizedField } from "@/plugins/section-types/parts";
import { cn } from "@/shared/lib/cn";
import { useDragReorder } from "@/shared/ui/use-drag-reorder";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from "lucide-react";

/** 左编辑面板：基本信息 + 动态章节列表（增删改排序、隐藏、改标题、增删条目），FR-2 */
export function EditPanel() {
  const { t } = useI18n();
  const locale = useResumeStore((s) => s.locale);
  const resume = useResumeStore((s) => s.resume);
  const basics = resume.basics;
  const sections = resume.sections;
  const updateLocalized = useResumeStore((s) => s.updateBasicLocalized);
  const updatePlain = useResumeStore((s) => s.updateBasicPlain);
  const addSection = useResumeStore((s) => s.addSection);
  const reorderSection = useResumeStore((s) => s.reorderSection);

  const ordered = [...sections].sort((a, b) => a.order - b.order);
  const drag = useDragReorder((from, to) => reorderSection(ordered[from].id, to));
  const fields = listBasicsFields();
  // 区分三种「空」：结构空/渲染空报错自愈，事实空给引导，不让用户对着空白发懵
  const emptiness = useMemo(() => detectEmptiness(resume, locale), [resume, locale]);

  return (
    <div className="space-y-8 p-5">
      <EmptyStateNotice state={emptiness} />
      <section>
        <h3 className="mb-4 text-sm font-semibold">{t("edit.basic")}</h3>
        <div className="grid grid-cols-2 gap-3">
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
          {/* 联系方式由字段插件驱动：地域差异（微信 / LinkedIn）靠增删插件解决。
              每个字段带删除按钮：清空即「删除」，预览随之移除（不占位）；重新填写即「再添加」 */}
          {fields.map((field) => (
            <Field
              key={field.id}
              label={t(field.labelKey)}
              onRemove={() =>
                field.localized
                  ? updateLocalized(field.fieldKey as "city", locale, "")
                  : updatePlain(field.fieldKey as "phone", "")
              }
              removeLabel={t("edit.delete")}
            >
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
        <div className="mb-4 flex items-center justify-between">
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
        <div className="space-y-4">
          {ordered.map((sec, i) => (
            <SectionCard
              key={sec.id}
              section={sec}
              index={i}
              total={ordered.length}
              locale={locale}
              drag={drag}
            />
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
  drag,
}: {
  section: ResumeSection;
  index: number;
  total: number;
  locale: Locale;
  drag: ReturnType<typeof useDragReorder>;
}) {
  const { t } = useI18n();
  const moveSection = useResumeStore((s) => s.moveSection);
  const removeSection = useResumeStore((s) => s.removeSection);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const renameSection = useResumeStore((s) => s.renameSection);

  // 一次查表、多处复用：章节的编辑器由插件自带
  const plugin = getSectionType(section.kind);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        drag.isDragging(index) && "opacity-50",
        drag.isOver(index) && "border-primary ring-2 ring-primary/40",
      )}
      {...drag.rowProps(index)}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <IconButton
          label={t("edit.drag")}
          size="sm"
          className="cursor-grab active:cursor-grabbing"
          {...drag.handleProps(index)}
        >
          <GripVertical size={15} />
        </IconButton>
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
      <div className="space-y-3">
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
  onRemove,
  removeLabel,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            title={removeLabel}
            className="shrink-0 rounded p-0.5 hover:bg-secondary hover:text-destructive"
          >
            <Trash2 size={13} />
          </button>
        )}
      </span>
      {children}
    </label>
  );
}
