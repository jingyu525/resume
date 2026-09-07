/**
 * E 组：代码质量与风格红线。
 *
 * E1 用 Node 正则实现，不再依赖 rg —— 原 bash 实现在未安装 rg 时会静默跳过 emoji 检查，
 * 等于规则失效；迁到 Node 后全平台行为一致。
 */
import { matchCodeLines, matchLines, importsOf, productFiles } from "./util.mjs";

/** 允许使用的图标来源。 */
const ALLOWED_ICON_LIB = "lucide-react";

/** 已知图标库黑名单（项目只用 lucide-react）。 */
const FORBIDDEN_ICON_LIBS = [
  "@heroicons",
  "react-icons",
  "react-feather",
  "@ant-design/icons",
  "@phosphor-icons",
  "@tabler/icons",
  "bootstrap-icons",
  "@fortawesome",
];

// 用显式码点范围而非 \p{Emoji_Presentation}：部分 Node 构建（精简 ICU）不支持 Unicode
// 属性转义，校验脚本必须跨机器一致。
// 只取真正的彩色 emoji 区 U+1F000–U+1FAFF 与变体选择符 U+FE0F：刻意不含 U+2600–U+27BF
// （✓ ✕ ⚠ ★ 等装饰符号，Emoji_Presentation=No），否则会把这些常用标记误判成 emoji。
const EMOJI = new RegExp("[\\uFE0F\\u{1F000}-\\u{1FAFF}]", "gu");

/** 只校验产品源码：scripts/ 与 tests/ 里的符号与字符串不属 UI 文案。 */
const isProductSource = (file) => file.path.startsWith("src/");

export const rules = [
  {
    id: "E1",
    group: "quality",
    title: "UI：禁止 emoji 作为图标或装饰",
    since: "M0",
    check(files) {
      return files.filter(isProductSource).flatMap((file) =>
        matchCodeLines(file, EMOJI).map((hit) => ({
          file: hit.file,
          line: hit.line,
          message: `禁止 emoji（${hit.match}），图标请用 lucide-react`,
        })),
      );
    },
  },
  {
    id: "E2",
    group: "quality",
    title: "UI：图标只许来自 lucide-react",
    since: "M0",
    check(files) {
      const out = [];
      for (const file of productFiles(files)) {
        for (const i of importsOf(file.text)) {
          if (FORBIDDEN_ICON_LIBS.some((lib) => i.spec.startsWith(lib))) {
            out.push({
              file: file.path,
              line: file.text.slice(0, i.index).split("\n").length,
              message: `图标库只允许 ${ALLOWED_ICON_LIB}，发现 ${i.spec}`,
            });
          }
        }
      }
      return out;
    },
  },
  {
    id: "E3",
    group: "quality",
    title: "质量：禁止 @ts-ignore 绕过类型错误",
    since: "M0",
    check(files) {
      // 注意用 matchLines 而非 matchCodeLines：@ts-ignore 本身就写在注释里，
      // 若按"跳过注释行"扫描，这条规则会永远抓不到任何东西。
      return productFiles(files).flatMap((file) =>
        matchLines(file, /@ts-ignore/g).map((hit) => ({
          file: hit.file,
          line: hit.line,
          message: "禁止 @ts-ignore；确需断言请用 as 并就地注释理由",
        })),
      );
    },
  },
];
