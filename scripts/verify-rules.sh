#!/usr/bin/env bash
# 架构与安全规则校验。
# 单独运行：npm run verify:rules   /   bash scripts/verify-rules.sh
# 由 .githooks/pre-commit 自动调用，任何一条失败即阻断提交。
set -uo pipefail

cd "$(dirname "$0")/.."

# i18n 硬编码是否阻断提交：0=仅警告，1=阻断。
# TODO: LandingPage 展示区示例内容接入五语文案后，改为 1 使其强阻断。
I18N_BLOCKING="${I18N_BLOCKING:-0}"

fails=0
warns=0

HAS_RG=0
if command -v rg >/dev/null 2>&1; then HAS_RG=1; fi

search() {
  if [ "$HAS_RG" = "1" ]; then
    rg -n "$@" 2>/dev/null || true
  else
    grep -rEn "$@" 2>/dev/null || true
  fi
}

files_with() {
  if [ "$HAS_RG" = "1" ]; then
    rg -l "$@" 2>/dev/null || true
  else
    grep -rlE "$@" 2>/dev/null || true
  fi
}

# 期望"零命中"的规则
expect_clean() {
  local name="$1"
  shift
  local out
  out=$(search "$@")
  if [ -n "$out" ]; then
    echo "✗ ${name}"
    echo "$out"
    fails=$((fails + 1))
  else
    echo "✓ ${name}"
  fi
}

echo "──── 规则校验 ────"

# 1. FSD：shared / entities 不得反向依赖上层
expect_clean "架构：shared/entities 禁止反向依赖 store/features/widgets/pages" \
  'from "@/(store|features|widgets|pages)' src/shared src/entities

# 2. 安全：innerHTML 只允许出现在 EditableField.tsx（清洗收口）
OUT=$(files_with 'innerHTML' src)
ALLOWED="src/features/inline-richtext/EditableField.tsx"
VIOL=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ "$f" = "$ALLOWED" ] || VIOL="${VIOL}${f}"$'\n'
done <<<"$OUT"
if [ -n "$VIOL" ]; then
  echo "✗ 安全：innerHTML 只允许出现在 ${ALLOWED}"
  printf '%s' "$VIOL"
  fails=$((fails + 1))
else
  echo "✓ 安全：innerHTML 仅出现在 ${ALLOWED}"
fi

# 3. 本地优先：禁止任何网络调用
expect_clean "本地优先：禁止 fetch / XMLHttpRequest / WebSocket" \
  'fetch\(|XMLHttpRequest|new WebSocket' src

# 4. UI：禁止 emoji（需 rg，grep 不支持 unicode 属性则跳过）
if [ "$HAS_RG" = "1" ]; then
  expect_clean "UI：禁止 emoji 作为图标或装饰" '[\p{Emoji_Presentation}]' src
else
  echo "- UI：emoji 检查已跳过（未安装 rg）"
fi

# 5. i18n：禁止硬编码中文界面文案（注释除外）
if [ "$HAS_RG" = "1" ]; then
  HAN=$(
    rg -n '\p{Han}' src --glob '*.tsx' 2>/dev/null |
      rg -v 'dictionaries' |
      rg -v '(//|/\*|\*)' || true
  )
  if [ -n "$HAN" ]; then
    if [ "$I18N_BLOCKING" = "1" ]; then
      echo "✗ 国际化：以下非注释中文疑似硬编码界面文案"
      echo "$HAN"
      fails=$((fails + 1))
    else
      echo "⚠ 国际化：以下非注释中文疑似硬编码界面文案（当前仅警告，I18N_BLOCKING=1 可阻断）"
      echo "$HAN"
      warns=$((warns + 1))
    fi
  else
    echo "✓ 国际化：无硬编码界面文案"
  fi
fi

# 6. i18n key 完整性：引用 key 必须定义且五语齐全（t() 缺失会静默回退成 key 原文）
if command -v node >/dev/null 2>&1; then
  if ! node scripts/verify-i18n-keys.mjs; then
    fails=$((fails + 1))
  fi
else
  echo "- i18n key 校验已跳过（未安装 node）"
fi

echo "──── 结果 ────"
if [ "$fails" -gt 0 ]; then
  echo "阻断：${fails} 条规则未通过${warns:+（另有 ${warns} 条警告）}"
  exit 1
fi
echo "通过：0 条阻断${warns:+，${warns} 条警告}"
exit 0
