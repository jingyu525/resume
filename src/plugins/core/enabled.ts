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
