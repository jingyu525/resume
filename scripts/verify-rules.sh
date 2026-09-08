#!/usr/bin/env bash
# 架构与安全规则校验（调度器）。
# 单独运行：npm run verify:rules   /   bash scripts/verify-rules.sh [--phase=M2]
# 由 .githooks/pre-commit 自动调用，任一环节失败即阻断提交。
#
# 规则本体在 scripts/rules/*.mjs（纯函数、可被单测 import），本脚本只负责调度：
#   1) node scripts/run-rules.mjs           —— A/S/G/C/H/I/E 各组规则（含阶段升级判定）
#   2) node scripts/verify-i18n-keys.mjs    —— i18n key 定义与五语完整性（I2）
# 两者都是 Node 实现，不再依赖 rg，避免"未安装 rg 就静默跳过检查"。
set -uo pipefail

cd "$(dirname "$0")/.."

# LandingPage 展示区已接入五语（数据驱动样例简历），I1 硬编码中文检查转为强阻断
export I18N_BLOCKING=1

fails=0

echo "──── 规则校验 ────"

if command -v node >/dev/null 2>&1; then
  node scripts/run-rules.mjs "$@" || fails=$((fails + 1))
  echo
  node scripts/verify-i18n-keys.mjs || fails=$((fails + 1))
else
  echo "✗ 未安装 node，无法执行规则校验"
  fails=$((fails + 1))
fi

echo
echo "──── 结果 ────"
if [ "$fails" -gt 0 ]; then
  echo "阻断：${fails} 组规则未通过（详见上方 ✗ 条目）"
  exit 1
fi
echo "通过：0 条阻断"
exit 0
