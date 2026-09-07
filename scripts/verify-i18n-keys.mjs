#!/usr/bin/env node
/**
 * i18n key 全面校验（FR-6 补强）。
 *
 * 双轨检查，覆盖两类缺失：
 *  1) 缺失定义：源码里引用的 key 在字典中不存在 —— t() 会静默回退成 key 原文，
 *     表现为界面上出现 "layout.single" 这类"看似正常的文案"，极难肉眼发现。
 *  2) 跨语言不完整：某个 key 只存在于部分语言（应五语齐全）。
 *
 * 引用来源（静态提取）：
 *  - t("x") / t('x')（含 useI18n().t("x")）
 *  - translate(locale, "x")
 *  - 配置里的 labelKey: "x"（如 presets.ts 的 LAYOUTS/TONES，key 经变量传入 t()，
 *    普通 grep t("...") 扫不到，是本检查的重点）
 *
 * 字典解析：直接读取 dictionaries.ts，剥离 TS 类型标注后 eval 出真实对象再展开 dot-path。
 * 单独运行：node scripts/verify-i18n-keys.mjs
 * 由 scripts/verify-rules.sh 调用；退出码 1 表示有缺失（默认阻断提交）。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDictionaries, flatten, BUILTIN_LOCALES } from "./rules/dictionary.mjs";
import { readSourceFiles } from "./rules/walk.mjs";
import { findObjectValue, topLevelKeys } from "./rules/util.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DICT_PATH = join(ROOT, "src/shared/i18n/dictionaries.ts");
const SRC_DIR = join(ROOT, "src");
const PLUGINS_DIR = join(ROOT, "src", "plugins");

// ── 1. 解析字典，展开为 dot-path 集合 ──
// 核心字典沿用按括号配平提取对象字面量的做法（零依赖，见 rules/dictionary.mjs）。
let dictionaries;
try {
  dictionaries = parseDictionaries(readFileSync(DICT_PATH, "utf8"));
} catch (e) {
  console.error("✗ 无法解析 dictionaries.ts：", e.message);
  process.exit(1);
}

/**
 * 收集插件自带文案（PluginBase.dict）。
 * 插件化后界面文案不再只来自核心字典：插件可以把自己的文案带进来，
 * 键名统一 plugin.<id>. 前缀（由规则 C3 强制），否则插件之间会互相覆盖。
 * @returns {Map<string, Set<string>>} locale -> dot-path 集合
 */
function collectPluginDicts() {
  const byLocale = new Map();
  for (const file of readSourceFiles(PLUGINS_DIR)) {
    const found = findObjectValue(file, "dict");
    if (!found) continue;
    for (const loc of topLevelKeys(found.block)) {
      const inner = findObjectValue({ text: found.block, lines: found.block.split("\n") }, loc);
      if (!inner) continue;
      let keys;
      try {
        keys = flatten(new Function(`return ${inner.block};`)());
      } catch {
        keys = new Set(topLevelKeys(inner.block));
      }
      const set = byLocale.get(loc) ?? new Set();
      for (const k of keys) set.add(k);
      byLocale.set(loc, set);
    }
  }
  return byLocale;
}

const locales = Object.keys(dictionaries);
const pluginDicts = collectPluginDicts();
const defined = {};
for (const loc of locales) {
  const set = flatten(dictionaries[loc]);
  for (const k of pluginDicts.get(loc) ?? []) set.add(k);
  defined[loc] = set;
}
const union = new Set();
for (const loc of locales) for (const k of defined[loc]) union.add(k);

// ── 2. 收集源码里"应当存在于字典"的 key ──
function walk(dir, files = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (e !== "node_modules") walk(p, files);
    } else if (/\.(ts|tsx)$/.test(e)) {
      files.push(p);
    }
  }
  return files;
}

const srcFiles = walk(SRC_DIR).filter((f) => !f.endsWith("dictionaries.ts"));
const used = new Set();
const reT = /(?<![\w])t\(\s*["']([^"']+)["']\s*\)/g;
const reTranslate = /\btranslate\(\s*\w+\s*,\s*["']([^"']+)["']\s*\)/g;
// 排除 fieldKey：它是字段插件声明的数据字段名（如 fieldKey: "phone"），不是 i18n key。
const reKeyProp = /\b(?!fieldKey)(\w*Key)\s*:\s*["']([^"']+)["']/g;

for (const f of srcFiles) {
  const txt = readFileSync(f, "utf8");
  for (const m of txt.matchAll(reT)) used.add(m[1]);
  for (const m of txt.matchAll(reTranslate)) used.add(m[1]);
  for (const m of txt.matchAll(reKeyProp)) used.add(m[2]);
}

// ── 3. 比对 ──
const problems = [];
const warns = [];
for (const k of used) {
  if (!union.has(k)) problems.push(`缺失定义（代码引用但字典未定义）: ${k}`);
}
for (const loc of locales) {
  const target = BUILTIN_LOCALES.includes(loc) ? problems : warns;
  const suffix = BUILTIN_LOCALES.includes(loc) ? "（应五语齐全）" : "（新增语言包：可经 fallback 回退）";
  for (const k of union) {
    if (!defined[loc].has(k)) target.push(`语言 ${loc} 缺少 key${suffix}: ${k}`);
  }
}

const pluginKeyCount = [...pluginDicts.values()].reduce((n, s) => n + s.size, 0);

if (problems.length) {
  console.log("✗ i18n key 校验未通过：");
  for (const p of problems) console.log("  - " + p);
  console.log(
    `\n已定义 key ${union.size} 个（含插件 ${pluginKeyCount} 个），源码引用 ${used.size} 个，问题 ${problems.length} 条`,
  );
  process.exit(1);
}
console.log(
  `✓ i18n key 校验通过（已定义 ${union.size} 个，引用 ${used.size} 个，内置语言齐全）${pluginKeyCount ? `｜插件文案 ${pluginKeyCount} 个` : ""}`,
);
if (warns.length) {
  console.log(`⚠ 新增语言包存在未覆盖的 key ${warns.length} 条（依赖 fallback，非阻断）：`);
  for (const w of warns.slice(0, 10)) console.log("  - " + w);
  if (warns.length > 10) console.log(`  …另有 ${warns.length - 10} 条`);
}
