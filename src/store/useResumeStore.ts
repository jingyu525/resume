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
import { createEmptyResume, createRoleResume, type RoleId } from "@/plugins/resume-template";
import { getSectionType, getTheme } from "@/plugins/core/registry";
import { applyThemePreset } from "@/shared/lib/themePreset";
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
  /** 拖拽排序：直接落到指定位置（一次性重排，避免 ±1 连点产生多步撤销） */
  reorderSection: (id: string, toIndex: number) => void;
  toggleSection: (id: string) => void;
  renameSection: (id: string, locale: Locale, value: string) => void;

  addItem: (sectionId: string) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  moveItem: (sectionId: string, itemId: string, dir: -1 | 1) => void;
  /** 拖拽排序：条目直接落到指定位置 */
  reorderItem: (sectionId: string, itemId: string, toIndex: number) => void;
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
    patch: { startDate?: string; endDate?: string; current?: boolean; showDate?: boolean },
  ) => void;
  /**
   * 日期字段的显示开关。show=false（删除字段）时一并清空起止时间，
   * 保证再次添加得到干净空白字段、而不是上一次的旧值。
   * 这条不变量被预览弹层与左面板共用，故下沉到 store 而不是各写一遍。
   */
  setItemShowDate: (sectionId: string, itemId: string, show: boolean) => void;
  updateItemDesc: (
    sectionId: string,
    itemId: string,
    locale: Locale,
    html: string,
  ) => void;

  addGroup: (sectionId: string) => void;
  removeGroup: (sectionId: string, groupId: string) => void;
  moveGroup: (sectionId: string, groupId: string, dir: -1 | 1) => void;
  /** 拖拽排序：分组直接落到指定位置 */
  reorderGroup: (sectionId: string, groupId: string, toIndex: number) => void;
  updateGroupName: (sectionId: string, groupId: string, locale: Locale, value: string) => void;
  updateGroupItems: (
    sectionId: string,
    groupId: string,
    locale: Locale,
    value: string,
  ) => void;

  setAppearance: (patch: Partial<AppearancePref>) => void;
  resetAppearance: () => void;
  /** 选主题：一键套用其风格预设（版式/主色/气质/疏密），未声明项保留原值 */
  applyTheme: (themeId: string) => void;

  clearAll: () => void;
  applyTemplate: (role: RoleId) => void;

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

export const useResumeStore = create<ResumeState>()(
  temporal(
    (set) => ({
      resume: createEmptyResume(),
      appearance: { ...DEFAULT_APPEARANCE },
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
          // 默认标题取自章节类型插件（五语齐全）；插件缺失时留空由用户填写，绝不写死兜底文案
          const plugin = getSectionType(kind);
          const section: ResumeSection = {
            id: newId("sec"),
            kind,
            title: plugin ? { ...plugin.defaultTitle } : {},
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

      reorderSection: (id, toIndex) =>
        set((s) => {
          const sorted = [...s.resume.sections].sort((a, b) => a.order - b.order);
          const from = sorted.findIndex((x) => x.id === id);
          // 夹紧越界索引：宁可落到首尾，也不能丢数据
          const to = Math.max(0, Math.min(sorted.length - 1, toIndex));
          if (from < 0 || from === to) return s;
          const [moved] = sorted.splice(from, 1);
          sorted.splice(to, 0, moved);
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

      reorderItem: (sectionId, itemId, toIndex) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => {
            const items = [...sec.items];
            const from = items.findIndex((x) => x.id === itemId);
            const to = Math.max(0, Math.min(items.length - 1, toIndex));
            if (from < 0 || from === to) return sec;
            const [moved] = items.splice(from, 1);
            items.splice(to, 0, moved);
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

      setItemShowDate: (sectionId, itemId, show) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => ({
            ...sec,
            items: sec.items.map((it) =>
              it.id === itemId
                ? show
                  ? { ...it, showDate: true }
                  : { ...it, showDate: false, startDate: "", endDate: "", current: false }
                : it,
            ),
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

      reorderGroup: (sectionId, groupId, toIndex) =>
        set((s) => ({
          resume: mapSection(s.resume, sectionId, (sec) => {
            const groups = [...sec.groups];
            const from = groups.findIndex((g) => g.id === groupId);
            const to = Math.max(0, Math.min(groups.length - 1, toIndex));
            if (from < 0 || from === to) return sec;
            const [moved] = groups.splice(from, 1);
            groups.splice(to, 0, moved);
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

      applyTheme: (themeId) =>
        set((s) => ({ appearance: applyThemePreset(s.appearance, getTheme(themeId)) })),

      clearAll: () => set({ resume: createEmptyResume() }),

      applyTemplate: (role) => {
        // 应用岗位模板是一次性替换，不该进撤销历史（否则首次撤销会清掉刚应用的模板）
        const temporal = useResumeStore.temporal.getState();
        temporal.pause();
        useResumeStore.setState({ resume: createRoleResume(role) });
        temporal.resume();
      },

      loadState: (resume, appearance) => set({ resume, appearance }),
    }),
    {
      // 撤销/重做仅跟踪内容与观感，界面语言不进历史（FR-10）
      partialize: (state) => ({ resume: state.resume, appearance: state.appearance }),
      // 仅当 resume/appearance 引用变化才入栈；界面语言等视图态不记录
      equality: (a, b) => a.resume === b.resume && a.appearance === b.appearance,
      limit: 100,
      // 连续同类微小变更（如连续打字）合并为一步：防抖 400ms 后入栈。
      // 关键：合并窗口内只保留"第一次变更前的状态"作为快照，
      // 否则每次击键覆盖上次快照，撤销时会一个字符一个字符地回退（用户体验上等于没合并）。
      handleSet: (handleSet) => {
        type Snapshot = Parameters<typeof handleSet>[0];
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let first: Snapshot | null = null;
        return (state) => {
          if (first === null) first = state;
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            if (first !== null) handleSet(first);
            first = null;
            timeout = undefined;
          }, 400);
        };
      },
    },
  ),
);

// 默认章节标题表已删除：唯一真源是各章节类型插件的 defaultTitle（此前两份表 ja/de/ko 还不一致）

/**
 * 从本地存储恢复（FR-9）。**必须在 bootstrapPlugins() 之后调用**（见 app/bootstrap.ts）。
 *
 * 之所以不能放模块顶层：章节类型插件会 import 本模块（parts.tsx 要用 store action 渲染编辑器），
 * 而 `plugins/bootstrap.ts` 里 section 插件排在 storage 插件之前求值 —— 顶层读取时注册表是空的，
 * getActiveStorage() 返回 undefined，本地数据被静默丢弃，表现为"刷新后简历没了"。
 * 恢复改为显式调用后，时序由 main.tsx 保证，与插件注册顺序解耦。
 */
export function hydrateFromPersisted(): boolean {
  // 双保险：loadPersisted() 内部已兜底，这里防的是任何未预料的异常。
  // 本节一旦抛出，main.tsx 后续的 createRoot 不会执行，用户看到整页白屏。
  let persisted: ReturnType<typeof loadPersisted> = null;
  try {
    persisted = loadPersisted();
  } catch {
    persisted = null;
  }

  if (!persisted) {
    // 首次访问（本地无数据）：此时注册表已就绪，用正确的默认章节初始化。
    // 模块顶层的 `resume: createEmptyResume()` 会在 bootstrapPlugins() 之前求值
    // （章节插件经 parts.tsx 反向 import 本模块），注册表为空会生成 0 章节，
    // 表现为"首次进编辑页界面空白"。这里补种一次，覆盖该时序窗口。
    // 同样暂停时间旅行：首次默认简历不是一次编辑，不该进撤销历史。
    const temporal = useResumeStore.temporal.getState();
    temporal.pause();
    useResumeStore.setState({ resume: createEmptyResume() });
    temporal.resume();
    return false;
  }
  // 用 pause/resume 包住：恢复不是一次编辑，不该进撤销历史
  //（否则用户第一次按撤销就会把刚恢复的简历清空）
  const temporal = useResumeStore.temporal.getState();
  temporal.pause();
  useResumeStore.setState({ resume: persisted.resume, appearance: persisted.appearance });
  temporal.resume();
  return true;
}

/** 访问 zundo 时间旅行状态（撤销/重做），供 React 组件订阅 */
export function useTemporalStore<T>(
  selector: (state: TemporalState<{ resume: ResumeData; appearance: AppearancePref }>) => T,
): T {
  return useStore(useResumeStore.temporal, selector);
}

/**
 * 最后一道防线：章节结构不该为空。
 *
 * 结构由系统提供（各章节类型插件），为空说明它没给到——用户面对一片空白，
 * 且不知道该做什么。这里补种默认章节，让界面回到可用状态。
 *
 * 正常流程下不会触发（hydrate 与 migrate 都已保证结构非空），
 * 保留它是因为「空白」对用户是最无从判断的失败。
 *
 * @returns 是否发生了补种
 */
export function ensureStructure(): boolean {
  if (useResumeStore.getState().resume.sections.length > 0) return false;
  const temporal = useResumeStore.temporal.getState();
  temporal.pause();
  useResumeStore.setState({ resume: createEmptyResume() });
  temporal.resume();
  return true;
}
