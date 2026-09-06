# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## 强制规则（MUST / MUST NOT）

改动落盘或提交前逐条自查。每条都可在仓库内用命令验证，括号内即自查方式。

**架构分层（FSD）**
- MUST NOT 让 `shared/` 或 `entities/` import `store/` `features/` `widgets/` `pages/`。（`rg -n 'from "@/(store|features|widgets|pages)' src/shared src/entities` 必须为 0 命中）
- MUST NOT 让 `features/` 之间横向互相 import；跨模块复用上提到 `shared/`，或经 `store/` 解耦。
- MUST 把新的可复用 UI 原语放进 `shared/ui/`，业务能力放进对应 `features/<name>/`。

**安全（NFR-3）**
- MUST 只通过 `sanitizeRichText`（`shared/lib/sanitize.ts`）与 `sanitizePlain`（定义在 `EditableField.tsx` 内）处理富文本；MUST NOT 在其他任何文件给 `innerHTML` 赋值。（`rg -ln 'innerHTML' src/` 必须只输出 `src/features/inline-richtext/EditableField.tsx`）
- MUST NOT 删除 `EditableField` 渲染侧的 `toSafeHtml()` 清洗——编辑面板 Textarea 会向 store 写入原始 HTML，这是最后一道安全网。
- MUST NOT 用内联 `style` 表达强调色，只使用 `rs-em` 类配合 `var(--rs-accent)`。
- MUST 让新增的可编辑文本字段复用 `EditableField`，不要自建 `contentEditable`。

**本地优先（NFR-1）**
- MUST NOT 引入 `fetch` / `XMLHttpRequest` / WebSocket / 第三方 SDK / 任何 AI 接口。（`rg -n 'fetch\(|XMLHttpRequest|new WebSocket' src/` 必须为 0）
- MUST NOT 新增或保留"云端同步""多端登录""团队协作"类文案。

**分页契约（FR-7）**
- MUST 保持 JS 与 CSS 两侧边距一致：改 `pageMarginMm()`、`SAFE_ZONE_MM` 或 `A4` 尺寸时，必须同步 `globals.css` 里 `.rs-doc` 的 padding 与 `PaginatedResume` 的 `contentHpx` 计算。
- MUST NOT 去掉分页块包裹元素的 `display: flow-root`（用于把子元素外边距计入 `offsetHeight`，去掉会导致分页静默算错）。
- MUST 保持 `distributeBlocks` 为纯函数并维持单测；分页算法改动必须同步更新 `tests/pagination.test.ts`。

**单一真源与撤销（FR-10）**
- MUST NOT 在组件内用局部 state 镜像 `resume` / `appearance`，这会破坏编辑区、预览、打印三者一致。
- MUST 把新的"视图态"字段（语言、面板开关等）排除出 zundo 的 `partialize` / `equality`，否则会污染撤销历史。
- MUST NOT 绕过 store 直接读写 `localStorage`。

**国际化（FR-6）**
- MUST 把新增 UI 文案同时加入 `shared/i18n/dictionaries.ts` 的**全部 5 个语言**（zh/en/ja/de/ko）；MUST NOT 在 JSX 里硬编码界面文案。（`rg -n '\p{Han}' src --glob '*.tsx' | rg -v dictionaries` 后逐条确认，**注释之外**的中文即为违规）
- MUST 用 `useI18n().t()` 取文案；注意 `translate(locale, key, params)` 第一个参数是 locale。
- MUST 让新的简历正文字段使用 `Localized<T>` 并经 `localizedValue` 读取，以继承回退链。
- MUST 让承载界面文案的定宽/单行控件可收缩或省略：tab / 菜单项 / 导航 / 工具条标签用 `.i18n-truncate`（单行省略 + `title` 完整文本），不写死固定宽度把长译文（德/日/韩）挤出压住相邻元素；可换行的卡片标题用 `.i18n-clamp-2`。全局已对 `button`/`a`/`[role=tab]`/`[role=menuitem]` 设 `min-width:0` 允许收缩。

**UI / 样式 / 打印**
- MUST 只用 `lucide-react` 作图标，MUST NOT 用 emoji 充当 UI 图标或装饰。（`rg -n '[\p{Emoji_Presentation}]' src/` 必须为 0）
- MUST 给新增的屏幕专属元素加 `no-print`；需要上纸的新内容 MUST 放在 `.print-area` 内。
- MUST 用真 `<button>` / `<input>` 承载交互，不要用 div 模拟。

**持久化兼容（FR-9）**
- MUST 在修改 `ResumeData` / `AppearancePref` 结构时同步 `store/migrations.ts` 的 `normalize*` 逻辑，保证旧数据不报错、不丢。
- MUST 让导入路径先过 `validateBackup()` 校验。

**质量门槛**
- MUST 在交付/提交前让 `npm run build`、`npm run lint`、`npm run test` 全部通过；MUST NOT 提交未通过的代码。
- MUST NOT 用 `@ts-ignore` 绕过类型错误；`as any` 需就地注释理由；未使用的参数用 `_` 前缀。
- MUST 为新增/修改的纯逻辑（`distribute`、`sanitize`、`migrate`、`localized`、`translate`）补充或更新 Vitest 用例；含 JSX 的测试文件必须用 `.tsx` 后缀。

## 强制校验钩子

上述规则由 git 钩子**自动执行**，不依赖自觉遵守。

- `.githooks/pre-commit` — 依次执行 `verify:rules` → `typecheck` → `lint` → `test`，任一失败即**阻断提交**。
- `.githooks/pre-push` — 执行 `build`（含 `tsc -b` + `vite build`），失败即阻断推送。
- `scripts/verify-rules.sh` — 规则校验本体（分层依赖 / innerHTML 收口 / 禁止网络调用 / 禁止 emoji / i18n 硬编码），可单独运行：`npm run verify:rules`。

钩子脚本版本化在 `.githooks/`，安装方式为复制到 `.git/hooks/`（**不修改任何 git config**）：

```bash
npm run hooks:install     # 手动安装
npm install               # 通过 prepare 脚本自动安装
```

克隆仓库后需重新执行一次安装。紧急绕过用 `git commit --no-verify`（不推荐，会被 review 拦下）。

当前 i18n 硬编码检查为**警告**而非阻断（`I18N_BLOCKING=0`），因为 `LandingPage.tsx` 展示区仍有中文示例内容待接入五语。修复后把 `scripts/verify-rules.sh` 的 `I18N_BLOCKING` 默认值改为 `1` 即转为强阻断。

## Commands

- `npm run dev` — 启动 Vite 开发服务器（默认 http://localhost:5173）。`/` 为营销落地页，`/editor` 为编辑器。使用 BrowserRouter，Vite 已做 SPA 回退，直接访问 `/editor` 可用。

- `npm run build` — 先跑 `tsc -b` 项目引用类型检查，再执行 `vite build`。两者必须都通过才算出交付成功；`tsc -b` 会生成 `*.tsbuildinfo`（已 gitignore）。

- `npm run lint` — ESLint 9 flat config（`eslint.config.js`）。当前基线为 **0 error、2 warning**（`react-refresh/only-export-components`，来自 `shared/ui/toast.tsx` 与 `features/undo-redo/UndoRedo.tsx` 同时导出组件与 hook）。新增 warning 可接受，新增 error 不可接受。

- `npm run typecheck` — 仅 `tsc -b --noEmit`。注意开启了 `noUnusedLocals` / `noUnusedParameters`：未使用的导入与参数会让构建失败，临时变量请用 `_` 前缀。

- `npm run test` — `vitest run`，jsdom 环境，共 22 个用例。跑单个文件：`npx vitest run tests/pagination.test.ts`；跑单个用例：`npx vitest run -t "标题不孤行"`。测试文件若含 JSX 必须用 `.tsx` 后缀（否则 esbuild 转换失败）。

- `npm run test:watch` — Vitest 监听模式，改纯函数（`distribute`、`sanitize`、`migrations`）时最省事。

## Architecture

### 产品定位与硬约束

Résumé Studio 是**纯前端、本地优先**的简历排版工作室：无后端、无账号、无上传。任何引入网络请求、云端同步、AI 代写的改动都与定位冲突（PRD 明确列为"表达禁区"）。数据只存在于 `localStorage`（键名 `resume-studio:v1`），关闭页面即带走。

### 分层与依赖方向

按 **Feature-Sliced Design** 分层，依赖只能自顶向下：

`app → pages → widgets → features → entities → shared`

`shared` 与 `entities` **严禁** import `store` / `features` / `widgets`（已核查目前干净，请保持）。`store/` 是 FSD 之外的根级目录，被 features、widgets、pages 使用，但它自身不反向依赖上层。

### 单一真源

`src/store/useResumeStore.ts` 持有全部状态：`resume`、`appearance`、`locale`。**编辑面板、A4 预览、打印输出三者读同一份 store**，不存在第二份副本——这是"编辑区与预览/打印共用同一份处理后富文本"的架构保证。改任何显示问题，先确认是渲染问题还是 store 数据问题，不要引入局部 state 镜像。

### 预览区即编辑器（最关键的一处耦合）

`features/pagination/BlockView.tsx` 渲染的每个文本节点都是 `features/inline-richtext/EditableField.tsx`（`contentEditable`），它直接调用 store 的 `updateItemDesc` / `updateItemLocalized` / `renameSection` 等 action。因此**预览不是只读渲染，而是主编辑入口**；左编辑面板主要负责结构（增删改排序、隐藏、改标题、日期）。

`EditableField` 是**非受控**的：只在外部值变化且元素未聚焦时才回写 `innerHTML`，否则会吞掉用户输入、丢光标（NFR-2）。改这个文件要格外小心同步逻辑。

### A4 分页：测量 → 分配 两阶段

`features/pagination/` 是本项目最复杂的部分：

1. `buildBlocks.ts` 把简历转为有序**原子块**。章节标题带 `keepWithNext`，这是"标题不孤行"的实现依据。侧栏版式时，`basics` + `summary` + `skills` 进 `sidebar`（每页重复、自身不分页），其余经历类进 `main` 参与分页。
2. `PaginatedResume.tsx` 渲染一个**隐藏测量层**（`left:-99999px`，宽度与真实页完全一致），用 refs Map 收集每块 `offsetHeight`，在 `requestAnimationFrame` + `document.fonts.ready` 后重排（字体加载会改变高度）。
3. `distribute.ts` 的 `distributeBlocks(blocks, heights, contentHpx)` 是**纯函数**（已单测），负责把块分配到固定内容高度的 A4 页。

几个跨文件、容易踩的耦合点：

- 可用内容高度 = `297mm − 2×页边距 − SAFE_ZONE_MM`，其中页边距由 `shared/config/presets.ts` 的 `pageMarginMm(density)` 算出，而 `.rs-doc` 的内边距在 `src/app/styles/globals.css` 里用同一组 CSS 变量。**改边距/保护区必须同时改 JS 与 CSS，否则测量与实际渲染错位。**
- 毫米转像素用 `MM = 96 / 25.4`，与 CSS 的 96dpi 假设绑定。
- 每个块的包裹元素是 `display: flow-root`，用于建立 BFC 把子元素外边距包进 `offsetHeight`。去掉它，测量高度会漏掉块间外边距，分页会算错。

### 外观四维度 → 版面数值

用户在 `features/appearance-control` 只选"感觉"（主色/版式/气质/疏密），由 `presets.ts` 的 `resolveResumeTheme()` 翻译成 CSS 变量（`--rs-accent`、`--rs-margin`、`--rs-font-size`、`--rs-line-height`、`--rs-gap` 等），被 `.rs-*` 样式类消费。预览与打印共用同一套变量。疏密滑块同时影响页边距和字号行高，因此会触发分页重算。

### i18n：两套并行机制

- **界面文案**：`shared/i18n/dictionaries.ts` 五语（中/英/日/德/韩）字典，经 `app/providers/I18nProvider.tsx` 注入 context。
- **简历正文**：字段建模为 `Localized<T> = Partial<Record<Locale, T>>`，读取走 `shared/lib/localized.ts` 的回退链 **当前 → 默认 zh → 任一已有**，缺语言也能出片。

切换语言时二者同源联动。注意 `translate(locale, key, params)` 的**第一个参数是 locale**（不是 key），这里容易写反。

### 撤销/重做语义

`zundo` 的 `partialize` 只跟踪 `{ resume, appearance }`，并配了 `equality` 比较引用，确保**界面语言切换不进历史**。连续打字通过 `handleSet` 的 400ms 防抖合并为一步。副作用：最后一次击键后 400ms 内按撤销，该步可能尚未入栈。测试必须用 fake timers 并手动 `advanceTimersByTime`。

### 持久化与迁移

`features/persistence/useAutoSave.ts` 订阅 store 防抖 600ms 写盘，与历史解耦（NFR-2）。`store/migrations.ts` 的 `migrate()` 对损坏/旧数据兜底补全，并剔除非法语言字段；`validateBackup()` 校验导入文件。改数据结构要同步考虑旧数据兼容（FR-9：升级不丢数据、不报错）。

### 富文本清洗收口（安全）

`shared/lib/sanitize.ts` 是唯一清洗入口（DOMPurify，仅允许 `p/br/strong/em/span`，`span` 只允许 `rs-em` 类，剥离全部 `style` 与 `on*`）。强调色用 CSS 类经 `var(--rs-accent)` 着色，**绝不内联 style**。

`EditableField` 在**两处**清洗：输入时 `emit()` 清洗后入 store，渲染时 `toSafeHtml()` 再清洗一次。第二处是安全网——因为左编辑面板的富文本 Textarea 会把原始内容直接写进 store，若只剩输入侧清洗，该路径可绕过。维护时不要删掉渲染侧清洗。

### 打印

`features/print-export` 调用 `window.print()`。打印样式集中在 `globals.css`：`@page { size: A4 }`，配合 `.print-area`（上纸）与 `.no-print`（不上纸）两个类，用 `visibility` 切换。新增屏幕专属 UI（浮层、提示、工具条）记得加 `no-print`。

### 样式

Tailwind **v4**，CSS-first：`@theme` 设计令牌与深浅色变量都定义在 `globals.css`，**没有 tailwind.config.js**。深色由 `ThemeProvider` 依据 `prefers-color-scheme` 在 `<html>` 上切换 `.dark` 类。图标用 `lucide-react`，不用 emoji。

路径别名 `@/*` → `src/*`，在 `vite.config.ts` 与 `tsconfig.app.json` 中各自配置，新增配置需同步两处。

### 与计划的技术偏差

原计划用 TipTap 与 shadcn CLI，实际改为：原生 `contentEditable` + DOMPurify（降低依赖风险、保证构建稳定），以及手写的 shadcn 风格组件（`shared/ui`，无 Radix）。侧栏双栏的侧栏内容每页重复、自身不分页。详见 `ARCHITECTURE.md`。
