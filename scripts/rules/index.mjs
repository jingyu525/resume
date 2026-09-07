/**
 * 规则注册表：统一导出全部规则，供 CLI 调度器与自检测试共用。
 *
 * 每条规则形如 { id, group, title, since, check(files, ctx) -> Violation[] }：
 *  - id     ：守护标识，报错与测试都引用它
 *  - group  ：architecture | security | pagination | i18n | quality | plugin
 *  - since  ：从哪个里程碑起强阻断（见 phase.mjs）
 *  - check  ：纯函数，不读盘，返回 { file, line, message }[]
 */
import { rules as architectureRules } from "./architecture.mjs";
import { rules as securityRules } from "./security.mjs";
import { rules as paginationRules } from "./pagination.mjs";
import { rules as pluginContractRules } from "./plugin-contract.mjs";
import { rules as stateRules } from "./state.mjs";
import { rules as i18nRules } from "./i18n-hardcode.mjs";
import { rules as qualityRules } from "./quality.mjs";

export const rules = [
  ...architectureRules,
  ...securityRules,
  ...paginationRules,
  ...pluginContractRules,
  ...stateRules,
  ...i18nRules,
  ...qualityRules,
];

export const GROUPS = {
  architecture: "架构分层",
  security: "安全与本地优先",
  pagination: "分页契约",
  plugin: "插件契约",
  i18n: "国际化",
  quality: "代码质量",
};

export function ruleById(id) {
  return rules.find((r) => r.id === id);
}

export { PHASES, CURRENT_PHASE, resolvePhase, isBlocking } from "./phase.mjs";
