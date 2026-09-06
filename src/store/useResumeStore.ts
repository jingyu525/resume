import { create } from "zustand";
import { useStore } from "zustand";
import { temporal } from "zundo";
import type { TemporalState } from "zundo";
import type { Locale } from "@/entities/locale";
import { DEFAULT_LOCALE } from "@/entities/locale";
import type { AppearancePref } from "@/entities/appearance/model";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import type {
  ResumeData,
  ResumeItem,
  ResumeSection,
  SectionKind,
} from "@/entities/resume/model";
import { createEmptyResume, createSampleResume } from "@/entities/resume/defaults";
import { newId } from "@/shared/lib/id";
import { loadPersisted } from "./persistence";

type LocalizedField = "name" | "title" | "city";
type PlainField = "phone" | "email" | "wechat" | "website";

interface ResumeState {
  resume: ResumeData;
  appearance: AppearancePref;
  locale: Locale;

  setLocale: (locale: Locale) => void;

  updateBasicLocalized: (field: LocalizedField, locale: Locale, value: string) => void;
  updateBasicPlain: (field: PlainField, value: string) => void;

  addSection: (kind: SectionKind) => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, dir: -1 | 1) => void;
  toggleSection: (id: string) => void;
  renameSection: (id: string, locale: Locale, value: string) => void;

  addItem: (sectionId: string) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  moveItem: (sectionId: string, itemId: string, dir: -1 | 1) => void;
  updateItemLocalized: (
    sectionId: string,
    itemId: string,
    field: "title" | "subtitle",
    locale: Locale,
    value: string,
  ) => void;
  updateItemDate: (
    sectionId: string,
    itemId: string,
    patch: { startDate?: string; endDate?: string; current?: boolean },
  ) => void;
  updateItemDesc: (
    sectionId: string,
    itemId: string,
    locale: Locale,
    html: string,
  ) => void;

  addGroup: (sectionId: string) => void;
  removeGroup: (sectionId: string, groupId: string) => void;
  moveGroup: (sectionId: string, groupId: string, dir: -1 | 1) => void;
  updateGroupName: (sectionId: string, groupId: string, locale: Locale, value: string) => void;
  updateGroupItems: (
    sectionId: string,
    groupId: string,
    locale: Locale,
    value: string,
  ) => void;

  setAppearance: (patch: Partial<AppearancePref>) => void;
  resetAppearance: () => void;

  fillSample: () => void;
  clearAll: () => void;

  loadState: (resume: ResumeData, appearance: AppearancePref) => void;
}

function emptyItem(): ResumeItem {
  return {
    id: newId("it"),
    title: {},
    subtitle: {},
    startDate: "",
    endDate: "",
    current: false,
    description: {},
  };
}

function mapSection(
  resume: ResumeData,
  sectionId: string,
  fn: (s: ResumeSection) => ResumeSection,
): ResumeData {
  return {
    ...resume,
    sections: resume.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
  };
}

const initial = loadPersisted();

export const useResumeStore = create<ResumeState>()(
  temporal(
    (set) => ({
      resume: initial?.resume ?? createEmptyResume(),
      appearance: initial?.appearance ?? { ...DEFAULT_APPEARANCE },
      locale: DEFAULT_LOCALE,

      setLocale: (locale) => set({ locale }),

      updateBasicLocalized: (field, locale, value) =>
        set((s) => ({
          resume: {
            ...s.resume,
            basics: {
              ...s.resume.basics,
              [field]: { ...s.resume.basics[field], [locale]: value },
            },
          },
        })),

      updateBasicPlain: (field, value) =>
        set((s) => ({
          resume: {
            ...s.resume,
            basics: { ...s.resume.basics, [field]: value },
          },
        })),

      addSection: (kind) =>
        set((s) => {
          const order = s.resume.sections.length;
          const section: ResumeSection = {
            id: newId("sec"),
            kind,
            title: { zh: defaultSectionTitle(kind, "zh"), en: defaultSectionTitle(kind, "en") },
            visible: true,
            order,
            items: [],
            groups: [],
          };
          return { resume: { ...s.resume, sections: [...s.resume.sections, section] } };
        }),

      removeSection: (id) =>
        set((s) => ({
          resume: { ...s.resume, sections: s.resume.sections.filter((x) => x.id !== id) },
        })),

      moveSection: (id, dir) =>
        set((s) => {
          const sorted = [...s.resume.sections].sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((x) => x.id === id);
          const swap = idx + dir;
          if (idx < 0 || swap < 0 || swap >= sorted.length) return s;
          [sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]];
          const reordered = sorted.map((sec, i) => ({ ...sec, order: i }));
          return { resume: { ...s.resume, sections: reordered } };
        }),

      toggleSection: (id) =>
        set((s) => ({
          resume: mapSection(s.resume, id, (sec) => ({ ...sec, visible: !sec.visible })),
        })),

      renameSection: (id, locale, value) =>
        set((s) => ({
          resume: mapSection(s.resume, id, (sec) => ({
            ...sec,
            title: { ...sec.title, [locale]: value },
          })),
        })),

      addItem: (sectionId) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            items: [...sec.items, emptyItem()],
          })),
        })),

      removeItem: (sectionId, itemId) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            items: sec.items.filter((x) => x.id !== itemId),
          })),
        })),

      moveItem: (sectionId, itemId, dir) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => {
            const items = [...sec.items];
            const idx = items.findIndex((x) => x.id === itemId);
            const swap = idx + dir;
            if (idx < 0 || swap < 0 || swap >= items.length) return sec;
            [items[idx], items[swap]] = [items[swap], items[idx]];
            return { ...sec, items };
          }),
        })),

      updateItemLocalized: (sectionId, itemId, field, locale, value) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            items: sec.items.map((it) =>
              it.id === itemId
                ? { ...it, [field]: { ...it[field], [locale]: value } }
                : it,
            ),
          })),
        })),

      updateItemDate: (sectionId, itemId, patch) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            items: sec.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
          })),
        })),

      updateItemDesc: (sectionId, itemId, locale, html) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            items: sec.items.map((it) =>
              it.id === itemId
                ? { ...it, description: { ...it.description, [locale]: html } }
                : it,
            ),
          })),
        })),

      addGroup: (sectionId) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            groups: [
              ...sec.groups,
              {
                id: newId("grp"),
                name: { zh: "新分组", en: "New group" },
                items: { zh: "", en: "" },
              },
            ],
          })),
        })),

      removeGroup: (sectionId, groupId) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            groups: sec.groups.filter((g) => g.id !== groupId),
          })),
        })),

      moveGroup: (sectionId, groupId, dir) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => {
            const groups = [...sec.groups];
            const idx = groups.findIndex((g) => g.id === groupId);
            const swap = idx + dir;
            if (idx < 0 || swap < 0 || swap >= groups.length) return sec;
            [groups[idx], groups[swap]] = [groups[swap], groups[idx]];
            return { ...sec, groups };
          }),
        })),

      updateGroupName: (sectionId, groupId, locale, value) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            groups: sec.groups.map((g) =>
              g.id === groupId ? { ...g, name: { ...g.name, [locale]: value } } : g,
            ),
          })),
        })),

      updateGroupItems: (sectionId, groupId, locale, value) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            groups: sec.groups.map((g) =>
              g.id === groupId ? { ...g, items: { ...g.items, [locale]: value } } : g,
            ),
          })),
        })),

      setAppearance: (patch) => set((s) => ({ appearance: { ...s.appearance, ...patch } })),
      resetAppearance: () => set({ appearance: { ...DEFAULT_APPEARANCE } }),

      fillSample: () => set({ resume: createSampleResume() }),
      clearAll: () => set({ resume: createEmptyResume() }),

      loadState: (resume, appearance) => set({ resume, appearance }),
    }),
    {
      // 撤销/重做仅跟踪内容与观感，界面语言不进历史（FR-10）
      partialize: (state) => ({ resume: state.resume, appearance: state.appearance }),
      // 仅当 resume/appearance 引用变化才入栈；界面语言等视图态不记录
      equality: (a, b) => a.resume === b.resume && a.appearance === b.appearance,
      limit: 100,
      // 连续同类微小变更（如连续打字）合并为一步：防抖 400ms 后入栈
      handleSet: (handleSet) => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        return (state) => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => handleSet(state), 400);
        };
      },
    },
  ),
);

function defaultSectionTitle(kind: SectionKind, locale: Locale): string {
  const map: Record<SectionKind, Record<Locale, string>> = {
    summary: { zh: "自我评价", en: "Summary", ja: "自己PR", de: "Profil", ko: "자기소개" },
    experience: { zh: "工作经历", en: "Experience", ja: "職歴", de: "Erfahrung", ko: "경력" },
    project: { zh: "项目经历", en: "Projects", ja: "プロジェクト", de: "Projekte", ko: "프로젝트" },
    education: { zh: "教育背景", en: "Education", ja: "学歴", de: "Ausbildung", ko: "학력" },
    skills: { zh: "专业技能", en: "Skills", ja: "スキル", de: "Kompetenzen", ko: "기술" },
  };
  return map[kind][locale];
}

/** 访问 zundo 时间旅行状态（撤销/重做），供 React 组件订阅 */
export function useTemporalStore<T>(
  selector: (state: TemporalState<{ resume: ResumeData; appearance: AppearancePref }>) => T,
): T {
  return useStore(useResumeStore.temporal, selector);
}
