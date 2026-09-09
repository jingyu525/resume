/**
 * 章节插件共享 UI：预览渲染块（item / skill-group）与左面板编辑器（条目 / 分组）。
 *
 * 放在插件层而非 features：章节插件要自带渲染与编辑能力，而插件不得反向依赖
 * features（否则 features → plugins → features 成环）。这些组件只依赖 shared 与 store。
 */
import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { localizedSource, localizedText } from "@/shared/lib/localized";
import { formatPeriod } from "@/shared/lib/format";
import { LOCALE_LABELS, type BuiltinLocale, type Locale } from "@/entities/locale";
import type { Localized, ResumeItem, ResumeSection, SkillGroup } from "@/entities/resume/model";
import { Input, Textarea } from "@/shared/ui/input";
import { richTextToPlain, textToRichText } from "@/shared/lib/sanitize";
import { Button, IconButton } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { EditableField } from "@/shared/ui/editable-field";
import { useDragReorder } from "@/shared/ui/use-drag-reorder";
import { sampleHints, withSampleHint } from "@/plugins/sample-hints";
import { ArrowDown, ArrowUp, Plus, Trash2, GripVertical } from "lucide-react";
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

/** 预览块：经历条目（公司/项目/学校 + 职位 + 日期 + 富文本描述） */
export function ItemBlockView({
  item,
  sectionId,
  locale,
  hasHeader,
}: {
  item: ResumeItem;
  sectionId: string;
  locale: Locale;
  hasHeader: boolean;
}) {
  const { t } = useI18n();
  const updateLocalized = useResumeStore((s) => s.updateItemLocalized);
  const updateDesc = useResumeStore((s) => s.updateItemDesc);

  const showHeader = hasHeader || Boolean(localizedText(item.title, locale));

  return (
    <div className="rs-item">
      {showHeader && (
        <div className="rs-item-head">
          <div>
            <EditableField
              ariaLabel={t("edit.itemTitlePlaceholder")}
              html={localizedText(item.title, locale)}
              placeholder={t("edit.itemTitlePlaceholder")}
              multiline={false}
              className="rs-item-title"
              onChange={(v) => updateLocalized(sectionId, item.id, "title", locale, v)}
            />
            <EditableField
              ariaLabel={t("edit.itemSubtitlePlaceholder")}
              html={localizedText(item.subtitle, locale)}
              placeholder={t("edit.itemSubtitlePlaceholder")}
              multiline={false}
              className="rs-item-sub"
              onChange={(v) => updateLocalized(sectionId, item.id, "subtitle", locale, v)}
            />
          </div>
          <ItemDateEditor item={item} sectionId={sectionId} locale={locale} />
        </div>
      )}
      <div className="rs-desc">
        <EditableField
          ariaLabel={t("edit.summaryPlaceholder")}
          html={localizedText(item.description, locale)}
          placeholder={t("edit.summaryPlaceholder")}
          rich
          onChange={(v) => updateDesc(sectionId, item.id, locale, v)}
        />
      </div>
    </div>
  );
}

/**
 * 预览区日期：点击弹出起止时间编辑（与左面板共用同一套结构化字段
 * startDate/endDate/current）。
 *
 * 日期是可选字段：可整体删除（showDate=false），删除后该条目在预览与保存的
 * PDF 中都不显示任何日期；空值占位是编辑提示，带 no-print 不会上纸。
 */
function ItemDateEditor({
  item,
  sectionId,
  locale,
}: {
  item: ResumeItem;
  sectionId: string;
  locale: Locale;
}) {
  const { t } = useI18n();
  const updateDate = useResumeStore((s) => s.updateItemDate);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const showDate = item.showDate !== false;
  const date = formatPeriod(item.startDate, item.endDate, item.current, locale);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 字段已删除：仅编辑器内显示「添加日期」回复按钮（no-print，不上纸）
  if (!showDate) {
    return (
      <button
        type="button"
        onClick={() => updateDate(sectionId, item.id, { showDate: true })}
        className="no-print rs-item-date cursor-pointer rounded px-1 text-muted-foreground italic hover:bg-foreground/5"
        aria-label={t("edit.datePlaceholder")}
        title={t("edit.datePlaceholder")}
      >
        {t("edit.datePlaceholder")}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("edit.datePlaceholder")}
        title={date || t("edit.datePlaceholder")}
        className={cn(
          "rs-item-date cursor-pointer rounded px-1 hover:bg-foreground/5",
          // 空值占位是编辑提示，必须 no-print，否则会印到 PDF
          !date && "no-print text-muted-foreground italic",
        )}
      >
        {date || t("edit.datePlaceholder")}
      </button>
      {open && (
        <div className="no-print absolute right-0 z-50 mt-1 w-60 rounded-xl border border-border bg-popover p-3 shadow-xl">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t("edit.startDate")}</label>
            <Input
              type="month"
              className="h-8"
              value={item.startDate}
              onChange={(e) => updateDate(sectionId, item.id, { startDate: e.target.value })}
            />
          </div>
          <div className="mt-2 space-y-1">
            <label className="text-xs text-muted-foreground">{t("edit.endDate")}</label>
            <Input
              type="month"
              className="h-8"
              value={item.endDate}
              disabled={item.current}
              onChange={(e) => updateDate(sectionId, item.id, { endDate: e.target.value })}
            />
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={item.current}
              onChange={(v) => updateDate(sectionId, item.id, { current: v })}
            />
            {t("edit.current")}
          </label>
          <div className="mt-3 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                // 删除字段时一并清空起止时间：再次添加是干净的空白字段，而非上一次的旧值
                updateDate(sectionId, item.id, {
                  showDate: false,
                  startDate: "",
                  endDate: "",
                  current: false,
                });
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 size={14} />
              {t("edit.deleteDate")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 预览块：技能分组（分组名 + 换行分隔的技能列表） */
export function SkillGroupBlockView({
  group,
  sectionId,
  locale,
}: {
  group: SkillGroup;
  sectionId: string;
  locale: Locale;
}) {
  const { t } = useI18n();
  const updateName = useResumeStore((s) => s.updateGroupName);
  const updateItems = useResumeStore((s) => s.updateGroupItems);

  return (
    <div className="rs-skill-group">
      <EditableField
        ariaLabel={t("edit.groupNamePlaceholder")}
        html={localizedText(group.name, locale)}
        placeholder={t("edit.groupNamePlaceholder")}
        multiline={false}
        className="rs-skill-name"
        onChange={(v) => updateName(sectionId, group.id, locale, v)}
      />
      <div className="rs-skill-items">
        <EditableField
          ariaLabel={t("edit.skillItemPlaceholder")}
          html={localizedText(group.items, locale)}
          placeholder={t("edit.skillItemPlaceholder")}
          multiline
          onChange={(v) => updateItems(sectionId, group.id, locale, v)}
        />
      </div>
    </div>
  );
}

/** 左面板编辑器：条目列表（时间线型章节通用） */
export function ItemsEditor({ section, locale }: { section: ResumeSection; locale: Locale }) {
  const { t } = useI18n();
  const updateLocalized = useResumeStore((s) => s.updateItemLocalized);
  const updateDate = useResumeStore((s) => s.updateItemDate);
  const updateDesc = useResumeStore((s) => s.updateItemDesc);
  const removeItem = useResumeStore((s) => s.removeItem);
  const moveItem = useResumeStore((s) => s.moveItem);
  const items = section.items;
  // 示例只作占位提示：字段为空才显示，一输入即消失，永不写入简历数据
  const hints = sampleHints(section.kind, locale);
  const eg = t("sample.eg");
  const reorderItem = useResumeStore((s) => s.reorderItem);
  const drag = useDragReorder((from, to) => reorderItem(section.id, items[from].id, to));

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div
          key={it.id}
          className={cn(
            "rounded-lg bg-secondary/50 p-2",
            drag.isDragging(i) && "opacity-50",
            drag.isOver(i) && "ring-2 ring-primary/50",
          )}
          {...drag.rowProps(i)}
        >
          <div className="mb-1.5 flex items-center gap-1">
            <IconButton
              label={t("edit.drag")}
              size="sm"
              className="cursor-grab active:cursor-grabbing"
              {...drag.handleProps(i)}
            >
              <GripVertical size={14} />
            </IconButton>
            <IconButton
              label={t("edit.up")}
              size="sm"
              onClick={() => moveItem(section.id, it.id, -1)}
              disabled={i === 0}
            >
              <ArrowUp size={14} />
            </IconButton>
            <IconButton
              label={t("edit.down")}
              size="sm"
              onClick={() => moveItem(section.id, it.id, 1)}
              disabled={i === items.length - 1}
            >
              <ArrowDown size={14} />
            </IconButton>
            <div className="flex-1" />
            <IconButton
              label={t("edit.delete")}
              size="sm"
              onClick={() => removeItem(section.id, it.id)}
            >
              <Trash2 size={14} />
            </IconButton>
          </div>
          <div className="space-y-1.5">
            <LocalizedField
              className="h-8"
              placeholder={withSampleHint(t("edit.itemTitlePlaceholder"), hints.title, eg)}
              field={it.title}
              locale={locale}
              onChange={(v) => updateLocalized(section.id, it.id, "title", locale, v)}
            />
            <LocalizedField
              className="h-8"
              placeholder={withSampleHint(t("edit.itemSubtitlePlaceholder"), hints.subtitle, eg)}
              field={it.subtitle}
              locale={locale}
              onChange={(v) => updateLocalized(section.id, it.id, "subtitle", locale, v)}
            />
            <div className="flex items-center gap-2">
              <Input
                className="h-8"
                type="month"
                aria-label={t("edit.startDate")}
                value={it.startDate}
                onChange={(e) => updateDate(section.id, it.id, { startDate: e.target.value })}
              />
              <Input
                className="h-8"
                type="month"
                aria-label={t("edit.endDate")}
                value={it.endDate}
                disabled={it.current}
                onChange={(e) => updateDate(section.id, it.id, { endDate: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={it.current}
                onChange={(v) => updateDate(section.id, it.id, { current: v })}
              />
              {t("edit.current")}
            </label>
            <LocalizedField
              className="min-h-16 text-xs"
              placeholder={withSampleHint(t("edit.summaryPlaceholder"), hints.description, eg)}
              field={it.description}
              locale={locale}
              multiline
              toView={richTextToPlain}
              fromView={textToRichText}
              onChange={(v) => updateDesc(section.id, it.id, locale, v)}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          {t("edit.fillHint")}
          {/* 尚未添加条目时也要给出示例：否则用户面对空白章节无从下手 */}
          {hints.title
            ? ` ${eg}${hints.title}${hints.subtitle ? ` · ${hints.subtitle}` : ""}`
            : ""}
        </p>
      )}
    </div>
  );
}

/** 左面板编辑器：分组列表（技能型章节通用） */
export function GroupsEditor({ section, locale }: { section: ResumeSection; locale: Locale }) {
  const { t } = useI18n();
  const updateName = useResumeStore((s) => s.updateGroupName);
  const updateItems = useResumeStore((s) => s.updateGroupItems);
  const removeGroup = useResumeStore((s) => s.removeGroup);
  const moveGroup = useResumeStore((s) => s.moveGroup);
  const groups = section.groups;
  const reorderGroup = useResumeStore((s) => s.reorderGroup);
  const drag = useDragReorder((from, to) => reorderGroup(section.id, groups[from].id, to));
  // 同上：示例只是占位提示，不写入简历
  const hints = sampleHints(section.kind, locale);
  const eg = t("sample.eg");

  return (
    <div className="space-y-2">
      {groups.map((g, i) => (
        <div
          key={g.id}
          className={cn(
            "rounded-lg bg-secondary/50 p-2",
            drag.isDragging(i) && "opacity-50",
            drag.isOver(i) && "ring-2 ring-primary/50",
          )}
          {...drag.rowProps(i)}
        >
          <div className="mb-1.5 flex items-center gap-1">
            <IconButton
              label={t("edit.drag")}
              size="sm"
              className="cursor-grab active:cursor-grabbing"
              {...drag.handleProps(i)}
            >
              <GripVertical size={14} />
            </IconButton>
            <IconButton
              label={t("edit.up")}
              size="sm"
              onClick={() => moveGroup(section.id, g.id, -1)}
              disabled={i === 0}
            >
              <ArrowUp size={14} />
            </IconButton>
            <IconButton
              label={t("edit.down")}
              size="sm"
              onClick={() => moveGroup(section.id, g.id, 1)}
              disabled={i === groups.length - 1}
            >
              <ArrowDown size={14} />
            </IconButton>
            <div className="flex-1" />
            <IconButton
              label={t("edit.delete")}
              size="sm"
              onClick={() => removeGroup(section.id, g.id)}
            >
              <Trash2 size={14} />
            </IconButton>
          </div>
          <LocalizedField
            className="h-8"
            placeholder={withSampleHint(t("edit.groupNamePlaceholder"), hints.groupName, eg)}
            field={g.name}
            locale={locale}
            onChange={(v) => updateName(section.id, g.id, locale, v)}
          />
          <LocalizedField
            className="mt-1.5 min-h-14 text-xs"
            placeholder={withSampleHint(t("edit.skillItemPlaceholder"), hints.groupItems, eg)}
            field={g.items}
            locale={locale}
            multiline
            onChange={(v) => updateItems(section.id, g.id, locale, v)}
          />
        </div>
      ))}
      {groups.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          {t("edit.fillHint")}
          {hints.groupName ? ` ${eg}${hints.groupName}：${hints.groupItems ?? ""}` : ""}
        </p>
      )}
    </div>
  );
}

/** 条目型章节的完整编辑器：条目列表 + 底部「添加条目」 */
export function ItemsSectionEditor({
  section,
  locale,
}: {
  section: ResumeSection;
  locale: Locale;
}) {
  const { t } = useI18n();
  const addItem = useResumeStore((s) => s.addItem);
  return (
    <>
      <ItemsEditor section={section} locale={locale} />
      <Button
        variant="subtle"
        size="sm"
        className="mt-2 w-full"
        onClick={() => addItem(section.id)}
      >
        <Plus size={15} /> {t("edit.addItem")}
      </Button>
    </>
  );
}

/** 分组型章节的完整编辑器：分组列表 + 底部「添加分组」 */
export function GroupsSectionEditor({
  section,
  locale,
}: {
  section: ResumeSection;
  locale: Locale;
}) {
  const { t } = useI18n();
  const addGroup = useResumeStore((s) => s.addGroup);
  return (
    <>
      <GroupsEditor section={section} locale={locale} />
      <Button
        variant="subtle"
        size="sm"
        className="mt-2 w-full"
        onClick={() => addGroup(section.id)}
      >
        <Plus size={15} /> {t("edit.addGroup")}
      </Button>
    </>
  );
}
