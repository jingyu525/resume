import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Locale } from "@/entities/locale";
import { BUILTIN_LOCALES } from "@/entities/locale";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import {
  clearRegistry,
  getActiveStorage,
  getDefaultExporter,
  getSectionType,
  getTheme,
  listBasicsFields,
  listExporters,
  listLocalePacks,
  listPlugins,
  listSectionTypes,
  listThemes,
  register,
  registeredLocales,
  registeredSectionKinds,
} from "@/plugins/core/registry";
import { resetEnabledCache, setEnabled } from "@/plugins/core/enabled";
import type { ExporterPlugin } from "@/plugins/core/types";

/** 内置插件是 M1 的等价改造基线：这些断言锁住"改造后能力不缺失"。 */
describe("内置插件注册", () => {
  beforeAll(() => {
    bootstrapPlugins();
  });

  afterEach(() => {
    // 插件开关是视图态，测试后恢复默认，避免污染其它用例
    resetEnabledCache();
    setEnabled("basics-wechat", true);
  });

  it("注册了五语语言包（含默认禁用的示范 fr 包）、五个联系方式字段、默认导出与本地存储", () => {
    // 注册顺序即呈现顺序（不按 id 排序），因此与 bootstrap 里的次序一致
    const codes = listLocalePacks().map((p) => p.code);
    expect(codes).toContain("fr"); // 示范语言包已注册，证明「语言可插件安装」
    expect(codes.filter((c) => (BUILTIN_LOCALES as string[]).includes(c)).sort()).toEqual(
      [...BUILTIN_LOCALES].sort(),
    );
    expect(listBasicsFields().map((f) => f.fieldKey)).toEqual([
      "phone",
      "email",
      "city",
      "wechat",
      "website",
    ]);
    expect(getDefaultExporter()?.id).toBe("pdf-print");
    expect(getActiveStorage()?.id).toBe("storage-local");
  });

  it("registeredLocales 供迁移过滤未知语言用（含已注册的插件语言）", () => {
    expect(registeredLocales()).toContain("fr");
    expect(registeredLocales().filter((l) => (BUILTIN_LOCALES as string[]).includes(l)).sort()).toEqual(
      [...BUILTIN_LOCALES].sort(),
    );
  });

  it("章节类型插件按注册顺序暴露，该顺序即「添加章节」菜单顺序（空白简历固定为内置 5 类）", () => {
    expect(listSectionTypes().map((p) => p.sectionKind)).toEqual([
      "summary",
      "experience",
      "project",
      "education",
      "skills",
    ]);
    // 供 migrate 判断"未知 kind"：必须与上面的顺序一致
    expect(registeredSectionKinds()).toEqual([
      "summary",
      "experience",
      "project",
      "education",
      "skills",
    ]);
  });

  it("getSectionType 按 sectionKind 查插件，未知 kind 返回 undefined", () => {
    expect(getSectionType("skills")?.id).toBe("section-skills");
    expect(getSectionType("summary")?.placement).toBe("sidebar");
    expect(getSectionType("experience")?.placement).toBe("main");
    expect(getSectionType("not-installed")).toBeUndefined();
  });

  it("章节插件的 defaultTitle 五语齐全（规则 C4 的运行时兜底）", () => {
    const locales: Locale[] = ["zh", "en", "ja", "de", "ko"];
    for (const plugin of listSectionTypes()) {
      for (const loc of locales) {
        expect(plugin.defaultTitle[loc], `${plugin.id} 缺 ${loc}`).toBeTruthy();
      }
    }
  });

  it("默认导出唯一（规则 C7），且注册表含示范 Markdown 导出器（M4 导出器可插拔）", () => {
    const defaults = listExporters().filter((p) => p.default);
    expect(defaults.length).toBe(1);
    expect(defaults[0].id).toBe("pdf-print");
    expect(listExporters().map((p) => p.id)).toContain("markdown");
  });

  it("主题经注册表提供（M6 主题可插件安装），cssVars 均为 --rs- 前缀（规则 C9）", () => {
    const themes = listThemes();
    expect(themes.map((p) => p.id)).toEqual(
      expect.arrayContaining(["classic", "modern", "editorial", "minimal", "academic"]),
    );
    expect(getTheme("classic")?.cssVars["--rs-section-rule"]).toBeTruthy();
    for (const th of themes) {
      for (const key of Object.keys(th.cssVars)) {
        expect(key.startsWith("--rs-"), `${th.id} 的 ${key} 未加 --rs- 前缀`).toBe(true);
      }
    }
    // 未安装/已禁用的主题降级为 undefined，调用方不应崩溃
    expect(getTheme("not-installed")).toBeUndefined();
  });

  it("未注册的章节类型返回 undefined，而不是抛错", () => {
    expect(getSectionType("not-installed")).toBeUndefined();
  });

  it("重复注册同一 kind+id 会抛错（避免静默覆盖）", () => {
    const duplicate: ExporterPlugin = {
      id: "pdf-print",
      kind: "exporter",
      labelKey: "editor.print",
      version: 1,
      run: () => {},
    };
    expect(() => register(duplicate)).toThrow(/重复注册/);
  });

  it("禁用插件后不再出现在列表里（视图态，不进撤销历史）", () => {
    setEnabled("basics-wechat", false);
    expect(listBasicsFields().map((f) => f.fieldKey)).not.toContain("wechat");
    setEnabled("basics-wechat", true);
    expect(listBasicsFields().map((f) => f.fieldKey)).toContain("wechat");
  });

  it("清空注册表后列表为空（仅供测试用）", () => {
    const total = listPlugins().length;
    expect(total).toBeGreaterThan(0);
    clearRegistry();
    try {
      expect(listPlugins()).toEqual([]);
    } finally {
      bootstrapPlugins();
    }
  });
});
