# 插件系统（Plugin System）

简历 Studio 的全部能力——语言、联系方式字段、章节类型、主题、导出器、存储后端——都通过**同一套插件契约**扩展。内核（`plugins/core`）只负责注册表、启用状态、字典合并与类型；具体实现是插件，构建期内建在 `BUILTIN_PLUGINS`（`bootstrap.ts`）里同步注册。

> 设计取舍：采用「构建期内建注册表」而非运行时远程加载。代价是第三方插件要在此注册（或发 npm 包后由使用方注册），好处是**零供应链风险、零运行时加载、类型即契约**。

## 目录布局（category ↔ kind 必须一致，规则 A3）

```
src/plugins/
├── core/            内核：types.ts（契约）、registry.ts、enabled.ts、dict.ts
│                    ↑ 严禁反向 import 任何具体插件（规则 A2）
├── bootstrap.ts     内置插件清单 BUILTIN_PLUGINS（同步注册入口）
├── locale-packs/    语言包插件（kind: "locale-pack"）
├── basics-fields/   联系方式字段插件（kind: "basics-field"）
├── section-types/   章节类型插件（kind: "section-type"）
├── exporters/       导出器插件（kind: "exporter"）
├── storage/         存储后端插件（kind: "storage"）
└── themes/          主题插件（kind: "theme"）
```

## 契约（详见 `core/types.ts`）

每个插件都 extends `PluginBase`：`id`（kebab-case、全局唯一，C1）、`kind`、`labelKey`（须进五语字典，C2）、`version`、`defaultEnabled?`、`dict?`。

| kind | 关键字段 | 校验规则 |
| --- | --- | --- |
| `section-type` | `sectionKind` / `defaultTitle`（五语） / `fields` / `placement` / `toBlocks` / `renderBlock` / `renderEditor` | C4、C5 |
| `locale-pack` | `code`（BCP-47） / `label` / `fallback?`；`dict` 翻译核心键、不要求五语齐备 | C3、C8 |
| `basics-field` | `fieldKey` / `inputType` / `order` / `localized` / `icon?` | — |
| `exporter` | `run(ctx)`；最多一个 `default: true` | C7 |
| `storage` | `capabilities`；`remote` 则必须 `defaultEnabled: false` | C6 |
| `theme` | `cssVars`（键须 `--rs-` 前缀，禁止全局选择器） / `fonts?` | C9 |

## 自带文案（dict）规则

- 普通插件（导出/存储/章节等）的自带文案键**必须** `plugin.<id>.` 前缀（C3），且五语齐全（FR-6）。
- 语言包插件翻译的是核心 UI 键（如 `edit.*` / `sec.*`），只提供自己那一种语言的翻译，不受五语齐备约束；未译键经 `fallback` 回退（I2）。

## 启用状态

- 启用状态存 `localStorage`（仅 `enabled.ts` 可读写，规则 S3），**不进撤销历史**（H1/H2）。
- 禁用插件：其章节不渲染但数据保留（FR-9）、其语言/字段不生效、其 dict 不合并。
- 注册表未就绪（如单测未 bootstrap）时，`knownLocales` / `registeredSectionKinds` 退化为内置清单，绝不返回空集。

## 如何新增一个插件

1. 在对应 category 目录新建一个文件（**一个文件一个插件**，规则按文件解析）。
2. 实现 `PluginBase` + 该 kind 的契约字段。
3. 在 `bootstrap.ts` 的 `BUILTIN_PLUGINS` 加入（第三方插件同理）。
4. 若带 `dict`，键加 `plugin.<id>.` 前缀并确保五语齐全；界面显示名 `labelKey` 进五语字典。
5. 跑 `npm run verify:rules` 确认零阻断。

可参考 `examples/section-type-template.ts` 的复制即用模板。
