export type Layout = "single" | "sidebar";

export type Tone = "formal" | "soft" | "lively";

export interface AppearancePref {
  /** 版式：单栏 / 侧栏双栏 */
  layout: Layout;
  /** 主色（hex） */
  accent: string;
  /** 气质档位 */
  tone: Tone;
  /** 疏密：0（紧凑）~ 1（舒展） */
  density: number;
  /** 主题：注册表里的 ThemePlugin id（M6 起可插件安装，默认 classic） */
  theme: string;
}

/** 主题级风格预设：选主题时一键套用的完整外观基线（FR-5 风格优先）。 */
export interface ThemePreset {
  layout?: Layout;
  accent?: string;
  tone?: Tone;
  density?: number;
}

export const DEFAULT_APPEARANCE: AppearancePref = {
  layout: "single",
  accent: "#2563EB",
  tone: "formal",
  density: 0.5,
  theme: "classic",
};
