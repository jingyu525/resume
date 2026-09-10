import type { AppearancePref } from "@/entities/appearance/model";
import type { ResumeData } from "@/entities/resume/model";
import type { PersistedState } from "@/entities/resume/persist";
import { getActiveStorage } from "@/plugins/core/registry";
import { trackError, trackErrorOnce } from "@/shared/analytics/analytics";
import { migrate, STORAGE_VERSION } from "./migrations";

/**
 * 持久化入口：读写一律经当前启用的 StoragePlugin。
 *
 * 本模块不再直接碰 localStorage（规则 S3，由 S3b 在 M1 起强制）：
 * 换存储后端（M5 的远程实现）因此不需要改这里。
 */

/** 上一次同步读取的失败原因（数据损坏 / 存储不可用）。null 表示正常。 */
let lastLoadError: unknown = null;

/**
 * 同步读取（store 模块初始化用）。只有本地实现提供 loadSync，远程存储走 hydrate。
 *
 * 读取或迁移失败一律降级为「无数据」，绝不让异常冒到调用方：
 * main.tsx 里 hydrateFromPersisted() 抛出会导致后续 createRoot 不执行，
 * 用户看到的是整页白屏——连一行错误提示都渲染不出来。
 */
export function loadPersisted(): { resume: ResumeData; appearance: AppearancePref } | null {
  lastLoadError = null;
  try {
    const storage = getActiveStorage();
    const raw = storage?.loadSync?.();
    return raw ? importPersisted(raw) : null;
  } catch (err) {
    lastLoadError = err;
    // 数据打不开会被用户误认为「简历被清空」，必须能在线上被看见
    trackError("load");
    return null;
  }
}

/**
 * 上次同步读取是否失败（本地数据损坏或存储不可用）。
 *
 * UI 据此明确告知用户：否则「数据打不开」会被误认为「简历被清空」，
 * 用户会以为自己的内容凭空消失了。
 */
export function loadError(): unknown {
  return lastLoadError;
}

/**
 * 异步回填：给远程存储插件使用（M5）。
 * @param apply 写回 store 的回调（传进来避免本模块反向依赖 store 造成循环引用）
 * @param hasSyncData 同步路径是否已读到数据（本地插件时无需重复应用）
 */
export async function hydrateFromStorage(
  apply: (resume: ResumeData, appearance: AppearancePref) => void,
): Promise<boolean> {
  const storage = getActiveStorage();
  if (!storage) return false;
  // 支持同步读取的本地存储已在 store 初始化时加载完成，无需重复回填
  if (storage.loadSync) return false;
  try {
    const raw = await storage.load();
    if (!raw) return false;
    const { resume, appearance } = importPersisted(raw);
    apply(resume, appearance);
    return true;
  } catch {
    return false; // 远程不可用不阻塞使用
  }
}

/** 从已解析对象迁移为当前结构（供 store 初始化与备份导入复用） */
export function importPersisted(raw: unknown): { resume: ResumeData; appearance: AppearancePref } {
  const migrated = migrate(raw);
  return { resume: migrated.resume, appearance: migrated.appearance };
}

/**
 * 写入当前启用的存储插件（由调用方防抖，NFR-2：与历史解耦）。
 *
 * @returns 是否真的写盘成功。失败必须如实返回：
 * 调用方据此保留「未保存」标记，退出拦截才能继续兜住未落盘的内容。
 */
export async function savePersisted(state: PersistedState): Promise<boolean> {
  const storage = getActiveStorage();
  // 没有可用存储 = 没存上，不能当成成功
  if (!storage) {
    trackErrorOnce("save", "no-storage");
    return false;
  }
  let ok = false;
  try {
    ok = await storage.save(state);
  } catch {
    ok = false;
  }
  // 写盘失败 = 内容没落盘（隐私模式 / 配额溢出），用户却以为已保存。
  // 自动保存高频触发，故每会话只报一次，避免刷屏污染看板。
  if (!ok) trackErrorOnce("save");
  return ok;
}

export { STORAGE_VERSION };
export type { PersistedState };
