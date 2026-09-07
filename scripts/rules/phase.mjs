/**
 * 里程碑阶段与阻断升级。
 *
 * 背景：插件化是分阶段重构（M0 规则 → M1 内核 → M2 章节 → M3 语言 → M4 导出 → M5 存储）。
 * 像"禁止硬编码 kind 分支（G5）"这类规则，在 M2 完成前现有代码必然违规；
 * 若一开始就强阻断，中间态根本无法提交。因此每条规则标注 since（从哪个里程碑起生效），
 * 晚于当前阶段的规则自动降级为警告，完成里程碑后手动把 CURRENT_PHASE 前移即可升级为阻断。
 */

export const PHASES = ["M0", "M1", "M2", "M3", "M4", "M5", "M6", "M7"];

/**
 * 当前已完成阶段。推进里程碑时改这里（或临时用 STRICT_PHASE=M7 覆盖）。
 * M7 已完成：插件 manifest（src/plugins/README.md）、CODEBUDDY 插件开发指南、
 * examples/section-type-template.ts 示例模板齐备。全部里程碑 M0→M7 收口。
 */
export const CURRENT_PHASE = "M7";

/** 读取当前阶段：优先命令行/环境变量，回退到 CURRENT_PHASE 常量。 */
export function resolvePhase(env = process.env) {
  const raw = env.STRICT_PHASE;
  if (raw && PHASES.includes(raw)) return raw;
  return CURRENT_PHASE;
}

/** since 不晚于当前阶段 → 该规则强阻断；否则降级为警告。 */
export function isBlocking(since, phase) {
  const a = PHASES.indexOf(since);
  const b = PHASES.indexOf(phase);
  if (a < 0 || b < 0) return false;
  return a <= b;
}
