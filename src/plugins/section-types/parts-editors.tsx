/**
 * 章节插件的左面板编辑器：条目的增删改排序、标题与日期等以表单为主的操作。
 * （正文的就地编辑在预览区，见 parts-preview.tsx）
 *
 * 放在插件层而非 features：章节插件要自带渲染与编辑能力，而插件不得反向依赖
 * features（否则 features → plugins → features 成环）。这些组件只依赖 shared 与 store。
 */
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { richTextToPlain, textToRichText } from "@/shared/lib/sanitize";
import type { Locale } from "@/entities/locale";
import type { ResumeSection } from "@/entities/resume/model";
import { Button, IconButton } from "@/shared/ui/button";
import { useDragReorder } from "@/shared/ui/use-drag-reorder";
import { LocalizedField, DateRangeFields } from "./parts-fields";
import { sampleHints, withSampleHint } from "@/plugins/sample-hints";
import { ArrowDown, ArrowUp, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** 左面板编辑器：条目列表（时间线型章节通用） */
export function ItemsEditor({ section, locale }: { section: ResumeSection; locale: Locale }) {
  const { t } = useI18n();
  const updateLocalized = useResumeStore((s) => s.updateItemLocalized);
  const updateDate = useResumeStore((s) => s.updateItemDate);
  const setShowDate = useResumeStore((s) => s.setItemShowDate);
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
            {/*
              日期是可选字段：与预览区共用 setItemShowDate，
              字段被删除时给出恢复入口，避免「左面板能填、预览永不显示」。
            */}
            {it.showDate === false ? (
              <Button variant="subtle" size="sm" onClick={() => setShowDate(section.id, it.id, true)}>
                <Plus size={14} /> {t("edit.addDate")}
              </Button>
            ) : (
              <>
                <DateRangeFields
                  startDate={it.startDate}
                  endDate={it.endDate}
                  current={it.current}
                  onChange={(patch) => updateDate(section.id, it.id, patch)}
                />
                <Button variant="subtle" size="sm" onClick={() => setShowDate(section.id, it.id, false)}>
                  <Trash2 size={14} /> {t("edit.deleteDate")}
                </Button>
              </>
            )}
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
