/**
 * 章节插件共享 UI 的入口，只做 re-export；实现按职责拆到同级文件：
 *   ./parts-fields.tsx   通用表单件（LocalizedField / DateRangeFields）
 *   ./parts-preview.tsx  预览渲染块（ItemBlockView / SkillGroupBlockView）
 *   ./parts-editors.tsx  左面板编辑器（ItemsEditor / GroupsEditor / ...）
 *
 * 放在插件层而非 features 的原因不变：章节插件自带渲染与编辑能力，
 * 且插件不得反向依赖 features（否则 features → plugins → features 成环）。
 */
export { LocalizedField, DateRangeFields } from "./parts-fields";
export type { DatePatch } from "./parts-fields";
export { ItemBlockView, SkillGroupBlockView } from "./parts-preview";
export {
  ItemsEditor,
  GroupsEditor,
  ItemsSectionEditor,
  GroupsSectionEditor,
} from "./parts-editors";
