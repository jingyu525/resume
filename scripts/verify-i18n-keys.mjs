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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DICT_PATH = join(ROOT, "src/shared/i18n/dictionaries.ts");
const SRC_DIR = join(ROOT, "src");

// ── 1. 解析字典，展开为 dot-path 集合 ──
// 直接提取 `dictionaries = { ... }` 对象字面量（按括号配平），避免 TS 语法干扰 eval。
function extractDictionaries(src) {
  const start = src.indexOf("dictionaries");
  if (start < 0) throw new Error("找不到 dictionaries 定义");
  let i = src.indexOf("{", start);
  if (i < 0) throw new Error("找不到 dictionaries 对象起始 {");
  let depth = 0;
  const begin = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(begin, i + 1);
    }
  }
  throw new Error("dictionaries 对象括号不匹配");
}

let dictionaries;
try {
  const lit = extractDictionaries(readFileSync(DICT_PATH, "utf8"));
  dictionaries = new Function(`return ${lit};`)();
} catch (e) {
  console.error("✗ 无法解析 dictionaries.ts：", e.message);
  process.exit(1);
}

function flatten(obj, prefix = "") {
  const out = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key);
    else out.add(key);
  }
  return out;
}

const locales = Object.keys(dictionaries);
const defined = {};
for (const loc of locales) defined[loc] = flatten(dictionaries[loc]);
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
const reKeyProp = /\b(\w*Key)\s*:\s*["']([^"']+)["']/g;

for (const f of srcFiles) {
  const txt = readFileSync(f, "utf8");
  for (const m of txt.matchAll(reT)) used.add(m[1]);
  for (const m of txt.matchAll(reTranslate)) used.add(m[1]);
  for (const m of txt.matchAll(reKeyProp)) used.add(m[2]);
}

// ── 3. 比对 ──
const problems = [];
for (const k of used) {
  if (!union.has(k)) problems.push(`缺失定义（代码引用但字典未定义）: ${k}`);
}
for (const loc of locales) {
  for (const k of union) {
    if (!defined[loc].has(k)) problems.push(`语言 ${loc} 缺少 key（应五语齐全）: ${k}`);
  }
}

if (problems.length) {
  console.log("✗ i18n key 校验未通过：");
  for (const p of problems) console.log("  - " + p);
  console.log(`\n已定义 key ${union.size} 个，源码引用 ${used.size} 个，问题 ${problems.length} 条`);
  process.exit(1);
}
console.log(`✓ i18n key 校验通过（已定义 ${union.size} 个，引用 ${used.size} 个，五语齐全）`);
