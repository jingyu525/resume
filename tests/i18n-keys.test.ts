import { describe, it, expect } from "vitest";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { LAYOUTS, TONES } from "@/shared/config/presets";

function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flatten(v as Record<string, unknown>, key));
    } else {
      out.push(key);
    }
  }
  return out;
}

describe("i18n key 完整性（FR-6）", () => {
  const defined = new Set<string>();
  for (const loc of Object.keys(dictionaries)) {
    for (const k of flatten(dictionaries[loc as keyof typeof dictionaries] as unknown as Record<string, unknown>)) {
      defined.add(k);
    }
  }

  it("presets 的 labelKey 必须存在于字典（捕获经变量传入 t() 的缺失 key）", () => {
    for (const l of LAYOUTS) {
      expect(defined.has(l.labelKey), `layout ${l.value} -> ${l.labelKey}`).toBe(true);
    }
    for (const t of TONES) {
      expect(defined.has(t.labelKey), `tone ${t.value} -> ${t.labelKey}`).toBe(true);
    }
  });

  it("五语字典 key 集合完全一致", () => {
    const entries = Object.entries(dictionaries).map(
      ([loc, d]) => [loc, new Set(flatten(d as unknown as Record<string, unknown>))] as const,
    );
    const [baseLoc, baseSet] = entries[0];
    for (const [loc, set] of entries) {
      const missing = [...baseSet].filter((k) => !set.has(k));
      const extra = [...set].filter((k) => !baseSet.has(k));
      expect(missing, `语言 ${loc} 相对 ${baseLoc} 缺失`).toEqual([]);
      expect(extra, `语言 ${loc} 相对 ${baseLoc} 多余`).toEqual([]);
    }
  });
});
