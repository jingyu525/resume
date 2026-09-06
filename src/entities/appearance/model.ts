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
}

export const DEFAULT_APPEARANCE: AppearancePref = {
  layout: "single",
  accent: "#2563EB",
  tone: "formal",
  density: 0.5,
};
