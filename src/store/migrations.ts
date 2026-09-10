import type { AppearancePref } from "@/entities/appearance/model";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import type { ResumeData, ResumeSection, SectionKind } from "@/entities/resume/model";
import type { PersistedState } from "@/entities/resume/persist";
import { createEmptyResume } from "@/plugins/resume-template";
import { LOCALES, type Locale } from "@/entities/locale";
import { registeredLocales } from "@/plugins/core/registry";

/** v2：章节/条目新增 fields（插件扩展字段容器） */
export const STORAGE_VERSION = 2;

export type { PersistedState };

/**
 * 当前已知语言：优先取注册表（内置五语 + 已安装语言包）。
 *
 * 注册表尚未就绪时（如单元测试未 bootstrap）退化为内置清单——
 * 绝不能返回空集合，否则 sanitizeLocales 会把所有语言字段删光，等于静默丢数据。
 */
function knownLocales(): string[] {
  try {
    const registered = registeredLocales();
    if (registered.length > 0) return registered;
  } catch {
    // 注册表不可用：走兜底
  }
  return [...LOCALES];
}

/** 基础校验 + 向前兼容迁移（FR-9）：升级不丢数据、不报错 */
export function migrate(raw: unknown): PersistedState {
  const fallback: PersistedState = {
    version: STORAGE_VERSION,
    resume: createEmptyResume(),
    appearance: { ...DEFAULT_APPEARANCE },
  };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;

  // 剔除非法语言字段，保证数据干净（导入/恢复通用）
  sanitizeLocales(obj.resume);

  // 版本字段缺失或损坏 → 当作当前版本处理
  const version = typeof obj.version === "number" ? obj.version : STORAGE_VERSION;

  const resume = normalizeResume(obj.resume, fallback.resume);
  const appearance = normalizeAppearance(obj.appearance, fallback.appearance);

  // 版本迁移钩子：v1 → v2 补齐章节/条目的插件扩展字段（fields）
  switch (version) {
    case 1:
      upgradeV1ToV2(resume);
      break;
    default:
      break;
  }

  return { version: STORAGE_VERSION, resume, appearance };
}

function normalizeAppearance(
  a: unknown,
  fallback: AppearancePref,
): AppearancePref {
  if (!a || typeof a !== "object") return fallback;
  const o = a as Record<string, unknown>;
  return {
    layout: o.layout === "sidebar" ? "sidebar" : "single",
    accent: typeof o.accent === "string" ? o.accent : fallback.accent,
    tone: o.tone === "soft" || o.tone === "lively" ? o.tone : "formal",
    density:
      typeof o.density === "number"
        ? Math.min(1, Math.max(0, o.density))
        : fallback.density,
    // theme：旧备份无此字段时退化为默认 classic（M6 主题可插件安装，绝不因缺字段崩溃）
    theme: typeof o.theme === "string" && o.theme ? o.theme : fallback.theme,
    // mode：light/dark/system 三者之一，否则退化为默认 system（旧备份无该字段也安全）
    mode:
      o.mode === "light" || o.mode === "dark" || o.mode === "system"
        ? o.mode
        : fallback.mode,
  };
}

function normalizeResume(r: unknown, fallback: ResumeData): ResumeData {
  if (!r || typeof r !== "object") return fallback;
  const o = r as Record<string, unknown>;
  const basics = (o.basics ?? {}) as Record<string, unknown>;
  const sectionsRaw = Array.isArray(o.sections) ? (o.sections as unknown[]) : [];

  const sections: ResumeSection[] = sectionsRaw
    .map((s, i) => normalizeSection(s, i))
    .filter((s): s is ResumeSection => s !== null);

  return {
    basics: {
      name: (basics.name as Record<Locale, string>) ?? {},
      title: (basics.title as Record<Locale, string>) ?? {},
      phone: typeof basics.phone === "string" ? basics.phone : "",
      email: typeof basics.email === "string" ? basics.email : "",
      city: (basics.city as Record<Locale, string>) ?? {},
      wechat: typeof basics.wechat === "string" ? basics.wechat : "",
      website: typeof basics.website === "string" ? basics.website : "",
    },
    sections: sections.length ? sections : fallback.sections,
  };
}

function normalizeSection(s: unknown, index: number): ResumeSection | null {
  if (!s || typeof s !== "object") return null;
  const o = s as Record<string, unknown>;
  // 关键：未知 kind 不再丢弃整节。插件章节与内置章节共存，
  // 若按白名单 return null，用户未安装插件时其章节会被静默删除（FR-9 升级不丢数据）。
  // 未注册的 kind 保留原值，渲染时由 buildBlocks 跳过、编辑区提示"缺少插件"。
  const kind = typeof o.kind === "string" && o.kind ? (o.kind as SectionKind) : null;
  if (!kind) return null;
  const items = Array.isArray(o.items) ? (o.items as unknown[]) : [];
  const groups = Array.isArray(o.groups) ? (o.groups as unknown[]) : [];
  return {
    id: typeof o.id === "string" ? o.id : `sec_${index}`,
    kind,
    title: (o.title as Record<Locale, string>) ?? {},
    visible: o.visible !== false,
    order: typeof o.order === "number" ? o.order : index,
    // 保留插件扩展字段：v2 数据不可在归一化中丢失（FR-9 升级不丢数据）
    fields: (o.fields as Record<string, unknown>) ?? {},
    items: items.map((it, i) => normalizeItem(it, i)).filter(Boolean) as never,
    groups: groups.map((g, i) => normalizeGroup(g, i)).filter(Boolean) as never,
  };
}

function normalizeItem(it: unknown, index: number): Record<string, unknown> | null {
  if (!it || typeof it !== "object") return null;
  const o = it as Record<string, unknown>;
  return {
    ...o, // 保留插件扩展字段，未安装插件时数据不丢
    id: typeof o.id === "string" ? o.id : `it_${index}`,
    title: (o.title as Record<Locale, string>) ?? {},
    subtitle: (o.subtitle as Record<Locale, string>) ?? {},
    startDate: typeof o.startDate === "string" ? o.startDate : "",
    endDate: typeof o.endDate === "string" ? o.endDate : "",
    current: o.current === true,
    description: (o.description as Record<Locale, string>) ?? {},
    fields: (o.fields as Record<string, unknown>) ?? {},
  };
}

function normalizeGroup(g: unknown, index: number): Record<string, unknown> | null {
  if (!g || typeof g !== "object") return null;
  const o = g as Record<string, unknown>;
  return {
    ...o, // 同上：保留扩展字段
    id: typeof o.id === "string" ? o.id : `grp_${index}`,
    name: (o.name as Record<Locale, string>) ?? {},
    items: (o.items as Record<Locale, string>) ?? {},
  };
}

/** v1 → v2：补齐插件扩展字段容器（fields），旧数据无此字段也能正常工作 */
function upgradeV1ToV2(resume: ResumeData): void {
  for (const section of resume.sections) {
    if (!section.fields) section.fields = {};
  }
}

/** 校验导入备份文件结构（FR-9） */
export function validateBackup(raw: unknown): raw is PersistedState {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  if (!o.resume || typeof o.resume !== "object") return false;
  const r = o.resume as Record<string, unknown>;
  if (!r.basics || !Array.isArray(r.sections)) return false;
  // locale 字段若含非法语言则剔除
  sanitizeLocales(o.resume);
  return true;
}

function sanitizeLocales(resume: unknown) {
  const r = resume as { basics?: Record<string, unknown>; sections?: unknown[] };
  // 按"已注册语言"过滤：固定 LOCALES 会把新装语言包写入的内容删掉（M3 必须用注册表）
  const known = knownLocales();
  // 以下字段均以「语言」为键（Localized）：逐键剔除未注册语言
  const scrubLocale = (rec: Record<string, unknown> | undefined) => {
    if (!rec || typeof rec !== "object") return;
    for (const l of Object.keys(rec)) {
      if (!known.includes(l)) delete rec[l];
    }
  };
  if (r.basics && typeof r.basics === "object") {
    const b = r.basics as Record<string, unknown>;
    scrubLocale(b.name as Record<string, unknown>);
    scrubLocale(b.title as Record<string, unknown>);
    scrubLocale(b.city as Record<string, unknown>);
  }
  (r.sections ?? []).forEach((sec) => {
    if (!sec || typeof sec !== "object") return;
    const s = sec as Record<string, unknown>;
    scrubLocale(s.title as Record<string, unknown>);
    (Array.isArray(s.items) ? s.items : []).forEach((it) => {
      if (!it || typeof it !== "object") return;
      const i = it as Record<string, unknown>;
      scrubLocale(i.title as Record<string, unknown>);
      scrubLocale(i.subtitle as Record<string, unknown>);
      scrubLocale(i.description as Record<string, unknown>);
    });
    (Array.isArray(s.groups) ? s.groups : []).forEach((g) => {
      if (!g || typeof g !== "object") return;
      const gr = g as Record<string, unknown>;
      scrubLocale(gr.name as Record<string, unknown>);
      scrubLocale(gr.items as Record<string, unknown>);
    });
  });
}
