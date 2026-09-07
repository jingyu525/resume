/**
 * 规则模块共用工具。
 *
 * 所有函数都是纯函数：只吃传入的 files（{ path, text, lines }[]）或字符串，
 * 不读盘、不打印、不 process.exit —— 这样规则既能被 CLI 调用，也能被 Vitest
 * 用 fixture 直接 import 做自检（见 tests/verify-rules.test.ts）。
 */

/**
 * 逐行匹配正则，返回命中列表。
 * @param {{path:string,lines:string[]}} file
 * @param {RegExp} re 传入时可带 g 也可不带
 * @returns {{file:string,line:number,text:string,match:string,groups:string[]}[]}
 */
export function matchLines(file, re) {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const rx = new RegExp(re.source, flags);
  const out = [];
  for (let i = 0; i < file.lines.length; i++) {
    const lineText = file.lines[i];
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(lineText)) !== null) {
      out.push({
        file: file.path,
        line: i + 1,
        text: lineText.trim(),
        match: m[0],
        groups: m.slice(1),
      });
      if (m[0] === "") rx.lastIndex++; // 防止零宽匹配死循环
    }
  }
  return out;
}

/** 跳过注释行后的行号集合：返回 true 表示该行是纯注释/块注释内部。 */
export function commentLineFlags(lines) {
  const flags = [];
  let inBlock = false;
  for (const raw of lines) {
    const t = raw.trim();
    if (inBlock) {
      flags.push(true);
      if (t.includes("*/")) inBlock = false;
      continue;
    }
    if (t.startsWith("//")) {
      flags.push(true);
      continue;
    }
    if (t.startsWith("/*")) {
      flags.push(true);
      if (!t.includes("*/")) inBlock = true;
      continue;
    }
    flags.push(false);
  }
  return flags;
}

/** 匹配并跳过注释行（用于"代码里出现 X"类规则，避免注释里的示例误报）。 */
export function matchCodeLines(file, re) {
  const flags = commentLineFlags(file.lines);
  return matchLines(file, re).filter((hit) => !flags[hit.line - 1]);
}

/** 提取所有 import / 动态 import 的来源字符串。 */
export function importsOf(text) {
  const specs = [];
  const re = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(text)) !== null) specs.push({ spec: m[1], index: m.index });
  return specs;
}

/** 文件内是否 import 了匹配 matcher 的模块。 */
export function hasImport(file, matcher) {
  const test = typeof matcher === "string" ? (s) => s === matcher : matcher;
  return importsOf(file.text).some((i) => test(i.spec));
}

/** 按路径前缀筛文件（路径统一为相对项目根的 posix 形式）。 */
export function filesUnder(files, prefix) {
  return files.filter((f) => f.path.startsWith(prefix));
}

/**
 * 只取产品源码：tests 里的字符串（如 "fetch(" / "localStorage" / "@ts-ignore"）
 * 是测试夹具而非真实调用/注解，纳入扫描会产生假阳性。
 */
export function productFiles(files) {
  return files.filter((f) => f.path.startsWith("src/"));
}

/** 找到 needle 在 text 中的下标，找不到返回 -1。 */
export function indexOf(text, needle) {
  return text.indexOf(needle);
}

/**
 * 从 startIdx（须指向 "{"）开始截取括号配平的块内容（含外层花括号）。
 * 用于解析插件声明里的 dict / defaultTitle 等对象字面量。
 */
export function objectBlockAt(text, startIdx) {
  if (startIdx < 0 || text[startIdx] !== "{") return null;
  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

/**
 * 取对象块（含外层花括号）中的**顶层**键名。
 *
 * 用深度感知扫描而非正则：键可能是无引号标识符（{ zh: "中文" }），也可能带引号
 * （{ "plugin.md.run": "x" }，含点号必须引号）；同时要跳过嵌套对象里的键，
 * 否则解析 defaultTitle / dict 时会把下一层的键也算进顶层。
 */
export function topLevelKeys(block) {
  if (!block || block.length < 2) return [];
  const inner = block.slice(1, -1);
  const keys = [];
  let depth = 0;
  let buf = "";
  let inStr = false;
  let strChar = "";
  let quoted = false;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (inStr) {
      buf += c;
      if (c === "\\") {
        buf += inner[++i] ?? "";
        continue;
      }
      if (c === strChar) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      strChar = c;
      quoted = true;
      buf += c;
      continue;
    }
    if (c === "{" || c === "[") {
      depth++;
      continue;
    }
    if (c === "}" || c === "]") {
      depth--;
      continue;
    }
    if (depth > 0) continue;
    if (c === ":") {
      // 带引号的键要先 trim（引号前可能有空白），再去首尾引号
      const key = quoted ? buf.trim().slice(1, -1) : buf.trim();
      if (key) keys.push(key);
      buf = "";
      quoted = false;
      continue;
    }
    if (c === ",") {
      buf = "";
      quoted = false;
      continue;
    }
    buf += c;
  }
  return keys;
}

/**
 * 在文件文本里查找 `key: {` 或 `key: [` 形式的块（跳过注释行），返回 { block, line }。
 * key 支持 `dict:` / `defaultTitle:` / `fields:` 等字面量前缀——`fields` 是数组，
 * 旧实现只认 `{` 会把 `fields: [...]` 漏掉。
 */
export function findObjectValue(file, key) {
  const re = new RegExp(`(?:^|[\\s,{])${key}\\s*:\\s*`, "g");
  let m;
  while ((m = re.exec(file.text)) !== null) {
    const start = m.index + m[0].length;
    const open = file.text.slice(start).search(/^[ \t]*[[{]/);
    if (open < 0) continue;
    const brace = start + open;
    const between = file.text.slice(start, brace);
    if (!/^\s*$/.test(between)) continue;
    const block = blockAt(file.text, brace);
    if (!block) continue;
    const line = file.text.slice(0, m.index).split("\n").length;
    return { block, line };
  }
  return null;
}

/** 从 startIdx（须为 `{` 或 `[`）起抽取配平的同类型括号块（含两端括号）。 */
export function blockAt(text, startIdx) {
  const open = text[startIdx];
  if (open !== "{" && open !== "[") return null;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let q = "";
  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === q) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = true;
      q = c;
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

/** 在文本中查找 `key: "value"` 形式的字符串值。 */
export function findStringValue(text, key) {
  const re = new RegExp(`(?:^|[\\s,{])${key}\\s*:\\s*["']([^"']+)["']`);
  const m = re.exec(text);
  return m ? m[1] : null;
}

/** 在文本中查找 `key: true|false` 形式的布尔值。 */
export function findBoolValue(text, key) {
  const re = new RegExp(`(?:^|[\\s,{])${key}\\s*:\\s*(true|false)\\b`);
  const m = re.exec(text);
  return m ? m[1] === "true" : null;
}
