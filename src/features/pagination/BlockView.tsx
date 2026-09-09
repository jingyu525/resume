import type { Locale } from "@/entities/locale";
import type { ResumeData } from "@/entities/resume/model";
import { localizedText } from "@/shared/lib/localized";
import { readBasicField } from "@/shared/lib/basics";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { listBasicsFields, getSectionType } from "@/plugins/core/registry";
import type { SectionBlockEditors } from "@/plugins/core/types";
import type { Block } from "./buildBlocks";
import { EditableField } from "@/shared/ui/editable-field";

/** 基本信息里多语言字段的键（与 store 的 LocalizedField 对齐） */
type BasicLocalizedField = "name" | "title" | "city";
/** 基本信息里纯文本字段的键（与 store 的 PlainField 对齐） */
type BasicPlainField = "phone" | "email" | "wechat" | "website";

/**
 * 编辑回调：由调用方注入（编辑器传 store 的 action；落地页不传即只读）。
 * 把「写回」从组件里剥离，让 BlockView 只依赖传入的 resume 数据，
 * 既能在编辑器里就地编辑（预览即编辑器），又能在落地页安全展示示例而不碰全局 store。
 */
export interface BlockEditors extends SectionBlockEditors {
  updateBasicLocalized: (field: BasicLocalizedField, locale: Locale, value: string) => void;
  updateBasicPlain: (field: BasicPlainField, value: string) => void;
  renameSection: (id: string, locale: Locale, value: string) => void;
}

export function BlockView({
  block,
  locale,
  resume,
  editors,
}: {
  block: Block;
  locale: Locale;
  resume: ResumeData;
  editors?: BlockEditors;
}) {
  switch (block.type) {
    case "basics":
      return <BasicsBlock resume={resume} locale={locale} editors={editors} />;
    case "section-head":
      return <SectionHeadBlock block={block} resume={resume} locale={locale} editors={editors} />;
    case "item":
    case "skill-group": {
      // 渲染器由产出该块的章节类型插件提供；缺插件时返回 null（数据由 migrate 保留，不渲染以免错版）
      // editors 透传给插件：编辑器注入后即可就地编辑，落地页不传则只读
      const plugin = block.sectionKind ? getSectionType(block.sectionKind) : undefined;
      return plugin ? plugin.renderBlock(block, locale, editors) : null;
    }
    default:
      return null;
  }
}

function BasicsBlock({
  resume,
  locale,
  editors,
}: {
  resume: ResumeData;
  locale: Locale;
  editors?: BlockEditors;
}) {
  const { t } = useI18n();
  const basics = resume.basics;
  const canEdit = !!editors;
  // 联系方式字段由插件提供：地域差异（中国微信 / 欧美 LinkedIn）靠替换插件解决，而非改数据模型
  const fields = listBasicsFields();

  return (
    <div className="rs-basics">
      <EditableField
        editable={canEdit}
        ariaLabel={t("edit.name")}
        html={localizedText(basics.name, locale)}
        placeholder={t("edit.name")}
        multiline={false}
        className="rs-name"
        onChange={(v) => editors?.updateBasicLocalized("name", locale, v)}
      />
      <EditableField
        editable={canEdit}
        ariaLabel={t("edit.jobTitle")}
        html={localizedText(basics.title, locale)}
        placeholder={t("edit.jobTitle")}
        multiline={false}
        className="rs-jobtitle"
        onChange={(v) => editors?.updateBasicLocalized("title", locale, v)}
      />
      {/*
        联系方式只有这一行：它是可编辑的（预览区即编辑器）。
        空字段不渲染、不占位——用户删除了某个联系方式，版面就应干净地去掉它；
        重新填写即「再添加」。打印时 .rs-empty 仍兜底，避免任何残留占位文字上纸。
        只读场景（落地页示例）不传 editors，字段同样按真实数据渲染、但不可编辑。
      */}
      <div className="rs-contact rs-contact-edit">
        {fields
          .filter((field) => readBasicField(basics, field, locale).trim() !== "")
          .map((field) => {
            const value = readBasicField(basics, field, locale);
            return (
              <EditableField
                key={field.id}
                editable={canEdit}
                ariaLabel={t(field.labelKey)}
                html={value}
                placeholder={t(field.labelKey)}
                multiline={false}
                className={cn(field.fieldKey === "phone" && "rs-inline-plain")}
                onChange={(v) =>
                  field.localized
                    ? editors?.updateBasicLocalized(field.fieldKey as BasicLocalizedField, locale, v)
                    : editors?.updateBasicPlain(field.fieldKey as BasicPlainField, v)
                }
              />
            );
          })}
      </div>
    </div>
  );
}

function SectionHeadBlock({
  block,
  resume,
  locale,
  editors,
}: {
  block: Extract<Block, { type: "section-head" }>;
  resume: ResumeData;
  locale: Locale;
  editors?: BlockEditors;
}) {
  const { t } = useI18n();
  const canEdit = !!editors;
  // 标题随传入的 resume 走（不再读全局 store）：编辑器与落地页示例一致命中，
  // 落地页不会因 sectionId 在真实 store 里找不到而归空
  const title = resume.sections.find((x) => x.id === block.sectionId)?.title;
  return (
    <div className="rs-section-title">
      <EditableField
        editable={canEdit}
        ariaLabel={t("edit.rename")}
        html={localizedText(title, locale)}
        placeholder={t("edit.rename")}
        multiline={false}
        onChange={(v) => editors?.renameSection(block.sectionId, locale, v)}
      />
    </div>
  );
}

// 条目块与技能分组块的渲染已迁到章节类型插件（plugins/section-types/*），
// 由各自插件的 renderBlock 提供，本文件不再按块类型写死渲染逻辑。
