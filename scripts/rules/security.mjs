/**
 * S 组：安全与本地优先。
 *
 * S1 是 NFR-1 的机器化形态：核心零网络。M5 引入远程存储插件后，唯一允许出现裸 fetch 的
 * 文件是 src/plugins/core/authorizedFetch.ts（用户显式授权后的唯一网络出口），
 * 其它任何位置（包括 storage 插件自身）都只能用 authorizedFetch。
 */
import { filesUnder, productFiles, matchCodeLines } from "./util.mjs";

/** 唯一允许裸 fetch 的文件（M5 落地的授权网络出口）。 */
export const FETCH_ALLOWLIST = ["src/plugins/core/authorizedFetch.ts"];

/**
 * 允许直接使用 localStorage 的位置：
 * - src/store/persistence.ts：M1 之前的现状（M1 改造为调用 storage 插件后由 S3b 接管）
 * - src/plugins/core/enabled.ts：插件启用状态（视图态，独立键 resume-studio:plugins:v1，不进撤销历史）
 *   + 首用/导出引导等 UI 偏好（视图态，独立键 resume-studio:ui-prefs:v1，不进 resume/appearance/zundo），
 *   经 getUiPref/setUiPref 收口，组件只允许调这两个 helper，禁止直接读写 localStorage
 * - src/plugins/storage/**：存储插件实现本体（简历数据）
 */
export const STORAGE_ALLOWLIST_PREFIXES = ["src/plugins/storage/", "src/plugins/core/enabled.ts"];
const LEGACY_STORAGE_FILE = "src/store/persistence.ts";

// 富文本清洗收口点。位于 shared/ui 而非 features：章节类型插件渲染富文本也要复用它，
// 若留在 features 会形成 features → plugins → features 的循环依赖。
const INNER_HTML_ALLOWED = "src/shared/ui/editable-field.tsx";

export const rules = [
  {
    id: "S1",
    group: "security",
    title: "本地优先：仅 authorizedFetch 允许网络调用",
    since: "M0",
    check(files) {
      const out = [];
      for (const file of productFiles(files)) {
        if (FETCH_ALLOWLIST.includes(file.path)) continue;
        for (const hit of matchCodeLines(file, /\bfetch\s*\(/g)) {
          out.push({
            file: hit.file,
            line: hit.line,
            message: "禁止直接 fetch，远程访问只可经 @/plugins/core/authorizedFetch（需用户显式授权）",
          });
        }
        for (const hit of matchCodeLines(file, /XMLHttpRequest|new WebSocket/g)) {
          out.push({
            file: hit.file,
            line: hit.line,
            message: `禁止 ${hit.match}（NFR-1 本地优先，核心零网络）`,
          });
        }
      }
      return out;
    },
  },
  {
    id: "S2",
    group: "security",
    title: "安全：innerHTML / dangerouslySetInnerHTML 只许出现在 EditableField",
    since: "M0",
    check(files) {
      // 只扫产品源码：tests 里为验证清洗效果会直接写 innerHTML，属测试夹具而非产品注入点。
      return files
        .filter((f) => f.path.startsWith("src/"))
        .filter((f) => f.path !== INNER_HTML_ALLOWED)
        .flatMap((file) =>
          matchCodeLines(file, /innerHTML|dangerouslySetInnerHTML/g).map((hit) => ({
            file: hit.file,
            line: hit.line,
            message: `${hit.match} 只允许出现在 ${INNER_HTML_ALLOWED}（富文本清洗收口，NFR-3）`,
          })),
        );
    },
  },
  {
    id: "S3",
    group: "plugin",
    title: "持久化隔离：localStorage 只允许存储插件与插件开关模块",
    since: "M0",
    check(files) {
      const out = [];
      for (const file of productFiles(files)) {
        if (STORAGE_ALLOWLIST_PREFIXES.some((p) => file.path.startsWith(p))) continue;
        if (file.path === LEGACY_STORAGE_FILE) continue; // M1 前现状，由 S3b 在 M1 起接管
        // 只匹配 localStorage 的**成员访问**：插件导出的标识符常叫 localStoragePlugin，
        // 全词匹配会把它当成直接读写而误报。
        for (const hit of matchCodeLines(file, /localStorage\s*\.\s*(getItem|setItem|removeItem|clear|length|key)\b/g)) {
          out.push({
            file: hit.file,
            line: hit.line,
            message:
              "不得直接读写 localStorage：简历数据走 Store/StoragePlugin，插件开关走 plugins/core/enabled",
          });
        }
      }
      return out;
    },
  },
  {
    id: "S3b",
    group: "plugin",
    title: "持久化隔离：M1 起 store/persistence.ts 不再直接读写 localStorage",
    since: "M1",
    check(files) {
      return files
        .filter((f) => f.path === LEGACY_STORAGE_FILE)
        .flatMap((file) =>
          matchCodeLines(file, /localStorage/g).map((hit) => ({
            file: hit.file,
            line: hit.line,
            message: "M1 后持久化必须经 StoragePlugin，此处不再直接读写 localStorage",
          })),
        );
    },
  },
  {
    id: "S4",
    group: "plugin",
    title: "富文本：插件渲染富文本须复用 EditableField",
    since: "M1",
    check(files) {
      return filesUnder(files, "src/plugins/").flatMap((file) =>
        matchCodeLines(file, /dangerouslySetInnerHTML|innerHTML/g).map((hit) => ({
          file: hit.file,
          line: hit.line,
          message: "插件不得自行注入 HTML，富文本一律复用 features/inline-richtext/EditableField",
        })),
      );
    },
  },
];
