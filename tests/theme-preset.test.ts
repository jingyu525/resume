import { describe, it, expect } from "vitest";
import { applyThemePreset } from "@/shared/lib/themePreset";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import type { ThemePlugin } from "@/plugins/core/types";

const base = { ...DEFAULT_APPEARANCE };

describe("applyThemePreset", () => {
  it("套用主题预设的版式/主色/气质/疏密并写入 theme id", () => {
    const theme: ThemePlugin = {
      id: "modern",
      kind: "theme",
      labelKey: "theme.modern",
      version: 1,
      cssVars: { "--rs-section-rule": "2px solid var(--rs-accent)" },
      preset: { layout: "single", accent: "#0EA5E9", tone: "lively", density: 0.42 },
    };
    const next = applyThemePreset(base, theme);
    expect(next).toMatchObject({
      theme: "modern",
      layout: "single",
      accent: "#0EA5E9",
      tone: "lively",
      density: 0.42,
    });
  });

  it("未声明的预设字段保留原值（局部覆盖，不整组清空）", () => {
    const theme: ThemePlugin = {
      id: "editorial",
      kind: "theme",
      labelKey: "theme.editorial",
      version: 1,
      cssVars: {},
      preset: { layout: "sidebar" }, // 只声明版式
    };
    const next = applyThemePreset({ ...base, accent: "#123456" }, theme);
    expect(next.layout).toBe("sidebar");
    expect(next.accent).toBe("#123456"); // 保留
    expect(next.theme).toBe("editorial");
  });

  it("主题无 preset 时仍切换 theme id，其余不变", () => {
    const theme: ThemePlugin = {
      id: "classic",
      kind: "theme",
      labelKey: "theme.classic",
      version: 1,
      cssVars: {},
    };
    const next = applyThemePreset({ ...base, density: 0.3 }, theme);
    expect(next.theme).toBe("classic");
    expect(next.density).toBe(0.3);
  });

  it("theme 为 undefined（未知/禁用）时原样返回，调用方据此降级", () => {
    const next = applyThemePreset(base, undefined);
    expect(next).toBe(base);
  });
});
