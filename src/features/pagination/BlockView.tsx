import type { Locale } from "@/entities/locale";
import { useResumeStore } from "@/store/useResumeStore";
import { localizedText } from "@/shared/lib/localized";
import { useI18n } from "@/shared/i18n";
import { itemDateLabel, type Block } from "./buildBlocks";
import { EditableField } from "@/features/inline-richtext/EditableField";

export function BlockView({ block, locale }: { block: Block; locale: Locale }) {
  switch (block.type) {
    case "basics":
      return <BasicsBlock locale={locale} />;
    case "section-head":
      return <SectionHeadBlock block={block} locale={locale} />;
    case "item":
      return <ItemBlock block={block} locale={locale} />;
    case "skill-group":
      return <SkillGroupBlock block={block} locale={locale} />;
    default:
      return null;
  }
}

function BasicsBlock({ locale }: { locale: Locale }) {
  const { t } = useI18n();
  const basics = useResumeStore((s) => s.resume.basics);
  const updateLocalized = useResumeStore((s) => s.updateBasicLocalized);
  const updatePlain = useResumeStore((s) => s.updateBasicPlain);

  const contacts = [
    basics.phone,
    basics.email,
    localizedText(basics.city, locale),
    basics.wechat,
    basics.website,
  ].filter(Boolean) as string[];

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
      {contacts.length > 0 && (
        <div className="rs-contact">
          {contacts.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      )}
      <div className="rs-contact rs-contact-edit">
        <EditableField
          ariaLabel={t("edit.phone")}
          html={basics.phone}
          placeholder={t("edit.phone")}
          multiline={false}
          className="rs-inline-plain"
          onChange={(v) => updatePlain("phone", v)}
        />
        <EditableField
          ariaLabel={t("edit.email")}
          html={basics.email}
          placeholder={t("edit.email")}
          multiline={false}
          onChange={(v) => updatePlain("email", v)}
        />
        <EditableField
          ariaLabel={t("edit.city")}
          html={localizedText(basics.city, locale)}
          placeholder={t("edit.city")}
          multiline={false}
          onChange={(v) => updateLocalized("city", locale, v)}
        />
        <EditableField
          ariaLabel={t("edit.wechat")}
          html={basics.wechat}
          placeholder={t("edit.wechat")}
          multiline={false}
          onChange={(v) => updatePlain("wechat", v)}
        />
        <EditableField
          ariaLabel={t("edit.website")}
          html={basics.website}
          placeholder={t("edit.website")}
          multiline={false}
          onChange={(v) => updatePlain("website", v)}
        />
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

function ItemBlock({ block, locale }: { block: Extract<Block, { type: "item" }>; locale: Locale }) {
  const { t } = useI18n();
  const item = block.item;
  const updateLocalized = useResumeStore((s) => s.updateItemLocalized);
  const updateDesc = useResumeStore((s) => s.updateItemDesc);

  const date = itemDateLabel(item, locale);
  const showHeader = block.hasHeader || Boolean(localizedText(item.title, locale));

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
              onChange={(v) => updateLocalized(block.sectionId, item.id, "title", locale, v)}
            />
            <EditableField
              ariaLabel={t("edit.itemSubtitlePlaceholder")}
              html={localizedText(item.subtitle, locale)}
              placeholder={t("edit.itemSubtitlePlaceholder")}
              multiline={false}
              className="rs-item-sub"
              onChange={(v) => updateLocalized(block.sectionId, item.id, "subtitle", locale, v)}
            />
          </div>
          {date && <div className="rs-item-date">{date}</div>}
        </div>
      )}
      <div className="rs-desc">
        <EditableField
          ariaLabel={t("edit.summaryPlaceholder")}
          html={localizedText(item.description, locale)}
          placeholder={t("edit.summaryPlaceholder")}
          rich
          onChange={(v) => updateDesc(block.sectionId, item.id, locale, v)}
        />
      </div>
    </div>
  );
}

function SkillGroupBlock({ block, locale }: { block: Extract<Block, { type: "skill-group" }>; locale: Locale }) {
  const { t } = useI18n();
  const group = block.group;
  const updateName = useResumeStore((s) => s.updateGroupName);
  const updateItems = useResumeStore((s) => s.updateGroupItems);

  const itemsText = localizedText(group.items, locale);

  return (
    <div className="rs-skill-group">
      <EditableField
        ariaLabel={t("edit.groupNamePlaceholder")}
        html={localizedText(group.name, locale)}
        placeholder={t("edit.groupNamePlaceholder")}
        multiline={false}
        className="rs-skill-name"
        onChange={(v) => updateName(block.sectionId, group.id, locale, v)}
      />
      <div className="rs-skill-items">
        <EditableField
          ariaLabel={t("edit.skillItemPlaceholder")}
          html={itemsText}
          placeholder={t("edit.skillItemPlaceholder")}
          multiline
          onChange={(v) => updateItems(block.sectionId, group.id, locale, v)}
        />
      </div>
    </div>
  );
}
