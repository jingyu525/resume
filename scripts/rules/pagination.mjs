/**
 * G 组：A4 分页契约（FR-7）。
 *
 * 分页是"测量 → 分配"两阶段：插件只负责产出可测高的原子块，
 * 分配算法 distributeBlocks 必须保持纯函数，不感知插件、不碰 DOM。
 * G1/G2/G3 把 JS 与 CSS 两侧容易悄悄错位的地方钉死。
 */
import { matchCodeLines, importsOf } from "./util.mjs";

const DISTRIBUTE_FILE = "src/features/pagination/distribute.ts";
const PAGINATED_FILE = "src/features/pagination/PaginatedResume.tsx";
const GLOBALS_CSS = "src/app/styles/globals.css";
const PRESETS_FILE = "src/shared/config/presets.ts";
const PAGINATION_TEST = "tests/pagination.test.ts";

/** G5 管辖：这些文件不得再按 kind 硬编码分支。 */
const KIND_BRANCH_FILES = [
  "src/features/pagination/buildBlocks.ts",
  "src/features/pagination/BlockView.tsx",
  "src/features/resume-editing/EditPanel.tsx",
  "src/store/migrations.ts",
];

const BUILTIN_KINDS = "summary|experience|project|education|skills";

function fileByPath(files, path) {
  return files.find((f) => f.path === path);
}

function hasText(files, path, needle) {
  const f = fileByPath(files, path);
  return Boolean(f && f.text.includes(needle));
}

export const rules = [
  {
    id: "G1",
    group: "pagination",
    title: "分页：distribute.ts 必须是纯函数",
    since: "M0",
    check(files) {
      const file = fileByPath(files, DISTRIBUTE_FILE);
      if (!file) return [];
      const out = [];
      for (const i of importsOf(file.text)) {
        const isEntityOrShared = /^@\/(entities|shared)\//.test(i.spec);
        const isForbidden = i.spec === "react" || (/^@\//.test(i.spec) && !isEntityOrShared);
        if (isForbidden) {
          out.push({
            file: file.path,
            line: file.text.slice(0, i.index).split("\n").length,
            message: `distribute 只可依赖 entities/shared，不得 import ${i.spec}（分页算法必须保持纯函数）`,
          });
        }
      }
      for (const hit of matchCodeLines(file, /\b(window|document)\s*\./g)) {
        out.push({
          file: hit.file,
          line: hit.line,
          message: `distribute 不得触碰 ${hit.groups[0]}（测量在 PaginatedResume 里做，分配保持纯函数）`,
        });
      }
      return out;
    },
  },
  {
    id: "G2",
    group: "pagination",
    title: "分页：块容器必须保持 display: flow-root",
    since: "M0",
    check(files) {
      const inTsx = hasText(files, PAGINATED_FILE, "flow-root");
      const inCss = hasText(files, GLOBALS_CSS, "flow-root");
      const exists = Boolean(fileByPath(files, PAGINATED_FILE) || fileByPath(files, GLOBALS_CSS));
      if (!exists || inTsx || inCss) return [];
      return [
        {
          file: PAGINATED_FILE,
          line: 1,
          message: "分页块包裹元素缺少 display: flow-root（子元素外边距将不计入 offsetHeight，分页会静默算错）",
        },
      ];
    },
  },
  {
    id: "G3",
    group: "pagination",
    title: "分页：JS 边距常量与 CSS 变量必须同步存在",
    since: "M0",
    check(files) {
      const out = [];
      const presets = fileByPath(files, PRESETS_FILE);
      const css = fileByPath(files, GLOBALS_CSS);
      if (presets) {
        if (!presets.text.includes("pageMarginMm")) {
          out.push({ file: presets.path, line: 1, message: "presets.ts 缺少 pageMarginMm（CSS 侧 --rs-margin 依赖它）" });
        }
        if (!presets.text.includes("SAFE_ZONE_MM")) {
          out.push({ file: presets.path, line: 1, message: "presets.ts 缺少 SAFE_ZONE_MM（CSS 侧 --rs-safe 依赖它）" });
        }
      }
      if (css) {
        if (!css.text.includes("--rs-margin")) {
          out.push({ file: css.path, line: 1, message: "globals.css 缺少 --rs-margin（须与 pageMarginMm 保持一致）" });
        }
        if (!css.text.includes("--rs-safe")) {
          out.push({ file: css.path, line: 1, message: "globals.css 缺少 --rs-safe（须与 SAFE_ZONE_MM 保持一致）" });
        }
      }
      return out;
    },
  },
  {
    id: "G4",
    group: "pagination",
    title: "分页：tests/pagination.test.ts 必须存在且覆盖 distributeBlocks",
    since: "M0",
    check(files) {
      const test = fileByPath(files, PAGINATION_TEST);
      if (!test) {
        return [{ file: PAGINATION_TEST, line: 1, message: "分页基线单测缺失：distributeBlocks 是纯函数，改动必须同步用例" }];
      }
      if (!test.text.includes("distributeBlocks")) {
        return [{ file: test.path, line: 1, message: "分页单测未覆盖 distributeBlocks" }];
      }
      return [];
    },
  },
  {
    id: "G5",
    group: "pagination",
    title: "分页/编辑链路：禁止按章节 kind 硬编码分支",
    since: "M2",
    check(files) {
      const out = [];
      for (const path of KIND_BRANCH_FILES) {
        const file = fileByPath(files, path);
        if (!file) continue;
        const patterns = [
          new RegExp(`(?:kind|type)\\s*(?:===|!==|==|!=)\\s*["'](?:${BUILTIN_KINDS})["']`, "g"),
          new RegExp(`["'](?:${BUILTIN_KINDS})["']\\s*(?:===|!==|==|!=)\\s*(?:kind|type)`, "g"),
        ];
        for (const re of patterns) {
          for (const hit of matchCodeLines(file, re)) {
            out.push({
              file: hit.file,
              line: hit.line,
              message: `禁止硬编码 kind 分支（${hit.match}），应查章节类型插件注册表`,
            });
          }
        }
        if (path.endsWith("migrations.ts")) {
          for (const hit of matchCodeLines(file, /VALID_KINDS/g)) {
            out.push({
              file: hit.file,
              line: hit.line,
              message: "禁止用 VALID_KINDS 白名单丢弃未知 kind（未安装插件的章节数据必须保留，改查注册表）",
            });
          }
        }
      }
      return out;
    },
  },
];
