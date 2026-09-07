/**
 * A 组：架构分层与插件目录归属（FSD）。
 *
 * 依赖方向：app → pages → widgets → features → entities → shared。
 * src/plugins 是与 src/store 同级的根级生态层：被上层使用，自身不得反向依赖 pages/widgets；
 * 其中 core 是纯内核，只允许依赖 shared/entities，避免插件内核与具体业务状态耦合。
 */
import { filesUnder, matchCodeLines, importsOf, findStringValue } from "./util.mjs";

/** 反向依赖：shared / entities 不得 import 这些上层目录。 */
const UPPER_LAYERS = "(store|features|widgets|pages|plugins)";

/** 插件目录 category 白名单。 */
export const PLUGIN_CATEGORIES = [
  "core",
  "section-types",
  "basics-fields",
  "locale-packs",
  "exporters",
  "storage",
  "themes",
];

/** category → 该目录下插件文件必须声明的 kind 字面量。core 无 kind。 */
const CATEGORY_KIND = {
  "section-types": "section-type",
  "basics-fields": "basics-field",
  "locale-packs": "locale-pack",
  exporters: "exporter",
  storage: "storage",
  themes: "theme",
};

const PLUGIN_ROOT = "src/plugins/";

/** 解析插件文件所属 category，非插件文件返回 null。 */
export function categoryOf(path) {
  if (!path.startsWith(PLUGIN_ROOT)) return null;
  const rest = path.slice(PLUGIN_ROOT.length);
  const slash = rest.indexOf("/");
  return slash < 0 ? null : rest.slice(0, slash);
}

export const rules = [
  {
    id: "A1",
    group: "architecture",
    title: "架构：shared/entities 禁止反向依赖 store/features/widgets/pages/plugins",
    since: "M0",
    check(files) {
      const scoped = [...filesUnder(files, "src/shared/"), ...filesUnder(files, "src/entities/")];
      return scoped.flatMap((file) =>
        matchCodeLines(file, new RegExp(`from\\s+["']@/${UPPER_LAYERS}(/|["'])`, "g")).map(
          (hit) => ({
            file: hit.file,
            line: hit.line,
            message: `shared/entities 不得 import @/${hit.groups[0]}（依赖只能自顶向下）`,
          }),
        ),
      );
    },
  },
  {
    id: "A2",
    group: "architecture",
    title: "架构：plugins/core 只可依赖 shared/entities",
    since: "M0",
    check(files) {
      return filesUnder(files, "src/plugins/core/").flatMap((file) => [
        ...matchCodeLines(file, /from\s+["']@\/(store|features|widgets|pages)(\/|["'])/g).map(
          (hit) => ({
            file: hit.file,
            line: hit.line,
            message: `plugins/core 是纯内核，不得 import @/${hit.groups[0]}（需要 store 的逻辑请放到具体插件里）`,
          }),
        ),
        // 相对路径也要查：只查 @/ 别名会漏掉 `../storage/local` 这类写法，
        // 曾经 core/bootstrap.ts 就是这样反向依赖了具体插件。
        ...matchCodeLines(
          file,
          /from\s+["']\.\.\/(section-types|basics-fields|locale-packs|exporters|storage)/g,
        ).map((hit) => ({
          file: hit.file,
          line: hit.line,
          message: `plugins/core 不得 import 具体插件（${hit.groups[0]}）：内核会被业务实现污染，引导注册请放在 src/plugins/bootstrap.ts`,
        })),
      ]);
    },
  },
  {
    id: "A3",
    group: "plugin",
    title: "架构：插件目录 category 白名单，且 kind 须与目录一致",
    since: "M0",
    check(files) {
      const out = [];
      for (const file of filesUnder(files, PLUGIN_ROOT)) {
        const category = categoryOf(file.path);
        if (!category) {
          // src/plugins 根级文件（如 bootstrap.ts）是引导入口，不属于任何 category
          if (!file.path.slice(PLUGIN_ROOT.length).includes("/")) continue;
          out.push({
            file: file.path,
            line: 1,
            message: `插件文件必须位于 ${PLUGIN_ROOT}<category>/ 下（category: ${PLUGIN_CATEGORIES.join(" | ")}）`,
          });
          continue;
        }
        if (!PLUGIN_CATEGORIES.includes(category)) {
          out.push({
            file: file.path,
            line: 1,
            message: `未知插件目录 "${category}"，应为 ${PLUGIN_CATEGORIES.join(" | ")} 之一`,
          });
          continue;
        }
        const expected = CATEGORY_KIND[category];
        if (!expected) continue; // core 无 kind
        const actual = findStringValue(file.text, "kind");
        if (actual && actual !== expected) {
          const line =
            file.lines.findIndex((l) => /kind\s*:\s*["']/.test(l)) + 1 || 1;
          out.push({
            file: file.path,
            line,
            message: `目录 ${category}/ 下的插件 kind 应为 "${expected}"，实际为 "${actual}"`,
          });
        }
      }
      return out;
    },
  },
  {
    id: "A4",
    group: "plugin",
    title: "架构：插件不得反向依赖 pages/widgets",
    since: "M0",
    check(files) {
      return filesUnder(files, PLUGIN_ROOT).flatMap((file) =>
        importsOf(file.text)
          .filter((i) => /^@\/(pages|widgets)(\/|$)/.test(i.spec))
          .map((i) => ({
            file: file.path,
            line: file.text.slice(0, i.index).split("\n").length,
            message: `插件不得 import ${i.spec}（UI 组装层应在 widgets/pages 里消费插件，而不是反过来）`,
          })),
      );
    },
  },
];
