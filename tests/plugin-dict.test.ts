import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { buildDictionaries, getDictionaries, invalidateDictionaries } from "@/plugins/core/dict";
import { clearRegistry, register } from "@/plugins/core/registry";
import { resetEnabledCache, setEnabled } from "@/plugins/core/enabled";
import type { LocalePackPlugin } from "@/plugins/core/types";

describe("字典合并", () => {
  beforeAll(() => {
    bootstrapPlugins();
  });

  afterEach(() => {
    resetEnabledCache();
    setEnabled("dict-test-pack", true);
    setEnabled("dict-disabled-pack", true);
    setEnabled("fr-fallback-pack", true);
    invalidateDictionaries();
  });

  it("内置五语字典照常可用（M1 行为不变的基线）", () => {
    const dicts = getDictionaries();
    expect(dicts.zh["editor.print"]).toBe("打印 / 导出 PDF");
    expect(dicts.en["editor.print"]).toBe("Print / Export PDF");
    // 语言名按界面语言翻译，而不是固定写死原生名
    expect(dicts.zh["language.en"]).toBe("英语");
    expect(dicts.en["language.en"]).toBe("English");
  });

  it("语言包插件的 dict 会合并进对应语言", () => {
    const pack: LocalePackPlugin = {
      id: "dict-test-pack",
      kind: "locale-pack",
      labelKey: "language.zh",
      version: 1,
      code: "ja",
      label: "テスト",
      fallback: "en",
      dict: {
        ja: { "plugin.dict-test-pack.hello": "こんにちは" },
      },
    };
    register(pack);
    invalidateDictionaries();
    const dicts = buildDictionaries();
    expect(dicts.ja["plugin.dict-test-pack.hello"]).toBe("こんにちは");
    // 不能污染其它语言
    expect(dicts.zh["plugin.dict-test-pack.hello"]).toBeUndefined();
  });

  it("被禁用的插件，其 dict 不参与合并", () => {
    const pack: LocalePackPlugin = {
      id: "dict-disabled-pack",
      kind: "locale-pack",
      labelKey: "language.zh",
      version: 1,
      code: "de",
      label: "Test",
      dict: { de: { "plugin.dict-disabled-pack.hidden": "verborgen" } },
    };
    register(pack);
    setEnabled("dict-disabled-pack", false);
    invalidateDictionaries();
    expect(buildDictionaries().de["plugin.dict-disabled-pack.hidden"]).toBeUndefined();
  });

  it("getDictionaries 有缓存，invalidate 后重建", () => {
    const first = getDictionaries();
    expect(getDictionaries()).toBe(first);
    invalidateDictionaries();
    expect(getDictionaries()).not.toBe(first);
  });

  it("注册表为空时退化为纯核心字典，不崩溃", () => {
    clearRegistry();
    try {
      const dicts = buildDictionaries();
      expect(dicts.zh["editor.print"]).toBe("打印 / 导出 PDF");
    } finally {
      bootstrapPlugins();
      invalidateDictionaries();
    }
  });

  it("语言包未翻译的键走 fallback 回退链（M3：部分翻译的语言包也可用）", () => {
    const pack: LocalePackPlugin = {
      id: "fr-fallback-pack",
      kind: "locale-pack",
      labelKey: "language.fr",
      version: 1,
      code: "fr",
      label: "Français",
      fallback: "en",
      dict: {
        fr: { "more.clear": "Effacer", "edit.basic": "Profil" },
      },
    };
    register(pack);
    invalidateDictionaries();
    const dicts = buildDictionaries();
    // 已译键用本语言
    expect(dicts.fr["more.clear"]).toBe("Effacer");
    // 未译键不在 fr 字典里——运行时由 translate 回退到 fallback(en) 或 DEFAULT_LOCALE
    expect(dicts.fr["edit.summaryPlaceholder"]).toBeUndefined();
    expect(dicts.en["edit.summaryPlaceholder"]).toBeTruthy();
  });
});
