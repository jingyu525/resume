# Résumé Studio · 本地优先的简历排版工作室

> 没有设计基础，也能把简历做成"苹果专业文档级"的作品。所见即所得、A4 精确分页、五语同源。
> **全程只在你的浏览器里运行：无后端、无账号、无上传，不碰你的数据。**

[![立即使用](https://img.shields.io/badge/%E2%96%B6%20在线体验-R%C3%A9sum%C3%A9%20Studio-2563eb?style=for-the-badge)](https://jingyu525.github.io/resume/)
[![本地优先](https://img.shields.io/badge/privacy-无上传%20·%20无账号-22c55e?style=for-the-badge)]()
[![开源透明](https://img.shields.io/badge/open--source-代码公开-6b7280?style=for-the-badge)]()

![Résumé Studio 预览](./public/og-cover.png)

## 为什么是 Résumé Studio

- **零设计基础，作品级质感** —— 不用和 Word 的页边距、分页较劲，点哪改哪，实时所见即所得。
- **数据始终在你手里** —— 不联网、不收集、不上传；关掉页面就带走，清缓存就消失。
- **一次排版，五语齐发** —— 中 / 英 / 日 / 德 / 韩，界面与正文同步切换，缺语言自动回退。
- **免费、开源、透明** —— 代码公开可追溯，工程实现不黑盒。

## 在线体验

无需安装，打开即用：**https://jingyu525.github.io/resume/**

## 核心能力

- **所见即所得 + A4 精确分页**：单块内容不跨页、章节标题不孤行、底栏保护区、实时总页数、预览自动缩放。
- **就地编辑**：预览区文字点按即改；选中浮层仅 加粗 / 强调色 / 还原格式 三个动作；粘贴外部内容自动清洗，只保留语义与强调色。
- **观感四维度**：主色、版式（单栏 / 侧栏双栏）、气质（正式 / 柔和 / 活泼）、疏密滑块，一键恢复默认。
- **五语同源**：中 / 英 / 日 / 德 / 韩，界面与简历正文同步切换，缺语言自动回退。
- **本地优先**：自动保存在浏览器本地，刷新不丢；支持导出 / 导入带校验的备份文件。
- **撤销 / 重做**：连续打字合并为一步，支持 `Ctrl/Cmd+Z`、`Ctrl/Cmd+Shift+Z`、`Ctrl+Y`。
- **导出 / 保存 PDF**：一键导出 PDF 文件，无系统页脚、屏幕专属元素不上纸。

## 隐私承诺

我们不存储你的任何数据。无后端、无账号、无上传——关闭页面即带走，清除缓存即消失。这也是它区别于大多数 SaaS 简历工具的根本原因。

## 快速开始（本地开发）

```bash
npm install
npm run dev        # 本地开发（默认 http://localhost:5173）
```

- `/` —— 营销落地页
- `/editor` —— 简历编辑器

## 可用脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览生产构建产物 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | 仅类型检查 |
| `npm run test` | 运行 Vitest 测试 |

## 技术栈

Vite 7 · React 19 · TypeScript（strict）· Tailwind CSS v4 · Zustand + zundo · DOMPurify · lucide-react · Vitest

代码按 **Feature-Sliced Design** 分层：`app → pages → widgets → features → entities → shared`。
详细的分层说明、状态流与关键模块设计见 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。

## 目录概览

```
src/
├── app/        # 入口、providers(I18n/Theme/Toast)、路由、全局样式
├── pages/      # landing（营销页）、editor（编辑器）
├── widgets/    # landing-hero/features/footer、editor-toolbar、preview-pane
├── features/   # resume-editing、inline-richtext、appearance-control、language-switch、
│               # undo-redo、persistence、backup-io、pagination、print-export
├── entities/   # resume / appearance / locale 模型
├── shared/     # ui（shadcn 风格组件）、lib、types、config、i18n（五语字典）
└── store/      # Zustand store（含 zundo 撤销/重做）、迁移与持久化
tests/          # 核心纯逻辑单测：清洗 / 分页 / i18n 回退 / 撤销合并 / 迁移
```

---

Résumé Studio 是一个开源项目，欢迎 star 与贡献。示例文案与占位内容仅用于演示，请替换为你自己的信息。
