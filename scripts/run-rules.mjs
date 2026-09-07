#!/usr/bin/env node
/**
 * 规则调度器（由 scripts/verify-rules.sh 调用，也可单独运行）。
 *
 *   node scripts/run-rules.mjs                 # 跑全部规则，按当前阶段判定阻断
 *   node scripts/run-rules.mjs --only=plugin   # 只跑插件相关规则（npm run verify:plugins）
 *   node scripts/run-rules.mjs --phase=M2      # 以 M2 已完成的标准判定
 *   node scripts/run-rules.mjs --json          # 机器可读输出
 *
 * 退出码：存在阻断级违规为 1，否则 0。
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rules, GROUPS, resolvePhase, isBlocking } from "./rules/index.mjs";
import { readProjectFiles } from "./rules/walk.mjs";
import { loadCoreDictionaries } from "./rules/dictionary.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function argValue(name) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

const only = argValue("only"); // plugin | core
const asJson = args.includes("--json");
const phaseArg = argValue("phase");
const phase = resolvePhase(phaseArg ? { STRICT_PHASE: phaseArg } : process.env);

// 只扫描 src 与 tests：scripts/ 是校验工具自身，里面必然含有 "fetch(" / "innerHTML" /
// "localStorage" / "✓" 等被检测的字面量，纳入扫描会产生自指假阳性。
const files = readProjectFiles(ROOT, ["src", "tests"]);
const ctx = { root: ROOT, dict: loadCoreDictionaries(ROOT) };

function isSelected(rule) {
  if (only === "plugin") return rule.group === "plugin";
  if (only === "core") return rule.group !== "plugin";
  return true;
}

const results = [];
for (const rule of rules.filter(isSelected)) {
  let violations = [];
  let error = null;
  try {
    violations = rule.check(files, ctx) ?? [];
  } catch (e) {
    error = e;
  }
  const blocking = isBlocking(rule.since, phase);
  const envBlocks = Boolean(rule.blockingByEnv && process.env[rule.blockingByEnv] === "1");
  const severity = rule.severity === "warn" && !envBlocks ? "warn" : "error";
  results.push({ rule, violations, error, blocking, severity });
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        phase,
        files: files.length,
        results: results.map((r) => ({
          id: r.rule.id,
          group: r.rule.group,
          title: r.rule.title,
          since: r.rule.since,
          blocking: r.blocking,
          severity: r.severity,
          violations: r.violations,
          error: r.error ? String(r.error.message ?? r.error) : null,
        })),
      },
      null,
      2,
    ),
  );
} else {
  let currentGroup = null;
  for (const r of results) {
    if (r.rule.group !== currentGroup) {
      currentGroup = r.rule.group;
      console.log(`\n【${GROUPS[currentGroup] ?? currentGroup}】`);
    }
    if (r.error) {
      console.log(`✗ ${r.rule.id} ${r.rule.title}`);
      console.log(`  规则自身执行失败：${r.error.message ?? r.error}`);
      continue;
    }
    if (r.violations.length === 0) {
      const tag = r.blocking && r.severity === "error" ? "✓" : "✓";
      const note = r.blocking ? "" : `（since ${r.rule.since}，当前阶段仅警告）`;
      console.log(`${tag} ${r.rule.id} ${r.rule.title}${note}`);
      continue;
    }
    const icon = r.blocking && r.severity === "error" ? "✗" : "⚠";
    console.log(`${icon} ${r.rule.id} ${r.rule.title}`);
    for (const v of r.violations.slice(0, 20)) {
      console.log(`    ${v.file}:${v.line}  ${v.message}`);
    }
    if (r.violations.length > 20) {
      console.log(`    …另有 ${r.violations.length - 20} 条`);
    }
  }
}

const blockingFails = results.filter(
  (r) => r.violations.length > 0 && r.blocking && r.severity === "error",
);
const warns = results.filter(
  (r) => r.violations.length > 0 && !(r.blocking && r.severity === "error"),
);

if (!asJson) {
  console.log("\n──── 结果 ────");
  console.log(
    `阶段 ${phase} ｜ 规则 ${results.length} 条 ｜ 扫描 ${files.length} 个文件 ｜ 阻断 ${blockingFails.length} 条${warns.length ? ` ｜ 警告 ${warns.length} 条` : ""}`,
  );
  if (blockingFails.length > 0) {
    console.log(`阻断规则：${blockingFails.map((r) => r.rule.id).join(", ")}`);
  }
}
process.exit(blockingFails.length > 0 ? 1 : 0);
