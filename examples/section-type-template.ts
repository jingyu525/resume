/**
 * 章节类型插件模板（复制即用）。
 *
 * 用法：复制到 src/plugins/section-types/<your-kind>.ts，改 id / sectionKind /
 * defaultTitle / fields / placement / 渲染与编辑实现，再到 bootstrap.ts 注册即可。
 * 不在此目录、不注册就不会被扫描，可作为学习样例保留。
 */
import type { SectionTypePlugin } from "@/plugins/core/types";
import type { ResumeData, ResumeItem, ResumeSection } from "@/entities/resume/model";
import { localizedText } from "@/shared/lib/localized";

export const certificatesSection: SectionTypePlugin = {
  id: "certificates",
  kind: "section-type",
  labelKey: "sec.certificates",
  version: 1,
  sectionKind: "certificates",
  defaultTitle: { zh: "证书", en: "Certificates", ja: "資格", de: "Zertifikate", ko: "자격증" },
  // 字段映射到内置 BasicInfo/简历条目结构；扩展字段走 fields 容器（M2 升级补的扩展容器）
  fields: [
    { key: "title", type: "text", labelKey: "edit.itemTitle", builtin: "title", localized: true },
    { key: "subtitle", type: "text", labelKey: "edit.itemSubtitle", builtin: "subtitle", localized: true },
    { key: "issuer", type: "text", labelKey: "edit.issuer", localized: true },
  ],
  placement: "main",
  toBlocks(section, ctx) {
    if (ctx.layout === "sidebar" && this.placement === "sidebar") {
      /* 侧栏版式下的归属由 placement 决定，buildBlocks 据此分流 */
    }
    return [
      { id: `${section.id}-head`, type: "section-head", title: localizedText(section.title, ctx.locale), sectionKind: this.sectionKind },
      ...section.items.map((it: ResumeItem) => ({
        id: it.id,
        type: "item" as const,
        sectionKind: this.sectionKind,
        title: localizedText(it.title, ctx.locale),
        subtitle: localizedText(it.subtitle, ctx.locale),
        startDate: it.startDate,
        endDate: it.current ? "" : it.endDate,
        description: localizedText(it.description, ctx.locale),
      })),
    ];
  },
  renderBlock(block, locale, _editors) {
    if (block.type === "section-head") return localizedText({ [locale]: block.title } as never, locale);
    return [block.title, block.subtitle].filter(Boolean).join(" · ");
  },
  renderEditor({ section, locale, t }) {
    return localizedText(section.title, locale) || t("sec.certificates");
  },
  createItem(): ResumeItem {
    return { id: `it_${Date.now()}`, title: {}, subtitle: {}, startDate: "", endDate: "", current: false, description: {} };
  },
  createSample(): ResumeSection {
    return {
      id: "sec_cert_sample",
      kind: "certificates",
      title: { zh: "证书" },
      visible: true,
      order: 90,
      items: [this.createItem()],
      groups: [],
    };
  },
};

// 仅作类型校验占位，避免未使用导入告警
export type _Sample = ResumeData;
