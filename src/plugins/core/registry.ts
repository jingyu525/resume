import type { Plugin, PluginKind } from "./types";
import type {
  BasicsFieldPlugin,
  ExporterPlugin,
  LocalePackPlugin,
  SectionTypePlugin,
  StoragePlugin,
  ThemePlugin,
} from "./types";
import { isPluginEnabled } from "./enabled";

/**
 * 插件注册表（构建期内建，同步注册）。
 *
 * 用 Map 按 `kind:id` 索引，查询 O(1)。重复注册直接抛错——插件 id 冲突属于开发期错误，
 * 静默覆盖会让"哪个插件生效"变得不可预测。
 */
const store = new Map<string, Plugin>();

function keyOf(kind: PluginKind, id: string): string {
  return `${kind}:${id}`;
}

export function register(plugin: Plugin): void {
  const key = keyOf(plugin.kind, plugin.id);
  if (store.has(key)) {
    throw new Error(`插件重复注册：${key}（id 必须全局唯一）`);
  }
  store.set(key, plugin);
}

export function getPlugin(kind: PluginKind, id: string): Plugin | undefined {
  return store.get(keyOf(kind, id));
}

export function hasPlugin(kind: PluginKind, id: string): boolean {
  return store.has(keyOf(kind, id));
}

export function listPlugins(kind?: PluginKind): Plugin[] {
  const all = [...store.values()];
  return kind ? all.filter((p) => p.kind === kind) : all;
}

function enabledOf<K extends PluginKind>(kind: K): Extract<Plugin, { kind: K }>[] {
  return listPlugins(kind)
    .filter((p): p is Extract<Plugin, { kind: K }> => p.kind === kind)
    .filter((p) => isPluginEnabled(p));
  // 不排序：注册顺序即呈现顺序（章节插件的默认顺序由 bootstrap 里的注册次序决定），
  // 若按 id 排序会让"自我评价排在最后"这类体验问题难以修正。
}

export function listSectionTypes(): SectionTypePlugin[] {
  return enabledOf("section-type");
}

export function listBasicsFields(): BasicsFieldPlugin[] {
  return enabledOf("basics-field").sort((a, b) => a.order - b.order);
}

export function listExporters(): ExporterPlugin[] {
  return enabledOf("exporter");
}

export function listStoragePlugins(): StoragePlugin[] {
  return enabledOf("storage");
}

export function listLocalePacks(): LocalePackPlugin[] {
  return enabledOf("locale-pack");
}

/** 已启用的主题插件（M6：主题可插件安装）。 */
export function listThemes(): ThemePlugin[] {
  return enabledOf("theme");
}

/** 按 id 取主题插件（未安装/已禁用返回 undefined，调用方降级为默认 classic）。 */
export function getTheme(id: string): ThemePlugin | undefined {
  return listThemes().find((p) => p.id === id);
}

/** 按章节 kind 取插件（未安装/已禁用返回 undefined，调用方据此降级而非崩溃）。 */
export function getSectionType(sectionKind: string): SectionTypePlugin | undefined {
  return listSectionTypes().find((p) => p.sectionKind === sectionKind);
}

/**
 * 已注册的章节 kind（供 migrate 判断"未知 kind"用）。
 * 与 knownLocales 同构：注册表未就绪时调用方必须退化为内置清单，绝不返回空集。
 */
export function registeredSectionKinds(): string[] {
  return listSectionTypes().map((p) => p.sectionKind);
}

/** 取默认导出插件（规则 C7 保证最多一个）。 */
export function getDefaultExporter(): ExporterPlugin | undefined {
  return listExporters().find((p) => p.default);
}

/**
 * 取当前生效的存储插件：默认取第一个启用的（local 为内置默认实现）。
 * 没有可用实现时返回 undefined，调用方应降级为"不持久化"而不是崩溃。
 */
export function getActiveStorage(): StoragePlugin | undefined {
  return listStoragePlugins()[0];
}

/** 已注册语言码（含内置五语与新增语言包），供 migrate 过滤未知语言用。 */
export function registeredLocales(): string[] {
  return listLocalePacks().map((p) => p.code);
}

/** 仅供测试：清空注册表。 */
export function clearRegistry(): void {
  store.clear();
}
