---
name: resume-studio-frontend-build
overview: 基于 PRD 用最新技术栈（Vite + React 19 + TypeScript 6 + Tailwind v4 + shadcn/ui）从零搭建 Résumé Studio 纯前端项目，按 Feature-Sliced Design 分层，完整实现 11 项功能，本机验证构建与 lint 通过后交付可下载项目代码 + 架构设计文档。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Apple HIG
    - Premium Minimalism
    - Glassmorphism
    - Clean
    - Soft Shadow
    - Rounded Corners
    - Light & Dark
    - Micro-interaction
  fontSystem:
    fontFamily: Inter, PingFang SC
    heading:
      size: 32px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 16px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#1D4ED8"
      - "#0EA5E9"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
      - "#0B0B0F"
    text:
      - "#0F172A"
      - "#F8FAFC"
      - "#64748B"
    functional:
      - "#16A34A"
      - "#DC2626"
      - "#D97706"
      - "#2563EB"
todos:
  - id: scaffold-fsd
    content: 用 [skill:modern-web-app] 初始化项目并搭建 FSD 目录与工程配置（ESLint/Vitest/ts strict）
    status: completed
  - id: entities-shared
    content: 实现 entities 与 shared：resume/appearance/locale 模型、五语字典、shadcn 封装、sanitize/measure 工具、预设常量
    status: completed
    dependencies:
      - scaffold-fsd
  - id: store-state
    content: 用 [skill:fe-coding-expert] 落地 Zustand store + zundo 撤销合并 + localStorage 持久化迁移 + 备份导入导出
    status: completed
    dependencies:
      - entities-shared
  - id: editor-features
    content: 实现编辑功能：章节条目 CRUD/拖拽、TipTap 就地富文本+清洗、外观四维度、语言切换
    status: completed
    dependencies:
      - store-state
  - id: pagination-print
    content: 实现 A4 测量-分配分页引擎、预览多页渲染与缩放、系统打印导出
    status: completed
    dependencies:
      - store-state
  - id: pages-ui
    content: 用 [skill:ui-ux-pro-max] 与 [skill:lucide-icons] 组装落地页与编辑器页，完成响应式与深浅色
    status: completed
    dependencies:
      - editor-features
      - pagination-print
  - id: docs-test-verify
    content: 编写 ARCHITECTURE.md 与 Vitest 单测，跑通 build/lint/test；用 [subagent:architect-review] 与 [subagent:code-reviewer] 审查
    status: completed
    dependencies:
      - pages-ui
---

## 产品概述

本地优先、所见即所得的"Résumé Studio 简历工作室"纯前端应用——让无设计基础的用户也能把简历做成苹果专业文档级的作品。无后端、无账号、无上传，全程仅运行在用户浏览器中。本次按 PRD 完整实现全部 11 项功能，并交付可下载项目代码与架构设计文档。

## 核心功能

- 营销落地页（FR-1）：独立首页，含双语 Hero、6 个特性卡、"为什么不是 Word/Markdown/纯 AI"痛点区、编辑器展示区、工程底座背书、底部 CTA 与隐私承诺；响应式 + 深浅色自动切换。
- 简历编辑器（FR-2）：桌面左编辑面板 + 右 A4 实时预览；移动端底部 Tab 切换编辑/预览，默认进预览。顶栏含撤销/重做/主色/外观/更多/打印。
- 富文本就地编辑（FR-3）：预览区文字点按即编辑；选中浮层仅加粗/强调色/还原格式三动作；粘贴自动清洗外部排版，编辑/预览/打印共用同一份处理后富文本。
- 内容组织（FR-4）：内容与观感概念分离，文字字段全多语言，时间字段与语言无关，默认空白占位 + 填充示例。
- 外观四维度（FR-5）：主色（精选专业色）、版式（单栏/侧栏双栏）、气质（正式/柔和/活泼）、疏密（滑块）；一键恢复默认。
- 五语 i18n（FR-6）：中/英/日/德/韩界面与正文同源切换，缺语言按 默认→任一已有 回退。
- A4 精确分页（FR-7）：离散多页、统一页边距+底栏保护区、单块不跨页、标题不孤行、防抖重排、实时总页数、自动缩放。
- 打印导出（FR-8）：系统打印另存 PDF，矢量文字可选中，屏幕专属元素不上纸。
- 持久化与备份（FR-9）：localStorage 自动保存、向前兼容迁移、导出/导入备份带校验。
- 撤销/重做（FR-10）：全局、合并连续打字为一步、快捷键与按钮一致、合理步数上限。
- 更多菜单（FR-11）：导入/导出/填充示例/清空（二次确认）/语言切换，结果轻量 toast。
- 安全（NFR-3）：富文本展示前清洗防 XSS，仅允许安全语义标签与强调色，DOM/系统交互集中收口。

## 技术栈选择

- 构建：Vite 7 + React 19 + TypeScript 6（strict）
- 样式：Tailwind CSS v4 + shadcn/ui（React 19 适配）
- 状态：Zustand + zundo（temporal 中间件，撤销/重做）
- 富文本：TipTap（ProseMirror）+ DOMPurify（粘贴清洗）
- 图标：lucide-react（不使用 emoji）
- 测试：Vitest + @testing-library/react
- 校验/质量：ESLint（typescript-eslint）、Prettier、tsc --noEmit
- 工程底座：纯前端、本地优先、零后端依赖，遵循 NFR-1/NFR-6

## 实现方案

整体遵循 React "Thinking in React" 哲学：以简历内容为单一真源（single source of truth），状态自顶向下流动，编辑面板与预览/打印均渲染同一份处理后数据，避免双份不一致。按 Feature-Sliced Design 分层，使功能高内聚、可独立演进。

状态层用 Zustand 把简历内容、外观、语言集中为单一 store（符合单一真源与可预测数据流）；撤销/重做用 zundo 的 temporal 中间件，并以 handleSet + 节流（约 400ms）合并连续打字为一步，满足 FR-10；自动保存与历史解耦（NFR-2），写盘放到非阻塞时机。

富文本用 TipTap 实现所见即所得就地编辑，自定义 marks（bold、emphasis color、reset format），粘贴时经 DOMPurify 清洗仅保留语义标签与强调色（满足 NFR-3 与 FR-3）。预览区即编辑区，编辑/预览/打印共用同一文档实例。

分页采用"测量-分配"引擎：将内容切为原子块（每条经历、章节标题为不可拆块；标题与首条组成防孤行组），先用隐藏测量容器取得真实高度（含字体加载完成事件触发重算），再分配到固定内容高度的 A4 页（297mm − 页边距 − 底栏保护区）；编辑输入防抖重排避免光标丢失。打印用 CSS `@page A4` 与打印专用样式隐藏屏幕元素。

i18n 用轻量 context + 五语 JSON 字典驱动 UI；简历正文字段建模为 `Record<Locale, T>`，切换语言时 UI 文案与正文显示同步切换，读取走缺语言回退链（当前→默认→任一已有）。持久化用版本化 localStorage schema + 迁移函数保证向前兼容；导出/导入为带 schema 校验的 JSON。

## 架构设计（Feature-Sliced Design）

```mermaid
flowchart TD
  app[app: providers / router / globals] --> pages[pages: landing / editor]
  pages --> widgets[widgets: editor-shell / toolbar / edit-panel / preview-pane / appearance-panel / landing-*]
  widgets --> features[features: resume-editing / inline-richtext / appearance-control / language-switch / undo-redo / persistence / backup-io / pagination / print-export]
  features --> entities[entities: resume / appearance / locale]
  entities --> shared[shared: ui(shadcn) / lib / types / config / i18n]
```

## 目录结构

```
resume-studio/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js / prettier.config.mjs
├── vitest.config.ts
├── README.md                 # [NEW] 启动/构建/测试说明与隐私承诺
├── ARCHITECTURE.md           # [NEW] FSD 分层、状态流、关键模块设计、选型理由
├── src/
│   ├── app/
│   │   ├── main.tsx           # [NEW] 入口，挂载 providers 与 router
│   │   ├── App.tsx            # [NEW] 路由 + 全局 Provider 组装
│   │   ├── router.tsx         # [NEW] landing / editor 路由
│   │   ├── providers/
│   │   │   ├── StoreProvider.tsx     # [NEW] Zustand store 注入
│   │   │   ├── I18nProvider.tsx       # [NEW] 语言 context + 回退
│   │   │   └── ThemeProvider.tsx      # [NEW] 深浅色（跟随系统）
│   │   └── styles/globals.css        # [NEW] Tailwind v4 入口 + 设计令牌 + 打印样式
│   ├── pages/
│   │   ├── landing/LandingPage.tsx   # [NEW] 营销落地页组装
│   │   └── editor/EditorPage.tsx     # [NEW] 编辑器页组装（桌面/移动布局）
│   ├── widgets/
│   │   ├── landing-hero/ LandingHero.tsx        # [NEW] Hero + 双 CTA + 隐私徽标
│   │   ├── landing-features/ LandingFeatures.tsx# [NEW] 6 特性卡 + "为什么不是"区
│   │   ├── landing-footer/ LandingFooter.tsx    # [NEW] 底部 CTA + 隐私承诺
│   │   ├── editor-shell/ EditorShell.tsx        # [NEW] 整体布局（桌面双栏/移动 Tab）
│   │   ├── editor-toolbar/ EditorToolbar.tsx    # [NEW] 顶栏：撤销/重做/主色/外观/更多/打印
│   │   ├── edit-panel/ EditPanel.tsx            # [NEW] 基本信息卡 + 动态章节列表
│   │   ├── preview-pane/ PreviewPane.tsx        # [NEW] A4 多页渲染 + 缩放 + 总页数
│   │   └── appearance-panel/ AppearancePanel.tsx# [NEW] 四维度外观控制
│   ├── features/
│   │   ├── resume-editing/   # [NEW] 章节/条目 CRUD、拖拽排序、隐藏、改标题、填充示例、清空
│   │   ├── inline-richtext/  # [NEW] TipTap 就地编辑、浮层 3 动作、粘贴清洗
│   │   ├── appearance-control/# [NEW] 主色/版式/气质/疏密 → 版面数值翻译
│   │   ├── language-switch/  # [NEW] 语言切换 UI + 同源切换
│   │   ├── undo-redo/        # [NEW] 撤销/重做按钮 + 快捷键 + zundo 合并
│   │   ├── persistence/      # [NEW] localStorage 自动保存 + 版本迁移
│   │   ├── backup-io/        # [NEW] 导出/导入备份 JSON + 校验
│   │   ├── pagination/       # [NEW] A4 测量-分配引擎（纯函数，可单测）
│   │   └── print-export/     # [NEW] 系统打印触发 + 打印样式收口
│   ├── entities/
│   │   ├── resume/           # [NEW] 简历内容模型、类型、多语言字段结构
│   │   ├── appearance/       # [NEW] 外观偏好模型（版式/主色/气质/疏密）
│   │   └── locale/           # [NEW] Locale 枚举与类型
│   ├── shared/
│   │   ├── ui/               # [NEW] shadcn 组件封装（button/dialog/tabs/slider/toast 等）
│   │   ├── lib/              # [NEW] cn、sanitize（DOMPurify）、measure、id 工具
│   │   ├── types/            # [NEW] 共享类型
│   │   ├── config/           # [NEW] 主色/气质/版式预设、疏密映射、A4 常量
│   │   └── i18n/             # [NEW] 五语字典（zh/en/ja/de/ko）+ 回退函数
│   └── store/
│       ├── useResumeStore.ts # [NEW] Zustand store（resume/appearance/locale 切片 + zundo）
│       └── selectors.ts      # [NEW] 派生选择器
└── tests/
    ├── sanitize.test.ts      # [NEW] 富文本清洗/XSS 防护
    ├── pagination.test.ts    # [NEW] 单块不跨页/标题不孤行
    ├── i18n-fallback.test.ts # [NEW] 五语回退链
    ├── undo-merge.test.ts    # [NEW] 连续打字合并为一步
    └── migration.test.ts     # [NEW] 旧版本数据迁移兼容
```

## 关键代码结构

```ts
// 简历内容模型（entities/resume）：内容与语言解耦
type Locale = 'zh' | 'en' | 'ja' | 'de' | 'ko';
type RichText = { type: 'doc'; content: unknown[] }; // TipTap JSON
type Localized<T> = Partial<Record<Locale, T>>;       // 缺语言走回退
interface ResumeSection {
  id: string; kind: 'summary'|'experience'|'project'|'education'|'skills';
  title: Localized<string>; visible: boolean; order: number;
  items: ResumeItem[];
}
interface AppearancePref { layout: 'single'|'sidebar'; accent: string; tone: 'formal'|'soft'|'lively'; density: number; }
```

## 实现要点（执行备注）

- 性能：分页重排、自动保存均防抖；历史与写盘解耦。测量用隐藏容器 + ResizeObserver，避免编辑中被覆盖（NFR-2）。
- 安全：所有富文本经 DOMPurify 清洗且仅允许 bold/emphasis-color/段落，集中收口在 shared/lib/sanitize。
- 质量：严格 TS、ESLint、Vitest 覆盖核心纯逻辑；构建与 lint 必须通过再交付。
- 兼容：localStorage schema 带 version 字段与迁移函数，升级不丢数据不报错（FR-9）。

## 设计风格

采用 Apple HIG 启发的高端极简（Premium Minimalism）风格，叠加克制的 Glassmorphism 玻璃质感与柔和阴影、圆角，传达"苹果专业文档级"的信任与精致。整体浅色为主、深色自动跟随系统，留白充足、栅格清晰、微交互顺滑（hover 抬升、卡片淡入、CTA 渐变）。

## 落地页（LandingPage）

- 顶部导航栏：左品牌标识（Résumé Studio）+ 右语言切换、代码仓库链接、立即体验入口；玻璃半透明、滚动吸附。
- Hero 区：居中双语主标语"把简历做成一件作品 / Craft a résumé like a pro document"、副标语、双 CTA（立即体验 / 查看代码）、隐私徽标（本地优先·零上传）。
- 功能亮点区：6 张特性卡（两列/三列网格），逐条对应核心优势，hover 微动效与图标描边发光。
- "为什么不是…"区：三栏对照 Word / Markdown / 纯 AI 的痛点，用对比卡片呈现。
- 编辑器展示区：A4 预览风格截图占位卡片 + 缩放投影。
- 工程底座区：纯前端 / 本地优先 / 开源 信任背书小卡。
- 底部导航/页脚：底部 CTA + 隐私承诺文案，深色玻璃条。

## 编辑器页（EditorPage）

- 顶栏（Toolbar）：左品牌、撤销/重做、主色快捷（宽屏）、外观、更多、最右打印；桌面横向，移动收起为图标。
- 左编辑面板：基本信息卡（姓名/职位/电话/邮箱/城市/微信/网站）+ 动态章节列表（可拖拽排序、隐藏、改标题、增删条目）。
- 右 A4 预览：离散多页、统一页边距、底栏保护区、章节标题不孤行、自动缩放、实时总页数；文字点按即就地编辑。
- 外观面板：主色色板、版式（单栏/侧栏双栏）、气质档位、疏密滑块、一键恢复默认。
- 移动端：底部 Tab 切换"编辑 / 预览"，默认进入预览；更多菜单浮层含导入/导出/填充示例/清空。

## 字体系统

以 Inter（拉丁）与 PingFang SC（中文）为主，标题加粗、正文舒适行高，跨设备打印一致。

## Agent Extensions

### Skill

- **modern-web-app**
- Purpose: 初始化 Vite + React 19 + TypeScript 6 + Tailwind v4 + shadcn/ui 项目骨架与工程配置。
- Expected outcome: 生成可运行的基础项目（package.json、vite/ts/eslint 配置、shadcn 组件入口），作为 FSD 分层落地的基座。
- **ui-ux-pro-max**
- Purpose: 生成落地页与编辑器的设计系统（色彩、字体、间距、组件规范），保证深浅色一致与高端质感。
- Expected outcome: 输出与 Apple HIG / Glassmorphism 风格一致的设计令牌与组件规范，供 UI 实现遵循。
- **lucide-icons**
- Purpose: 检索并下载顶栏、特性卡、章节列表等所需 lucide 图标（SVG/React 组件），不使用 emoji。
- Expected outcome: 产出统一的 24x24 图标资源，覆盖撤销/重做/打印/语言/拖拽等场景。
- **fe-coding-expert**
- Purpose: 以"实现者/架构师"角色落地 FSD 分层代码、状态流与关键模块（分页引擎、富文本清洗、撤销合并），并给出权衡与验证。
- Expected outcome: 符合 PRD 与 Thinking in React 哲学的高可维护代码，含选型理由与验证说明。

### SubAgent

- **architect-review**
- Purpose: 在结构落地后审查分层一致性、SOLID 与 FSD 边界，避免跨层违规。
- Expected outcome: 给出架构一致性结论与修正建议，确保 app→pages→widgets→features→entities→shared 不越界。
- **code-reviewer**
- Purpose: 代码完成后审查质量、安全（XSS 清洗收口）、可访问性与测试覆盖。
- Expected outcome: 输出缺陷清单与修复项，确保 build/lint/测试通过且安全约束满足。