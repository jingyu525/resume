/**
 * I1 / I3：禁止硬编码界面文案（FR-6）。
 *
 * 与旧 bash 实现（在 .tsx 里扫任意 \p{Han}）的关键差别：**只查 JSX 文本节点与界面字符串属性**。
 * 原因是插件化后语言包字典与章节插件的 defaultTitle 天然含中文，全量扫汉字会立刻假阳性阻断；
 * 而"内容数据"与"界面文案"的分界正好是 JSX 文本节点 / 属性。
 *
 * 例：
 *   <div>中文</div>                 → 命中（界面文案）
 *   placeholder="中文"              → 命中（界面文案）
 *   "editor.edit": "编辑"           → 不命中（字典数据）
 *   defaultTitle: { zh: "自我评价" } → 不命中（插件数据）
 */
import { filesUnder } from "./util.mjs";

// 注意：这里用显式码点范围而非 \p{Han}。部分 Node 构建（精简 ICU）对 Unicode 属性转义
// 会报 "Invalid property name"，而校验脚本必须保证在任何机器上行为一致。
const HAN = "[\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF]";

/** JSX 文本节点里的中文：>中文<（同一行内，排除含 {表达式} 的片段）。 */
const JSX_TEXT_HAN = new RegExp(`>([^<>{}]*${HAN}[^<>{}]*)<`, "gu");

/** 界面字符串属性里的中文。 */
const ATTR_HAN = new RegExp(
  `\\b(?:placeholder|title|aria-label|alt|label)\\s*=\\s*["'][^"']*${HAN}[^"']*["']`,
  "gu",
);

/**
 * 判断位置 col 是否落在字符串字面量内（跳过转义引号）。
 * 用途：`createSample` 返回的示例简历富文本形如 `"<p>深耕 B 端…</p>"`，
 * 其中 `>中文<` 会误命中 JSX 文本节点规则——但它只是数据字符串，不是界面文案。
 * 真正的 JSX 文本节点（`<div>中文</div>`）不在引号内，能正确命中。
 */
function isInString(line, col) {
  let inStr = false;
  let q = "";
  for (let i = 0; i < col; i++) {
    const c = line[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === q) inStr = false;
    } else if (c === '"' || c === "'" || c === "`") {
      inStr = true;
      q = c;
    }
  }
  return inStr;
}

function scanHardcoded(files) {
  // 只查 src 下的 .tsx：JSX 文本节点只可能出现在 tsx 里。若连 .ts 一起扫，
  // 示例简历富文本会被误判成界面文案；tests 里的中文是测试夹具，也不属于界面文案。
  return files
    .filter((f) => f.path.startsWith("src/") && f.path.endsWith(".tsx"))
    .flatMap((file) => {
      const lines = file.text.split("\n");
      const hits = [];
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) continue; // 跳过注释行
        let m;
        JSX_TEXT_HAN.lastIndex = 0;
        while ((m = JSX_TEXT_HAN.exec(line)) !== null) {
          // 引号内的 `>中文<` 是数据字符串（示例富文本），不算界面文案
          if (isInString(line, m.index + 1)) continue;
          hits.push({
            file: file.path,
            line: li + 1,
            message: `JSX 文本节点疑似硬编码中文「${m[1]}」，请用 t("key")`,
          });
        }
        ATTR_HAN.lastIndex = 0;
        while ((m = ATTR_HAN.exec(line)) !== null) {
          hits.push({
            file: file.path,
            line: li + 1,
            message: `界面属性疑似硬编码中文（${m[0]}），请用 t("key")`,
          });
        }
      }
      return hits;
    });
}

export const rules = [
  {
    id: "I1",
    group: "i18n",
    title: "国际化：界面文案禁止硬编码中文（插件目录由 I3 管辖）",
    since: "M0",
    severity: "warn",
    /** 与旧脚本一致：I18N_BLOCKING=1 时升级为阻断。LandingPage 展示区示例内容接入五语后再转 1。 */
    blockingByEnv: "I18N_BLOCKING",
    check(files) {
      return scanHardcoded(files.filter((f) => !f.path.startsWith("src/plugins/")));
    },
  },
  {
    id: "I3",
    group: "plugin",
    title: "国际化：插件内界面文案须走 t()",
    since: "M1",
    check(files) {
      return scanHardcoded(filesUnder(files, "src/plugins/"));
    },
  },
];
