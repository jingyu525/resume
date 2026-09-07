/**
 * 规则自检（M0 的验收基线）。
 *
 * 为什么用 .mjs 而不是 .ts：规则脚本是 .mjs，tsc 在 strict 下要求它提供类型声明；
 * 校验规则属于构建工具链，不值得为此手写 .d.mts。vitest 直接跑 .mjs，零类型负担。
 *
 * 自检的意义：规则是"看不见的守护"，一旦写错（正则失效、范围过大导致永远零命中）
 * 不会有任何报错，只会静默放行违规。因此每条规则都要验证两件事：
 *   1) 违规 fixture 抓得到（防止假阴性）
 *   2) 合规 fixture 不误报（防止假阳性）
 */
import { describe, expect, it } from "vitest";
import { rules, ruleById } from "../scripts/rules/index.mjs";
import { fileOf } from "../scripts/rules/walk.mjs";
import { isBlocking, resolvePhase, PHASES, CURRENT_PHASE } from "../scripts/rules/phase.mjs";

const F = fileOf;

/** 跑指定规则，返回违规条数。 */
function run(id, files, ctx = {}) {
  const rule = ruleById(id);
  if (!rule) throw new Error(`规则 ${id} 不存在（自检与规则表已脱节）`);
  return rule.check(files, ctx);
}

/** 断言规则命中（抓得到违规）。 */
function expectHit(id, files, ctx = {}) {
  const v = run(id, files, ctx);
  expect(v.length, `${id} 应抓到违规，实际 0 条`).toBeGreaterThan(0);
  return v;
}

/** 断言规则不误报。 */
function expectClean(id, files, ctx = {}) {
  const v = run(id, files, ctx);
  expect(v, `${id} 误报：${JSON.stringify(v)}`).toEqual([]);
}

const ALL_LOCALES = ["zh", "en", "ja", "de", "ko"];

/** 构造 C2 需要的字典上下文：所有内置语言都定义了这些 key。 */
function dictCtx(keys = ["section.experience"]) {
  const defined = {};
  for (const loc of ALL_LOCALES) defined[loc] = new Set(keys);
  return { dict: { defined, locales: ALL_LOCALES } };
}

describe("规则元信息", () => {
  it("规则 id 唯一且字段完整", () => {
    const ids = rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of rules) {
      expect(typeof r.check, `${r.id} 缺少 check`).toBe("function");
      expect(r.title && r.title.length > 0, `${r.id} 缺少 title`).toBe(true);
      expect(PHASES, `${r.id} 的 since 非法：${r.since}`).toContain(r.since);
      expect(["architecture", "security", "pagination", "plugin", "i18n", "quality"]).toContain(
        r.group,
      );
    }
  });
});

describe("阶段升级机制", () => {
  it("since 不晚于当前阶段才阻断", () => {
    expect(isBlocking("M0", "M0")).toBe(true);
    expect(isBlocking("M2", "M0")).toBe(false);
    expect(isBlocking("M2", "M2")).toBe(true);
    expect(isBlocking("M1", "M3")).toBe(true);
  });

  it("阶段可用环境变量覆盖，缺省为当前里程碑", () => {
    // 不写死具体阶段：里程碑推进时 CURRENT_PHASE 会前移，这里只校验解析逻辑
    expect(resolvePhase({})).toBe(CURRENT_PHASE);
    expect(resolvePhase({ STRICT_PHASE: "M3" })).toBe("M3");
    // 非法值回退到当前里程碑，而不是崩溃
    expect(resolvePhase({ STRICT_PHASE: "M9" })).toBe(CURRENT_PHASE);
  });
});

describe("A 组：架构分层", () => {
  it("A1 shared/entities 反向依赖上层时命中", () => {
    expectHit("A1", [F("src/shared/lib/x.ts", 'import { a } from "@/store/useResumeStore";')]);
    expectHit("A1", [F("src/entities/resume/model.ts", 'import { b } from "@/plugins/core/types";')]);
    expectClean("A1", [F("src/shared/lib/x.ts", 'import { a } from "@/shared/lib/id";')]);
  });

  it("A2 plugins/core 依赖 store 时命中", () => {
    expectHit("A2", [F("src/plugins/core/registry.ts", 'import { s } from "@/store/useResumeStore";')]);
    expectClean("A2", [F("src/plugins/core/registry.ts", 'import type { Locale } from "@/entities/locale";')]);
  });

  it("A3 未知目录与 kind 不匹配时命中", () => {
    expectHit("A3", [F("src/plugins/foo/bar.ts", 'export default { kind: "exporter" };')]);
    expectHit("A3", [F("src/plugins/section-types/x.ts", 'export default { kind: "exporter" };')]);
    expectClean("A3", [F("src/plugins/section-types/x.ts", 'export default { kind: "section-type" };')]);
    expectClean("A3", [F("src/plugins/core/types.ts", "export type X = 1;")]);
  });

  it("A4 插件反向依赖 widgets/pages 时命中", () => {
    expectHit("A4", [F("src/plugins/exporters/md.ts", 'import { w } from "@/widgets/editor-toolbar";')]);
    expectClean("A4", [F("src/plugins/exporters/md.ts", 'import { Button } from "@/shared/ui/button";')]);
  });
});

describe("S 组：安全与本地优先", () => {
  it("S1 裸 fetch / XHR / WebSocket 命中，authorizedFetch 放行", () => {
    expectHit("S1", [F("src/features/x.ts", "await fetch('/api');")]);
    expectHit("S1", [F("src/features/x.ts", "new WebSocket('ws://a');")]);
    expectClean("S1", [F("src/plugins/storage/gh.ts", "await authorizedFetch(url);")]);
    expectClean("S1", [F("src/plugins/core/authorizedFetch.ts", "return fetch(url, init);")]);
    // 注释里提到 fetch 不算违规
    expectClean("S1", [F("src/features/x.ts", "// 这里不能用 fetch")]);
  });

  it("S2 innerHTML 仅 EditableField 放行", () => {
    expectHit("S2", [F("src/features/x.ts", "el.innerHTML = html;")]);
    expectClean("S2", [F("src/shared/ui/editable-field.tsx", "el.innerHTML = html;")]);
  });

  it("S3 localStorage 仅白名单放行", () => {
    expectHit("S3", [F("src/features/x.ts", "localStorage.getItem('a');")]);
    expectClean("S3", [F("src/plugins/storage/local.ts", "localStorage.setItem(k, v);")]);
    expectClean("S3", [F("src/plugins/core/enabled.ts", "localStorage.getItem(key);")]);
    // 插件导出名 localStoragePlugin / localStorage-pack 不是读写调用，不能误报
    expectClean("S3", [F("src/plugins/bootstrap.ts", 'import { localStoragePlugin } from "./storage/local";')]);
  });

  it("S4 插件内注入 HTML 命中", () => {
    expectHit("S4", [F("src/plugins/section-types/x.tsx", "<div dangerouslySetInnerHTML={{ __html: h }} />")]);
  });
});

describe("C 组：插件契约", () => {
  const goodSection = F(
    "src/plugins/section-types/experience.tsx",
    `export default {
  id: "experience",
  kind: "section-type",
  labelKey: "section.experience",
  version: 1,
  defaultTitle: { zh: "工作经历", en: "Experience", ja: "職歴", de: "Erfahrung", ko: "경력" },
  fields: [{ key: "title", type: "text" }],
  placement: "main",
  toBlocks() { return []; },
  renderBlock() { return null; },
  renderEditor() { return null; },
};`,
  );

  it("C1 id 缺失 / 非 kebab-case / 重复时命中", () => {
    expectHit("C1", [F("src/plugins/exporters/x.ts", 'export default { kind: "exporter" };')]);
    expectHit("C1", [F("src/plugins/exporters/x.ts", 'export default { id: "MyPlugin", kind: "exporter" };')]);
    expectHit("C1", [
      F("src/plugins/exporters/a.ts", 'export default { id: "md", kind: "exporter" };'),
      F("src/plugins/exporters/b.ts", 'export default { id: "md", kind: "exporter" };'),
    ]);
    expectClean("C1", [F("src/plugins/exporters/x.ts", 'export default { id: "md-export", kind: "exporter" };')]);
    // core 里的 kind 是类型声明，不是插件声明，不能当成"缺 id 的插件"报错
    expectClean("C1", [F("src/plugins/core/types.ts", 'export interface X { kind: "section-type"; id: string }')]);
  });

  it("C2 labelKey 未在全部内置语言定义时命中", () => {
    expectHit("C2", [goodSection], { dict: { defined: { zh: new Set(["section.experience"]), en: new Set() } } });
    expectClean("C2", [goodSection], dictCtx(["section.experience"]));
  });

  it("C3 插件 dict 键前缀与语言齐备", () => {
    expectHit("C3", [
      F("src/plugins/exporters/x.ts", 'export default { id: "md", kind: "exporter", dict: { zh: { "other.key": "x" } } };'),
    ]);
    expectHit("C3", [
      F(
        "src/plugins/exporters/x.ts",
        'export default { id: "md", kind: "exporter", dict: { zh: { "plugin.md.run": "x" }, en: {} } };',
      ),
    ]);
    expectClean("C3", [
      F(
        "src/plugins/exporters/x.ts",
        `export default { id: "md", kind: "exporter", dict: { zh: { "plugin.md.run": "x" }, en: { "plugin.md.run": "x" }, ja: { "plugin.md.run": "x" }, de: { "plugin.md.run": "x" }, ko: { "plugin.md.run": "x" } } };`,
      ),
    ]);
  });

  it("C4 章节插件缺方法 / defaultTitle 不全时命中", () => {
    expectClean("C4", [goodSection]);
    expectHit("C4", [
      F("src/plugins/section-types/x.ts", 'export default { id: "x", kind: "section-type", placement: "main" };'),
    ]);
    expectHit("C4", [
      F(
        "src/plugins/section-types/x.ts",
        `export default { id: "x", kind: "section-type", placement: "main",
          defaultTitle: { zh: "标题", en: "Title" },
          toBlocks() {}, renderBlock() {}, renderEditor() {} };`,
      ),
    ]);
  });

  it("C5 字段 type 非法 / key 重复时命中", () => {
    expectHit("C5", [
      F("src/plugins/section-types/x.ts", 'export default { kind: "section-type", fields: [{ key: "a", type: "video" }] };'),
    ]);
    expectHit("C5", [
      F(
        "src/plugins/section-types/x.ts",
        'export default { kind: "section-type", fields: [{ key: "a", type: "text" }, { key: "a", type: "text" }] };',
      ),
    ]);
    expectClean("C5", [goodSection]);
  });

  it("C5 不把 toBlocks 里的 Block.type 误判为字段 schema type", () => {
    // 回归：Block.type 的 "section-head"/"item"/"skill-group" 与字段 schema 无关
    expectClean("C5", [
      F(
        "src/plugins/section-types/x.ts",
        `export default { kind: "section-type", fields: [{ key: "title", type: "text" }],
          toBlocks() { return [{ id: "h", type: "section-head" }, { id: "i", type: "item" }]; } };`,
      ),
    ]);
  });

  it("C6 远程存储必须默认禁用", () => {
    expectHit("C6", [
      F("src/plugins/storage/gh.ts", 'export default { id: "gh", kind: "storage", capabilities: { remote: true } };'),
    ]);
    expectClean("C6", [
      F(
        "src/plugins/storage/gh.ts",
        'export default { id: "gh", kind: "storage", defaultEnabled: false, capabilities: { remote: true } };',
      ),
    ]);
  });

  it("C7 默认导出插件唯一", () => {
    expectHit("C7", [
      F("src/plugins/exporters/a.ts", 'export default { id: "pdf", kind: "exporter", default: true, run() {} };'),
      F("src/plugins/exporters/b.ts", 'export default { id: "md", kind: "exporter", default: true, run() {} };'),
    ]);
    expectClean("C7", [
      F("src/plugins/exporters/a.ts", 'export default { id: "pdf", kind: "exporter", default: true, run() {} };'),
      F("src/plugins/exporters/b.ts", 'export default { id: "md", kind: "exporter", run() {} };'),
    ]);
  });

  it("C8 语言包 code / fallback 合法", () => {
    expectHit("C8", [F("src/plugins/locale-packs/x.ts", 'export default { kind: "locale-pack", code: "ZH_CN", label: "x" };')]);
    expectHit("C8", [F("src/plugins/locale-packs/x.ts", 'export default { kind: "locale-pack", code: "pt-BR", label: "x", fallback: "zz" };')]);
    expectClean("C8", [
      F("src/plugins/locale-packs/x.ts", 'export default { kind: "locale-pack", code: "pt-BR", label: "Português", fallback: "en" };'),
    ]);
  });

  it("C9 主题 cssVars 必须 --rs- 前缀（作用域隔离）", () => {
    expectHit("C9", [
      F(
        "src/plugins/themes/x.ts",
        `export const x = { id: "x", kind: "theme",
  cssVars: {
    "--rs-rule": "1px solid",
    color: "red",
  } };`,
      ),
    ]);
    expectHit("C9", [
      F("src/plugins/themes/x.ts", 'export default { id: "x", kind: "theme", fonts: { heading: "serif" } };'),
    ]);
    expectClean("C9", [
      F(
        "src/plugins/themes/x.ts",
        `export const x = { id: "x", kind: "theme",
  cssVars: {
    "--rs-rule": "1px solid",
    "--rs-name-size": "2em",
  } };`,
      ),
    ]);
  });
});

describe("H 组：状态与撤销历史", () => {
  it("H1 partialize 含 plugins 时命中", () => {
    expectHit("H1", [
      F("src/store/useResumeStore.ts", "partialize: (state) => ({ resume: state.resume, plugins: state.plugins }),"),
    ]);
    expectClean("H1", [F("src/store/useResumeStore.ts", "partialize: (state) => ({ resume: state.resume }),")]);
  });

  it("H2 插件直接访问 temporal 时命中", () => {
    expectHit("H2", [F("src/plugins/core/x.ts", "useResumeStore.temporal.getState();")]);
  });
});

describe("G 组：分页契约", () => {
  it("G1 distribute 必须纯", () => {
    expectHit("G1", [F("src/features/pagination/distribute.ts", 'import { useMemo } from "react";')]);
    expectHit("G1", [F("src/features/pagination/distribute.ts", "const h = window.innerHeight;")]);
    expectClean("G1", [F("src/features/pagination/distribute.ts", 'import type { Block } from "./buildBlocks";')]);
  });

  it("G2 缺少 flow-root 时命中", () => {
    expectHit("G2", [F("src/features/pagination/PaginatedResume.tsx", "const a = 1;")]);
    expectClean("G2", [F("src/features/pagination/PaginatedResume.tsx", 'style={{ display: "flow-root" }}')]);
  });

  it("G3 JS 与 CSS 边距常量必须同步", () => {
    expectHit("G3", [F("src/shared/config/presets.ts", "export function pageMarginMm() {}")]);
    expectClean("G3", [
      F("src/shared/config/presets.ts", "export function pageMarginMm() {}\nexport const SAFE_ZONE_MM = 10;"),
      F("src/app/styles/globals.css", "padding: var(--rs-margin);\npadding-bottom: calc(var(--rs-margin) + var(--rs-safe));"),
    ]);
  });

  it("G4 分页基线单测必须存在", () => {
    expectHit("G4", []);
    expectHit("G4", [F("tests/pagination.test.ts", "import { describe } from 'vitest';")]);
    expectClean("G4", [F("tests/pagination.test.ts", "import { distributeBlocks } from '@/features/pagination/distribute';")]);
  });

  it("G5 硬编码 kind 分支命中，注册表驱动不误报", () => {
    expectHit("G5", [F("src/features/pagination/buildBlocks.ts", 'if (section.kind === "skills") {}')]);
    expectHit("G5", [F("src/store/migrations.ts", "const VALID_KINDS = ['skills'];")]);
    expectClean("G5", [F("src/features/pagination/buildBlocks.ts", "const plugin = getSectionType(section.kind);")]);
  });
});

describe("I/E 组：国际化与代码质量", () => {
  it("I1 只抓 JSX 文本节点与界面属性的中文", () => {
    expectHit("I1", [F("src/pages/x.tsx", "<div>中文标题</div>")]);
    expectHit("I1", [F("src/pages/x.tsx", '<input placeholder="请输入" />')]);
    // 字典数据与富文本内容是"内容"，不是界面文案，不能误报
    expectClean("I1", [F("src/shared/i18n/dictionaries.ts", '"editor.edit": "编辑",')]);
    expectClean("I1", [F("src/entities/resume/defaults.ts", 'zh: "<p>深耕 B 端产品</p>"')]);
    expectClean("I1", [F("src/pages/x.tsx", "<div>{t('editor.edit')}</div>")]);
  });

  it("I3 插件界面文案须走 t()", () => {
    expectHit("I3", [F("src/plugins/section-types/x.tsx", "<span>新增条目</span>")]);
    expectClean("I3", [F("src/plugins/section-types/x.tsx", "<span>{t('edit.addItem')}</span>")]);
    // 回归：createSample 返回的示例简历富文本（字符串字面量）不是界面文案，不得误报
    expectClean("I3", [
      F(
        "src/plugins/section-types/x.tsx",
        `createSample: () => ({ description: { zh: "<p>深耕 B 端与企业级 SaaS 产品 6 年</p>" } });`,
      ),
    ]);
  });

  it("E1 抓 emoji 但放行装饰符号", () => {
    expectHit("E1", [F("src/pages/x.tsx", 'const label = "完成 🎉";')]);
    expectClean("E1", [F("src/pages/x.tsx", 'const label = "完成 ✓";')]);
    expectClean("E1", [F("src/pages/x.tsx", "const arrow = '→';")]);
  });

  it("E2 图标库只允许 lucide-react", () => {
    expectHit("E2", [F("src/pages/x.tsx", 'import { Icon } from "react-icons";')]);
    expectClean("E2", [F("src/pages/x.tsx", 'import { Plus } from "lucide-react";')]);
  });

  it("E3 禁止 @ts-ignore（写在注释里也要抓）", () => {
    expectHit("E3", [F("src/store/x.ts", "// @ts-ignore\nconst a = 1;")]);
    expectClean("E3", [F("src/store/x.ts", "const a = 1 as string;")]);
  });
});
