import type { AppearancePref } from "@/entities/appearance/model";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import type { ResumeData, ResumeSection, SectionKind } from "@/entities/resume/model";
import { createEmptyResume } from "@/entities/resume/defaults";
import { LOCALES, type Locale } from "@/entities/locale";

export const STORAGE_VERSION = 1;

export interface PersistedState {
  version: number;
  resume: ResumeData;
  appearance: AppearancePref;
}

const VALID_KINDS: SectionKind[] = [
  "summary",
  "experience",
  "project",
  "education",
  "skills",
];

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

  // 未来版本迁移钩子（示例）
  switch (version) {
    case 1:
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
  const kind = o.kind as SectionKind;
  if (!VALID_KINDS.includes(kind)) return null;
  const items = Array.isArray(o.items) ? (o.items as unknown[]) : [];
  const groups = Array.isArray(o.groups) ? (o.groups as unknown[]) : [];
  return {
    id: typeof o.id === "string" ? o.id : `sec_${index}`,
    kind,
    title: (o.title as Record<Locale, string>) ?? {},
    visible: o.visible !== false,
    order: typeof o.order === "number" ? o.order : index,
    items: items.map((it, i) => normalizeItem(it, i)).filter(Boolean) as never,
    groups: groups.map((g, i) => normalizeGroup(g, i)).filter(Boolean) as never,
  };
}

function normalizeItem(it: unknown, index: number): Record<string, unknown> | null {
  if (!it || typeof it !== "object") return null;
  const o = it as Record<string, unknown>;
  return {
    id: typeof o.id === "string" ? o.id : `it_${index}`,
    title: (o.title as Record<Locale, string>) ?? {},
    subtitle: (o.subtitle as Record<Locale, string>) ?? {},
    startDate: typeof o.startDate === "string" ? o.startDate : "",
    endDate: typeof o.endDate === "string" ? o.endDate : "",
    current: o.current === true,
    description: (o.description as Record<Locale, string>) ?? {},
  };
}

function normalizeGroup(g: unknown, index: number): Record<string, unknown> | null {
  if (!g || typeof g !== "object") return null;
  const o = g as Record<string, unknown>;
  return {
    id: typeof o.id === "string" ? o.id : `grp_${index}`,
    name: (o.name as Record<Locale, string>) ?? {},
    items: (o.items as Record<Locale, string>) ?? {},
  };
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
  const r = resume as { basics?: Record<string, Record<string, string>>; sections?: unknown[] };
  const scrub = (obj: Record<string, Record<string, string>> | undefined) => {
    if (!obj) return;
    for (const key of Object.keys(obj)) {
      const f = obj[key];
      if (f && typeof f === "object") {
        for (const l of Object.keys(f)) {
          if (!(LOCALES as string[]).includes(l)) delete f[l];
        }
      }
    }
  };
  scrub(r.basics);
  (r.sections ?? []).forEach((sec) => {
    const s = sec as Record<string, unknown>;
    scrub(s.title as Record<string, Record<string, string>>);
    (Array.isArray(s.items) ? s.items : []).forEach((it) => {
      const i = it as Record<string, unknown>;
      scrub(i.title as Record<string, Record<string, string>>);
      scrub(i.subtitle as Record<string, Record<string, string>>);
      scrub(i.description as Record<string, Record<string, string>>);
    });
    (Array.isArray(s.groups) ? s.groups : []).forEach((g) => {
      const gr = g as Record<string, unknown>;
      scrub(gr.name as Record<string, Record<string, string>>);
      scrub(gr.items as Record<string, Record<string, string>>);
    });
  });
}
