/**
 * 核心字典解析（供规则与 i18n 校验脚本共用）。
 *
 * 解析方式沿用 scripts/verify-i18n-keys.mjs 的做法：按括号配平截取
 * `dictionaries` 对象字面量再求值，避免引入 TS 解析器（保持零依赖）。
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const DICT_REL_PATH = "src/shared/i18n/dictionaries.ts";

export const BUILTIN_LOCALES = ["zh", "en", "ja", "de", "ko"];

/** 从 dictionaries.ts 源码文本中解析出字典对象。 */
export function parseDictionaries(sourceText) {
  const start = sourceText.indexOf("dictionaries");
  if (start < 0) throw new Error("找不到 dictionaries 定义");
  let i = sourceText.indexOf("{", start);
  if (i < 0) throw new Error("找不到 dictionaries 对象起始 {");
  const begin = i;
  let depth = 0;
  for (; i < sourceText.length; i++) {
    const c = sourceText[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        return new Function(`return ${sourceText.slice(begin, i + 1)};`)();
      }
    }
  }
  throw new Error("dictionaries 对象括号不匹配");
}

/** 把嵌套字典展开为 dot-path 集合。 */
export function flatten(obj, prefix = "") {
  const out = new Set();
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key);
    else out.add(key);
  }
  return out;
}

/**
 * 读取项目核心字典。文件不存在或解析失败时返回 null（存在即校验，不误报）。
 * @param {string} root 项目根目录
 */
export function loadCoreDictionaries(root) {
  const abs = join(root, DICT_REL_PATH);
  if (!existsSync(abs)) return null;
  try {
    const raw = parseDictionaries(readFileSync(abs, "utf8"));
    const defined = {};
    for (const loc of Object.keys(raw)) defined[loc] = flatten(raw[loc]);
    return { raw, defined, locales: Object.keys(raw) };
  } catch {
    return null;
  }
}
