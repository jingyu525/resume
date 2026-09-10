import { describe, it, expect } from "vitest";
import { migrate } from "@/store/migrations";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import type { ResumeData } from "@/entities/resume/model";

function baseResume(): ResumeData {
  return {
    basics: { name: {}, title: {}, phone: "", email: "", city: {}, wechat: "", website: "" },
    sections: [],
  };
}

describe("appearance.mode 明暗模式归一化（FR-1）", () => {
  it("显式 dark 保留", () => {
    const r = migrate({
      version: 2,
      resume: baseResume(),
      appearance: { ...DEFAULT_APPEARANCE, mode: "dark" },
    });
    expect(r.appearance.mode).toBe("dark");
  });

  it("显式 light 保留", () => {
    const r = migrate({
      version: 2,
      resume: baseResume(),
      appearance: { ...DEFAULT_APPEARANCE, mode: "light" },
    });
    expect(r.appearance.mode).toBe("light");
  });

  it("缺省退化为 system（保持跟随系统）", () => {
    const r = migrate({ version: 2, resume: baseResume(), appearance: { ...DEFAULT_APPEARANCE } });
    expect(r.appearance.mode).toBe("system");
  });

  it("旧备份缺 mode 字段退化为 system", () => {
    const oldAppearance = {
      layout: "single",
      accent: "#2563EB",
      tone: "formal",
      density: 0.5,
      theme: "classic",
    };
    const r = migrate({ version: 2, resume: baseResume(), appearance: oldAppearance });
    expect(r.appearance.mode).toBe("system");
  });

  it("非法值退化为 system", () => {
    const r = migrate({
      version: 2,
      resume: baseResume(),
      appearance: { ...DEFAULT_APPEARANCE, mode: "auto" },
    });
    expect(r.appearance.mode).toBe("system");
  });
});
