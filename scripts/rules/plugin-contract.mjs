/**
 * C 组：插件契约校验。
 *
 * 约定：**一个文件一个插件**（文件级解析，避免引入 AST 解析器）。
 * 插件目录不存在时全部规则自动跳过（存在即校验），保证 M0 阶段空转不误报。
 */
import { filesUnder, findStringValue, findBoolValue, findObjectValue, topLevelKeys } from "./util.mjs";
import { categoryOf } from "./architecture.mjs";
import { BUILTIN_LOCALES } from "./dictionary.mjs";

const PLUGIN_ROOT = "src/plugins/";
const ID_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const BCP47_RE = /^[a-z]{2}(?:-[A-Za-z0-9]{2,8})*$/;

/** 字段 schema 允许的类型。 */
const FIELD_TYPES = [
  "text",
  "richtext",
  "date",
  "month-range",
  "switch",
  "url",
  "tags",
  "number",
];

/** 收集插件声明：文件内出现 kind: "..." 即视为插件文件。 */
export function collectPlugins(files) {
  return filesUnder(files, PLUGIN_ROOT)
    // core 是内核（类型与注册表），里面的 kind: "section-type" 是类型声明而非插件声明，
    // 必须排除，否则会把类型定义当成缺字段的插件来报错。
    .filter((file) => !file.path.startsWith("src/plugins/core/"))
    .map((file) => {
      const kind = findStringValue(file.text, "kind");
      if (!kind) return null;
      return {
        file,
        path: file.path,
        category: categoryOf(file.path),
        id: findStringValue(file.text, "id"),
        kind,
        text: file.text,
      };
    })
    .filter(Boolean);
}

function lineOf(file, needle) {
  const idx = file.text.indexOf(needle);
  return idx < 0 ? 1 : file.text.slice(0, idx).split("\n").length;
}

export const rules = [
  {
    id: "C1",
    group: "plugin",
    title: "契约：插件 id 必填、kebab-case、全局唯一",
    since: "M1",
    check(files) {
      const out = [];
      const seen = new Map();
      for (const p of collectPlugins(files)) {
        if (!p.id) {
          out.push({ file: p.path, line: 1, message: "插件缺少 id" });
          continue;
        }
        if (!ID_RE.test(p.id)) {
          out.push({ file: p.path, line: lineOf(p.file, `id: "${p.id}"`), message: `id "${p.id}" 须为 kebab-case` });
        }
        if (seen.has(p.id)) {
          out.push({ file: p.path, line: lineOf(p.file, `id: "${p.id}"`), message: `id "${p.id}" 与 ${seen.get(p.id)} 重复` });
        } else {
          seen.set(p.id, p.path);
        }
      }
      return out;
    },
  },
  {
    id: "C2",
    group: "plugin",
    title: "契约：labelKey 必须在全部内置语言中定义",
    since: "M1",
    /** 需要调度器注入核心字典上下文。 */
    needsDict: true,
    check(files, ctx = {}) {
      const dict = ctx.dict;
      if (!dict) return []; // 字典不可用时不误报
      const out = [];
      for (const p of collectPlugins(files)) {
        const labelKey = findStringValue(p.text, "labelKey");
        if (!labelKey) {
          out.push({ file: p.path, line: 1, message: `插件 ${p.id ?? "(无 id)"} 缺少 labelKey（界面文案必须走字典）` });
          continue;
        }
        for (const loc of BUILTIN_LOCALES) {
          const defined = dict.defined?.[loc];
          if (defined && !defined.has(labelKey)) {
            out.push({
              file: p.path,
              line: lineOf(p.file, `labelKey: "${labelKey}"`),
              message: `labelKey "${labelKey}" 在语言 ${loc} 未定义（须五语齐全，缺失会显示成 key 原文）`,
            });
          }
        }
      }
      return out;
    },
  },
  {
    id: "C3",
    group: "plugin",
    title: "契约：插件 dict 键须 plugin.<id>. 前缀且各语言齐备",
    since: "M1",
    check(files) {
      const out = [];
      for (const p of collectPlugins(files)) {
        const found = findObjectValue(p.file, "dict");
        if (!found) continue;
        const locales = topLevelKeys(found.block);
        if (locales.length === 0) continue;
        // 语言包只提供「自己那一种」语言的翻译（如 fr 包只给 fr），不要求五语齐备；
        // 五语齐备只约束普通插件自带文案（plugin.<id>. 键须每个内置语言都有）。
        if (p.kind !== "locale-pack") {
          for (const loc of BUILTIN_LOCALES) {
            if (!locales.includes(loc)) {
              out.push({
                file: p.path,
                line: found.line,
                message: `dict 缺少语言 ${loc}（FR-6：插件文案同样须五语齐全）`,
              });
            }
          }
        }
        const keysByLocale = new Map();
        for (const loc of locales) {
          const inner = findObjectValue({ text: found.block, lines: found.block.split("\n") }, loc);
          keysByLocale.set(loc, new Set(topLevelKeys(inner?.block ?? "{}")));
        }
        // 语言包插件翻译的是核心 UI 键（edit.* / sec.* 等），键名不加 plugin.<id>. 前缀；
        // 只有普通插件（导出/存储/章节等）的自带文案才需要 plugin.<id>. 前缀隔离。
        if (p.kind !== "locale-pack") {
          for (const [loc, keys] of keysByLocale) {
            for (const key of keys) {
              if (!key.startsWith(`plugin.${p.id}.`)) {
                out.push({
                  file: p.path,
                  line: found.line,
                  message: `dict 键 "${key}"（${loc}）须以 plugin.${p.id}. 开头，避免插件间键名冲突`,
                });
              }
            }
          }
        }
        // 各语言键集合必须一致（缺键会静默回退成 key 原文）
        const base = keysByLocale.get(locales[0]);
        for (const loc of locales.slice(1)) {
          for (const key of base) {
            if (!keysByLocale.get(loc).has(key)) {
              out.push({ file: p.path, line: found.line, message: `dict 键 "${key}" 在语言 ${loc} 缺失（须与 ${locales[0]} 齐备）` });
            }
          }
        }
      }
      return out;
    },
  },
  {
    id: "C4",
    group: "plugin",
    title: "契约：章节插件方法齐备且 defaultTitle 五语齐全",
    since: "M2",
    check(files) {
      const out = [];
      for (const p of collectPlugins(files).filter((x) => x.kind === "section-type")) {
        for (const method of ["toBlocks", "renderBlock", "renderEditor"]) {
          if (!new RegExp(`(^|[\\s,{])${method}\\s*[(:]`).test(p.text)) {
            out.push({ file: p.path, line: 1, message: `章节插件 ${p.id} 缺少 ${method}（分页与编辑依赖它）` });
          }
        }
        const title = findObjectValue(p.file, "defaultTitle");
        if (!title) {
          out.push({ file: p.path, line: 1, message: `章节插件 ${p.id} 缺少 defaultTitle（默认章节标题）` });
        } else {
          const locales = topLevelKeys(title.block);
          for (const loc of BUILTIN_LOCALES) {
            if (!locales.includes(loc)) {
              out.push({ file: p.path, line: title.line, message: `defaultTitle 缺少语言 ${loc}（须五语齐全）` });
            }
          }
        }
        if (!findObjectValue(p.file, "fields") && !/fields\s*:/.test(p.text)) {
          out.push({ file: p.path, line: 1, message: `章节插件 ${p.id} 缺少 fields（字段 schema）` });
        }
        if (!findStringValue(p.text, "placement")) {
          out.push({ file: p.path, line: 1, message: `章节插件 ${p.id} 缺少 placement（侧栏版式归属：auto|sidebar|main）` });
        }
      }
      return out;
    },
  },
  {
    id: "C5",
    group: "plugin",
    title: "契约：字段 schema 的 key 唯一且 type 合法",
    since: "M2",
    check(files) {
      const out = [];
      for (const p of collectPlugins(files)) {
        // 只在 fields 数组内部检查：toBlocks 返回的 Block.type（"section-head"/"item"/
        // "skill-group"）也是 type: "..." 字面量，扫全文件会误判为字段 schema。
        const found = findObjectValue(p.file, "fields");
        if (!found) continue;
        const block = found.block;
        const types = [...block.matchAll(/\btype\s*:\s*["']([^"']+)["']/g)].map((m) => m[1]);
        const keys = [...block.matchAll(/\bkey\s*:\s*["']([^"']+)["']/g)].map((m) => m[1]);
        const seen = new Set();
        for (const key of keys) {
          if (seen.has(key)) out.push({ file: p.path, line: found.line, message: `字段 key "${key}" 重复` });
          seen.add(key);
        }
        for (const type of types) {
          if (!FIELD_TYPES.includes(type)) {
            out.push({
              file: p.path,
              line: found.line,
              message: `字段 type "${type}" 非法，应为 ${FIELD_TYPES.join(" | ")}`,
            });
          }
        }
        if (seen.size === 0) {
          out.push({ file: p.path, line: found.line, message: `章节插件 ${p.id} 的 fields 为空（应至少声明一个字段）` });
        }
      }
      return out;
    },
  },
  {
    id: "C6",
    group: "plugin",
    title: "契约：存储插件须声明 capabilities，remote 则默认禁用",
    since: "M5",
    check(files) {
      const out = [];
      for (const p of collectPlugins(files).filter((x) => x.kind === "storage")) {
        if (!/capabilities\s*:/.test(p.text)) {
          out.push({ file: p.path, line: 1, message: `存储插件 ${p.id} 缺少 capabilities` });
          continue;
        }
        const remote = findBoolValue(p.text, "remote");
        const defaultEnabled = findBoolValue(p.text, "defaultEnabled");
        if (remote === true && defaultEnabled !== false) {
          out.push({
            file: p.path,
            line: lineOf(p.file, "remote"),
            message: `远程存储插件 ${p.id} 必须 defaultEnabled: false（须用户显式启用并授权）`,
          });
        }
      }
      return out;
    },
  },
  {
    id: "C7",
    group: "plugin",
    title: "契约：导出插件须实现 run，且默认导出唯一",
    since: "M4",
    check(files) {
      const out = [];
      let defaultId = null;
      for (const p of collectPlugins(files).filter((x) => x.kind === "exporter")) {
        if (!/(^|[\s,{])run\s*[(:]/.test(p.text)) {
          out.push({ file: p.path, line: 1, message: `导出插件 ${p.id} 缺少 run()` });
        }
        if (findBoolValue(p.text, "default") === true) {
          if (defaultId) {
            out.push({ file: p.path, line: lineOf(p.file, "default"), message: `默认导出插件只能有一个，已存在 ${defaultId}` });
          } else {
            defaultId = p.id;
          }
        }
      }
      return out;
    },
  },
  {
    id: "C8",
    group: "plugin",
    title: "契约：语言包 code/label/fallback 合法",
    since: "M3",
    check(files) {
      const out = [];
      const codes = new Map();
      for (const p of collectPlugins(files).filter((x) => x.kind === "locale-pack")) {
        const code = findStringValue(p.text, "code");
        const label = findStringValue(p.text, "label");
        const fallback = findStringValue(p.text, "fallback");
        if (!code || !BCP47_RE.test(code)) {
          out.push({ file: p.path, line: 1, message: `语言包 code "${code ?? "(缺失)"}" 须符合 BCP-47（如 zh / pt-BR）` });
        } else if (codes.has(code)) {
          out.push({ file: p.path, line: lineOf(p.file, `code: "${code}"`), message: `语言包 code "${code}" 与 ${codes.get(code)} 重复` });
        } else {
          codes.set(code, p.path);
        }
        if (!label) out.push({ file: p.path, line: 1, message: `语言包 ${code ?? ""} 缺少 label（语言切换器显示名）` });
        if (fallback && !BUILTIN_LOCALES.includes(fallback) && !codes.has(fallback)) {
          out.push({ file: p.path, line: lineOf(p.file, `fallback: "${fallback}"`), message: `fallback "${fallback}" 既非内置语言也非已注册语言包` });
        }
      }
      return out;
    },
  },
  {
    id: "C9",
    group: "plugin",
    title: "契约：主题插件样式须作用域隔离（cssVars 仅 --rs- 前缀，禁止全局选择器）",
    since: "M6",
    check(files) {
      const out = [];
      for (const p of collectPlugins(files).filter((x) => x.kind === "theme")) {
        const found = findObjectValue(p.file, "cssVars");
        if (!found) {
          out.push({ file: p.path, line: 1, message: `主题插件 ${p.id} 缺少 cssVars` });
          continue;
        }
        const block = found.block;
        const keys = [...block.matchAll(/^\s*([\w-]+)\s*:/gm)].map((m) => m[1]);
        for (const key of keys) {
          if (!key.startsWith("--rs-")) {
            out.push({
              file: p.path,
              line: found.line,
              message: `主题 cssVars 键 "${key}" 须以 --rs- 前缀（避免污染全局样式，规则 AC）`,
            });
          }
        }
      }
      return out;
    },
  },
];
