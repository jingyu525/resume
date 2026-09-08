/**
 * 插件启用状态（视图态）。
 *
 * 两条硬约束：
 *  - 独立键 `resume-studio:plugins:v1`，不进 resume/appearance，也不进 zundo 的
 *    partialize（规则 H1），否则"开关插件"会污染撤销历史。
 *  - 全仓库只有本模块与存储插件可以直接读写 localStorage（规则 S3）。
 *
 * 存储失败（隐私模式、配额）一律静默降级为"按 defaultEnabled 处理"，
 * 不能因为开关读写失败就阻塞编辑。
 */
const STORAGE_KEY = "resume-studio:plugins:v1";

let cache: Record<string, boolean> | null = null;

function read(): Record<string, boolean> {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    cache = parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Record<string, boolean>): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 静默：开关只影响视图，不阻塞编辑
  }
}

/** 按插件声明判断是否启用（未显式覆盖时用 defaultEnabled，缺省 true）。 */
export function isPluginEnabled(plugin: { id: string; defaultEnabled?: boolean }): boolean {
  const override = read()[plugin.id];
  return override ?? plugin.defaultEnabled ?? true;
}

export function isEnabled(id: string, fallback = true): boolean {
  return read()[id] ?? fallback;
}

export function setEnabled(id: string, enabled: boolean): void {
  write({ ...read(), [id]: enabled });
}

export function allOverrides(): Record<string, boolean> {
  return { ...read() };
}

/** 仅供测试：清空内存缓存（不触碰 localStorage）。 */
export function resetEnabledCache(): void {
  cache = null;
}

/**
 * 首用引导等 UI 偏好（视图态，独立键，不进 resume/appearance/zundo 撤销历史）。
 *
 * 与插件开关同属"视图态持久化"职责，因此收口在本模块；统一走独立键 +
 * 静默降级，符合规则 S3（localStorage 只允许存储插件与插件开关模块直接读写）。
 */
const UI_PREF_KEY = "resume-studio:ui-prefs:v1";
let uiPrefCache: Record<string, boolean> | null = null;

function readUiPrefs(): Record<string, boolean> {
  if (uiPrefCache) return uiPrefCache;
  try {
    const raw = localStorage.getItem(UI_PREF_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    uiPrefCache = parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    uiPrefCache = {};
  }
  return uiPrefCache;
}

export function getUiPref(key: string): boolean {
  return readUiPrefs()[key] ?? false;
}

export function setUiPref(key: string, value: boolean): void {
  const next = { ...readUiPrefs(), [key]: value };
  uiPrefCache = next;
  try {
    localStorage.setItem(UI_PREF_KEY, JSON.stringify(next));
  } catch {
    // 静默：引导偏好不影响编辑
  }
}
