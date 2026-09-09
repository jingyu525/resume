/**
 * 章节插件的预览渲染块：预览区即编辑器，文字可就地编辑。
 *
 * 放在插件层而非 features：章节插件要自带渲染与编辑能力，而插件不得反向依赖
 * features（否则 features → plugins → features 成环）。这些组件只依赖 shared 与 store。
 */
import { useRef, useState } from "react";
import { useI18n } from "@/shared/i18n";
import { localizedText } from "@/shared/lib/localized";
import { formatPeriod } from "@/shared/lib/format";
import type { Locale } from "@/entities/locale";
import type { ResumeItem, SkillGroup } from "@/entities/resume/model";
import type { SectionBlockEditors } from "@/plugins/core/types";
import { EditableField } from "@/shared/ui/editable-field";
import { useDismiss } from "@/shared/ui/use-dismiss";
import { DateRangeFields } from "./parts-fields";
import { Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** 预览块：经历条目（公司/项目/学校 + 职位 + 日期 + 富文本描述） */
export function ItemBlockView({
  item,
  sectionId,
  locale,
  hasHeader,
  editors,
}: {
  item: ResumeItem;
  sectionId: string;
  locale: Locale;
  hasHeader: boolean;
  editors?: SectionBlockEditors;
}) {
  const { t } = useI18n();
  // 未注入 editors（如落地页示例）即只读：绝不回落到直接读 store，
  // 否则示例简历会把内容写进用户的真实简历。
  const canEdit = !!editors;

  const showHeader = hasHeader || Boolean(localizedText(item.title, locale));

  return (
    <div className="rs-item">
      {showHeader && (
        <div className="rs-item-head">
          <div>
            <EditableField
              editable={canEdit}
              ariaLabel={t("edit.itemTitlePlaceholder")}
              html={localizedText(item.title, locale)}
              placeholder={t("edit.itemTitlePlaceholder")}
              multiline={false}
              className="rs-item-title"
              onChange={(v) => editors?.updateItemLocalized(sectionId, item.id, "title", locale, v)}
            />
            <EditableField
              editable={canEdit}
              ariaLabel={t("edit.itemSubtitlePlaceholder")}
              html={localizedText(item.subtitle, locale)}
              placeholder={t("edit.itemSubtitlePlaceholder")}
              multiline={false}
              className="rs-item-sub"
              onChange={(v) => editors?.updateItemLocalized(sectionId, item.id, "subtitle", locale, v)}
            />
          </div>
          <ItemDateEditor item={item} sectionId={sectionId} locale={locale} editors={editors} />
        </div>
      )}
      <div className="rs-desc">
        <EditableField
          editable={canEdit}
          ariaLabel={t("edit.summaryPlaceholder")}
          html={localizedText(item.description, locale)}
          placeholder={t("edit.summaryPlaceholder")}
          rich
          onChange={(v) => editors?.updateItemDesc(sectionId, item.id, locale, v)}
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
  editors,
}: {
  item: ResumeItem;
  sectionId: string;
  locale: Locale;
  editors?: SectionBlockEditors;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const showDate = item.showDate !== false;
  const date = formatPeriod(item.startDate, item.endDate, item.current, locale);

  useDismiss(ref, open, () => setOpen(false));

  // 只读（未注入 editors，如落地页示例）：有日期就当普通文本出片，没有就不占位
  if (!editors) {
    return date ? <div className="rs-item-date">{date}</div> : null;
  }

  // 字段已删除：仅编辑器内显示「添加日期」回复按钮（no-print，不上纸）
  if (!showDate) {
    return (
      <button
        type="button"
        onClick={() => editors.setItemShowDate(sectionId, item.id, true)}
        className="no-print rs-item-date cursor-pointer rounded px-1 text-muted-foreground italic hover:bg-foreground/5"
        aria-label={t("edit.addDate")}
        title={t("edit.addDate")}
      >
        {t("edit.addDate")}
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
          <DateRangeFields
            startDate={item.startDate}
            endDate={item.endDate}
            current={item.current}
            onChange={(patch) => editors.updateItemDate(sectionId, item.id, patch)}
          />
          <div className="mt-3 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                editors.setItemShowDate(sectionId, item.id, false);
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
  editors,
}: {
  group: SkillGroup;
  sectionId: string;
  locale: Locale;
  editors?: SectionBlockEditors;
}) {
  const { t } = useI18n();
  const canEdit = !!editors;

  return (
    <div className="rs-skill-group">
      <EditableField
        editable={canEdit}
        ariaLabel={t("edit.groupNamePlaceholder")}
        html={localizedText(group.name, locale)}
        placeholder={t("edit.groupNamePlaceholder")}
        multiline={false}
        className="rs-skill-name"
        onChange={(v) => editors?.updateGroupName(sectionId, group.id, locale, v)}
      />
      <div className="rs-skill-items">
        <EditableField
          editable={canEdit}
          ariaLabel={t("edit.skillItemPlaceholder")}
          html={localizedText(group.items, locale)}
          placeholder={t("edit.skillItemPlaceholder")}
          multiline
          onChange={(v) => editors?.updateGroupItems(sectionId, group.id, locale, v)}
        />
      </div>
    </div>
  );
}
