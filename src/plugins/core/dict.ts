import { dictionaries as coreDictionaries } from "@/shared/i18n/dictionaries";
import { listPlugins } from "./registry";
import { isPluginEnabled } from "./enabled";

/**
 * 字典合并：核心字典 + 启用的插件自带文案。
 *
 * 合并顺序：核心字典 → 语言包 dict（新增语言） → 插件 dict。
 * 插件键强制 plugin.<id>. 前缀（规则 C3），因此不会与核心键互相覆盖。
 * 只在启动时构建一次并缓存，避免每次 t() 都遍历插件（性能要点）。
 */
export type Dict = Record<string, string>;

let cache: Record<string, Dict> | null = null;

export function buildDictionaries(): Record<string, Dict> {
  const merged: Record<string, Dict> = {};
  for (const [locale, dict] of Object.entries(coreDictionaries)) {
    merged[locale] = { ...dict };
  }
  for (const plugin of listPlugins()) {
    if (!isPluginEnabled(plugin)) continue;
    for (const [locale, dict] of Object.entries(plugin.dict ?? {})) {
      merged[locale] = { ...(merged[locale] ?? {}), ...dict };
    }
  }
  return merged;
}

/** 取合并后的字典（首次调用时构建并缓存）。 */
export function getDictionaries(): Record<string, Dict> {
  if (!cache) cache = buildDictionaries();
  return cache;
}

/** 插件启用状态变化后调用，重建缓存。 */
export function invalidateDictionaries(): void {
  cache = null;
}
