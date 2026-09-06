#!/usr/bin/env bash
# 安装 git 钩子：把 .githooks/ 下的脚本复制到 .git/hooks/ 并赋予执行权限。
# 不修改任何 git config；克隆后重新执行一次即可（npm install 会通过 prepare 自动调用）。
set -e

cd "$(dirname "$0")/.."

if [ ! -d .git ]; then
  echo "未检测到 .git 目录，跳过钩子安装"
  exit 0
fi

mkdir -p .git/hooks

installed=0
for hook in .githooks/*; do
  [ -f "$hook" ] || continue
  name=$(basename "$hook")
  cp "$hook" ".git/hooks/$name"
  chmod +x ".git/hooks/$name"
  echo "已安装钩子：$name"
  installed=$((installed + 1))
done

if [ "$installed" = "0" ]; then
  echo "未找到 .githooks/ 下的钩子脚本"
  exit 0
fi

echo "完成。紧急情况下可用 git commit --no-verify 临时绕过（不推荐）。"
