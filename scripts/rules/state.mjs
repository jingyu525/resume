/**
 * H 组：状态与撤销历史（FR-10 / 单一真源）。
 *
 * 插件启用状态属"视图态"：必须走 plugins/core/enabled 的独立键，
 * 一旦混进 resume/appearance 或 zundo 的 partialize，撤销历史会被语言/开关切换污染。
 */
import { matchCodeLines, filesUnder } from "./util.mjs";

const STORE_FILE = "src/store/useResumeStore.ts";

export const rules = [
  {
    id: "H1",
    group: "plugin",
    title: "状态：插件启用状态不得进入撤销历史（zundo partialize）",
    since: "M1",
    check(files) {
      const out = [];
      for (const file of files) {
        if (file.path !== STORE_FILE) continue;
        for (const hit of matchCodeLines(file, /partialize\s*:/g)) {
          // 取 partialize 之后 200 字符窗口判断跟踪字段
          const idx = file.text.indexOf("partialize");
          const window = file.text.slice(idx, idx + 200);
          if (/\bplugins\b/.test(window)) {
            out.push({
              file: hit.file,
              line: hit.line,
              message: "partialize 不得跟踪 plugins 状态：插件开关属视图态，须排除在撤销历史之外",
            });
          }
        }
      }
      return out;
    },
  },
  {
    id: "H2",
    group: "plugin",
    title: "状态：插件不得直接访问时间旅行状态",
    since: "M1",
    check(files) {
      return filesUnder(files, "src/plugins/").flatMap((file) =>
        matchCodeLines(file, /\.temporal\b|useTemporalStore/g).map((hit) => ({
          file: hit.file,
          line: hit.line,
          message: "插件不应直接操作撤销/重做时间旅行状态（撤销只跟踪 resume/appearance）",
        })),
      );
    },
  },
];
