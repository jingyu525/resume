# Résumé Studio · 架构设计文档

> 本地优先、所见即所得的简历排版工作室（纯前端）。本文档说明技术选型、Feature-Sliced Design 分层、状态流与关键模块设计，作为 `需求文档.md` 的工程落地事实来源。

## 1. 设计哲学

严格遵循 React 官方 [Thinking in React](https://react.dev/learn/thinking-in-react)：以"简历内容"为**单一真源（single source of truth）**，状态自顶向下流动，编辑面板、预览区、打印共用同一份处理后的数据，从架构上杜绝双份不一致。UI 由 `props`/`store` 驱动渲染，交互（就地编辑、撤销/重做、导入导出）最终都归结为对单一 store 的更新。

## 2. 技术栈

- 构建：Vite 7 + React 19 + TypeScript 6（strict）
- 样式：Tailwind CSS v4（CSS-first，`@theme` 设计令牌）+ 自实现 shadcn 风格组件
- 状态：Zustand 5 + zundo（temporal 中间件，撤销/重做）
- 富文本：原生 `contentEditable` + DOMPurify 清洗（见 §5.3 选型说明）
- 图标：lucide-react（不使用 emoji）
- 测试：Vitest + @testing-library/react
- 质量：ESLint（typescript-eslint）、Prettier、`tsc --noEmit`、Vitest
- 工程底座：纯前端、本地优先、零后端依赖（NFR-1 / NFR-6）

## 3. Feature-Sliced Design 分层

依赖方向自顶向下、严禁反向引用：`app → pages → widgets → features → entities → shared`。

```
src/
├── app/                 # 初始化：providers(I18n/Theme/Toast)、router、全局样式与入口
├── pages/               # 路由页：landing（营销）、editor（编辑器）
├── widgets/             # 组合区块：landing-hero/features/footer、editor-toolbar/preview-pane
├── features/            # 用户可感知能力（高内聚、可独立演进）
│   ├── resume-editing/      # 章节/条目 CRUD、拖拽排序、隐藏、改标题、填充示例、清空
│   ├── inline-richtext/     # 就地编辑、浮层 3 动作、粘贴清洗（EditableField）
│   ├── appearance-control/  # 主色/版式/气质/疏密 → 版面数值翻译
│   ├── language-switch/     # 五语切换 UI + 同源切换
│   ├── undo-redo/           # 撤销/重做按钮 + 快捷键 + zundo 合并
│   ├── persistence/         # localStorage 自动保存 + 版本迁移订阅
│   ├── backup-io/           # 导出/导入备份 JSON + schema 校验
│   ├── pagination/          # A4 测量-分配引擎（distribute 纯函数 + PaginatedResume）
│   └── print-export/        # 系统打印触发
├── entities/            # 业务实体模型：resume / appearance / locale
├── shared/              # 跨层基础设施：ui(shadcn 风格)、lib、types、config、i18n
└── store/               # 全局 store（Zustand + zundo）、迁移、持久化
```

`shared` 不依赖任何上层；`entities` 仅依赖 `shared`；`features` 依赖 `entities`+`shared`+`store`；`widgets` 组合 `features`；`pages` 组合 `widgets`。

## 4. 状态流

`useResumeStore` 把 `resume`、`appearance`、`locale` 集中为单一 store（单一真源）。`resume` 与 `appearance` 进入 zundo temporal 的历史；`locale` 通过 `partialize` 排除在撤销历史之外，且用 `equality` 比较引用，确保仅界面语言切换**不**产生历史步（FR-10）。

状态更新路径：

```
用户交互 → store action（不可变更新 resume/appearance）→ Zustand 通知订阅者
        ├─ 编辑面板 / 预览区 重渲染（同一份数据）
        ├─ persistence 订阅（防抖 600ms）写入 localStorage（NFR-2，与历史解耦）
        └─ zundo temporal（防抖 400ms 合并连续打字）记录历史
```

## 5. 关键模块设计

### 5.1 撤销/重做（FR-10）
`zundo` 的 `handleSet` 用 400ms 防抖包裹：连续打字被合并为一步；`equality` 仅比较 `resume`/`appearance` 引用，界面语言切换不入栈。快捷键 `Ctrl/Cmd+Z`、`Ctrl/Cmd+Shift+Z`、`Ctrl+Y` 与按钮行为一致。

### 5.2 A4 精确分页引擎（FR-7）
分页被拆为**纯函数** `distributeBlocks(blocks, heights, contentHpx)` 与 React 组件 `PaginatedResume`：
1. `buildBlocks` 将简历转为有序**原子块**（每条经历、章节标题为不可拆单元；标题与首条组成防孤行组 `keepWithNext`）。
2. 隐藏的"测量层"以真实页面宽度渲染全部块，`useLayoutEffect` + `document.fonts.ready` 取得各块真实高度（`offsetHeight`），字体加载完成后重算（防抖重排、光标不丢）。
3. `distributeBlocks` 把块分配到固定内容高度（`297mm − 2×页边距 − 底栏保护区`）的 A4 页：放不下整块移到下一页（单块不跨页）；`keepWithNext` 标题与首块一并判断换页（标题不孤行）。
4. 预览区随容器宽度自动缩放（`transform: scale`，见 `PreviewPane`），实时显示总页数。

> 版式：单栏全内容在正文；侧栏双栏时基本信息+自我评价+技能进侧栏（每页重复），其余经历类在主栏分页。

### 5.3 富文本就地编辑与安全（FR-3 / NFR-3）
`EditableField` 基于 `contentEditable`：预览区文字点按即编辑；选中浮层仅 **加粗 / 强调色 / 还原格式** 三个感知级动作（`document.execCommand('bold')` 与自实现 `wrapEmphasis`/`unwrapEmphasis`）。
所有进入 store 的 HTML 经 `sanitizeRichText` 清洗（DOMPurify，仅允许 `p/br/strong/em/span`，`span` 仅允许 `rs-em` 类名，移除全部 `style` 与 `on*` 事件、危险标签），**集中收口**在 `shared/lib/sanitize`，杜绝 XSS。粘贴外部内容自动清洗，纯文本粘贴保留分段。编辑/预览/打印共用同一份处理后文档。

### 5.4 多语言同源切换与回退（FR-6）
UI 文案由 `shared/i18n/dictionaries` 五语（中/英/日/德/韩）字典驱动；简历正文字段建模为 `Localized<T> = Partial<Record<Locale,T>>`。切换语言时 UI 文案与正文显示同步切换，读取走回退链 `当前 → 默认(zh) → 任一已有`，缺语言也能出片。`formatPeriod` 处理"至今"随语言。

### 5.5 外观四直觉维度（FR-5）
`resolveResumeTheme(appearance)` 将**主色 / 版式 / 气质 / 疏密**翻译为具体 CSS 变量（页边距、字号、行高、区块间距、字体族、标题字重），预览与打印共用，实现"选感觉而非选参数"。一键恢复默认。

### 5.6 持久化与备份（FR-9）

**唯一结构**：`PersistedState { version, resume, appearance }`（`entities/resume/persist.ts`）。本地存储、导出备份、导入恢复共用这一份，不存在第二种格式。

- **存储**：`localStorage` 键 `resume-studio:v1`，由存储插件收口（规则 S3：全仓库仅存储插件与 `plugins/core/enabled.ts` 可直连 localStorage）。
- **版本**：`STORAGE_VERSION = 2`（v1→v2 补齐章节/条目的插件扩展字段 `fields`）。注意键名里的 `v1` 是命名空间，与数据版本号无关。
- **写盘**：`persistence` 订阅 store，防抖 600ms，与撤销历史解耦。

**导入/导出走同一条迁移**：导出 = 当前 `{version, resume, appearance}` 序列化为 JSON 文件；导入 = `JSON.parse` → `validateBackup`（粗校验）→ 与冷启动恢复**同一个** `migrate` → `loadState`。因此导入对损坏数据的容错能力与冷启动完全一致。

**模板 / 示例 / 主题不是数据，是生成数据的代码**：`createEmptyResume` / `createSampleResume` / `createRoleResume(role)` 与主题 `preset` 都在运行时物化成 `resume`/`appearance` 之后才落库。持久化**只存结果、不存来源**——备份文件里不会留下"用了哪个模板"的痕迹。

由此产生四条硬约束（改动持久化前务必回到本节）：

1. **备份自包含**：不依赖任何模板代码，换设备、换版本都能打开。
2. **主题只存 id**：真正决定观感的是 `preset` 展开后的四轴值；目标环境未安装该主题插件时退化为默认，观感会变但不崩溃。
3. **未知章节 kind 不删**（数据安全红线）：章节 kind 是唯一"指向代码"的字段。未安装插件时必须保留数据、渲染跳过、编辑区提示缺插件，**绝不静默丢弃**（FR-9 升级不丢数据）。
4. **语言字段按"已注册语言"过滤**：用注册表而非固定清单，避免新装语言包写入的内容被清洗掉。

全程无后端、无账号、无上传。

### 5.7 打印导出（FR-8）
`print-export` 调用默认导出器（pdf-generate，一键导出 PDF 文件）；`globals.css` 的 `@page A4` 与 `.print-area`/`.no-print` 规则保证仅输出 A4 页面，屏幕专属元素不上纸。

## 6. 安全约束落实（NFR-3）
- 富文本唯一清洗入口在 `shared/lib/sanitize`，全应用统一调用。
- 强调色用 CSS 类 `rs-em`（经 `var(--rs-accent)` 着色），绝不内联 `style`，避免样式注入。
- DOMPurify 钩子强制 `span` 仅允许 `rs-em` 类，其余 `class` 清空。

## 7. 可访问性（NFR-4）
语义化结构、关键控件有 `aria-label`/`title`、`contentEditable` 声明 `role="textbox"`/`aria-multiline`，键盘可达（Tab/撤销快捷键）。

## 8. 测试与质量
- Vitest 覆盖核心纯逻辑：`sanitize`（XSS 清洗）、`distributeBlocks`（单块不跨页/标题不孤行）、`i18n` 回退链、`undo-merge`（连续打字合并、语言不进历史、撤销恢复）、`migrations`（损坏数据/非法语言/校验）。
- 提交门槛：`tsc --noEmit`、`vite build`、`eslint .`、`vitest run` 均通过。

## 9. 与计划的技术偏差（已决策）
- **富文本引擎**：计划用 TipTap(ProseMirror)。为降低依赖风险、保证构建稳定，并满足"编辑/预览/打印共用同一份文档"的强约束，改用原生 `contentEditable` + DOMPurify 的轻量实现，能力（加粗/强调/还原/粘贴清洗/就地编辑）完整覆盖 FR-3。
- **shadcn/ui**：未运行 shadcn CLI（避免网络与版本耦合），改为等价的 shadcn 风格组件（`shared/ui`：button/input/slider/dialog/dropdown/tabs/toast/switch/card），基于 Tailwind v4 设计令牌。
- **侧栏双栏**：侧栏内容每页重复，主栏分页；侧栏自身不额外分页（满足"侧栏每页重复出现"）。

## 10. 运行

```bash
npm install
npm run dev        # 本地开发
npm run build      # 类型检查 + 生产构建
npm run lint       # ESLint
npm run test       # Vitest
```

启动后访问 `/` 为营销落地页，`/editor` 为编辑器。
