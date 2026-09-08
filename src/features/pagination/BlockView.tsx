import type { Locale } from "@/entities/locale";
import { useResumeStore } from "@/store/useResumeStore";
import { localizedText } from "@/shared/lib/localized";
import { readBasicField } from "@/shared/lib/basics";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { listBasicsFields, getSectionType } from "@/plugins/core/registry";
import type { Block } from "./buildBlocks";
import { EditableField } from "@/shared/ui/editable-field";

/** 基本信息里多语言字段的键（与 store 的 LocalizedField 对齐） */
type BasicLocalizedField = "name" | "title" | "city";
/** 基本信息里纯文本字段的键（与 store 的 PlainField 对齐） */
type BasicPlainField = "phone" | "email" | "wechat" | "website";

export function BlockView({ block, locale }: { block: Block; locale: Locale }) {
  switch (block.type) {
    case "basics":
      return <BasicsBlock locale={locale} />;
    case "section-head":
      return <SectionHeadBlock block={block} locale={locale} />;
    case "item":
    case "skill-group": {
      // 渲染器由产出该块的章节类型插件提供；缺插件时返回 null（数据由 migrate 保留，不渲染以免错版）
      const plugin = block.sectionKind ? getSectionType(block.sectionKind) : undefined;
      return plugin ? plugin.renderBlock(block, locale) : null;
    }
    default:
      return null;
  }
}

function BasicsBlock({ locale }: { locale: Locale }) {
  const { t } = useI18n();
  const basics = useResumeStore((s) => s.resume.basics);
  const updateLocalized = useResumeStore((s) => s.updateBasicLocalized);
  const updatePlain = useResumeStore((s) => s.updateBasicPlain);

  // 联系方式字段由插件提供：地域差异（中国微信 / 欧美 LinkedIn）靠替换插件解决，而非改数据模型
  const fields = listBasicsFields();

  return (
    <div className="rs-basics">
      <EditableField
        ariaLabel={t("edit.name")}
        html={localizedText(basics.name, locale)}
        placeholder={t("edit.name")}
        multiline={false}
        className="rs-name"
        onChange={(v) => updateLocalized("name", locale, v)}
      />
      <EditableField
        ariaLabel={t("edit.jobTitle")}
        html={localizedText(basics.title, locale)}
        placeholder={t("edit.jobTitle")}
        multiline={false}
        className="rs-jobtitle"
        onChange={(v) => updateLocalized("title", locale, v)}
      />
      {/*
        联系方式只有这一行：它是可编辑的（预览区即编辑器）。
        空字段不渲染、不占位——用户删除了某个联系方式，版面就应干净地去掉它；
        重新填写即「再添加」。打印时 .rs-empty 仍兜底，避免任何残留占位文字上纸。
      */}
      <div className="rs-contact rs-contact-edit">
        {fields
          .filter((field) => readBasicField(basics, field, locale).trim() !== "")
          .map((field) => {
            const value = readBasicField(basics, field, locale);
            return (
              <EditableField
                key={field.id}
                ariaLabel={t(field.labelKey)}
                html={value}
                placeholder={t(field.labelKey)}
                multiline={false}
                className={cn(field.fieldKey === "phone" && "rs-inline-plain")}
                onChange={(v) =>
                  field.localized
                    ? updateLocalized(field.fieldKey as BasicLocalizedField, locale, v)
                    : updatePlain(field.fieldKey as BasicPlainField, v)
                }
              />
            );
          })}
      </div>
    </div>
  );
}

function SectionHeadBlock({ block, locale }: { block: Extract<Block, { type: "section-head" }>; locale: Locale }) {
  const { t } = useI18n();
  const renameSection = useResumeStore((s) => s.renameSection);
  const title = useResumeStore(
    (s) => s.resume.sections.find((x) => x.id === block.sectionId)?.title,
  );
  return (
    <div className="rs-section-title">
      <EditableField
        ariaLabel={t("edit.rename")}
        html={localizedText(title, locale)}
        placeholder={t("edit.rename")}
        multiline={false}
        onChange={(v) => renameSection(block.sectionId, locale, v)}
      />
    </div>
  );
}

// 条目块与技能分组块的渲染已迁到章节类型插件（plugins/section-types/*），
// 由各自插件的 renderBlock 提供，本文件不再按块类型写死渲染逻辑。
