/**
 * 源码遍历。规则模块本身不读盘，由调度器（scripts/run-rules.mjs）把文件读好传进来；
 * 测试里则可以用 fixture 直接构造 files 数组。
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".codebuddy",
  ".next",
  ".turbo",
]);

const DEFAULT_EXTS = /\.(ts|tsx|mjs|css)$/;

/** 列出目录下的源码文件（绝对路径，已排序）。 */
export function listFiles(rootDir, { exts = DEFAULT_EXTS } = {}) {
  if (!existsSync(rootDir)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (IGNORED_DIRS.has(entry)) continue;
      const abs = join(dir, entry);
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(abs);
      else if (exts.test(entry)) out.push(abs);
    }
  };
  walk(rootDir);
  return out.sort();
}

/**
 * 读取目录下的源码文件为 { path, abs, text, lines }。
 * path 为相对 rootDir 的 posix 路径，规则里统一按这个前缀判断归属。
 */
export function readSourceFiles(rootDir, opts) {
  return listFiles(rootDir, opts).map((abs) => {
    const text = readFileSync(abs, "utf8");
    return {
      path: relative(rootDir, abs).split(sep).join("/"),
      abs,
      text,
      lines: text.split(/\r?\n/),
    };
  });
}

/**
 * 读取项目若干顶层目录（src / tests / scripts），path 统一为相对项目根的 posix 路径，
 * 这样规则里能用 "src/shared/"、"tests/" 这类前缀判断归属。
 */
export function readProjectFiles(root, dirs = ["src", "tests", "scripts"]) {
  const out = [];
  for (const dir of dirs) {
    for (const file of readSourceFiles(join(root, dir))) {
      out.push({ ...file, path: `${dir}/${file.path}` });
    }
  }
  return out;
}

/** 测试用：把 { path, text } 直接包装成规则需要的 file 对象。 */
export function fileOf(path, text) {
  return { path, abs: path, text, lines: text.split(/\r?\n/) };
}
