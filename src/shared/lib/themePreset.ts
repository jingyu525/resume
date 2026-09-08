import type { AppearancePref, ThemePreset } from "@/entities/appearance/model";

/**
 * 主题风格预设合并（纯函数，可单测）。
 *
 * 选主题时把其 `preset`（版式/主色/气质/疏密）一键套用到当前外观，
 * 未声明字段保留原值。theme 为 undefined（未知/禁用）时原样返回，调用方据此降级。
 *
 * 只依赖 entities（外观模型），不依赖 plugins —— 保持 shared 不反向依赖插件层（规则 A1）。
 */
export function applyThemePreset(
  base: AppearancePref,
  theme: { id: string; preset?: ThemePreset } | undefined,
): AppearancePref {
  if (!theme) return base;
  const p = theme.preset ?? {};
  return {
    ...base,
    theme: theme.id,
    layout: p.layout ?? base.layout,
    accent: p.accent ?? base.accent,
    tone: p.tone ?? base.tone,
    density: p.density ?? base.density,
  };
}
