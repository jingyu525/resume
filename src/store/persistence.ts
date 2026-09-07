import type { AppearancePref } from "@/entities/appearance/model";
import type { ResumeData } from "@/entities/resume/model";
import type { PersistedState } from "@/entities/resume/persist";
import { getActiveStorage } from "@/plugins/core/registry";
import { migrate, STORAGE_VERSION } from "./migrations";

/**
 * 持久化入口：读写一律经当前启用的 StoragePlugin。
 *
 * 本模块不再直接碰 localStorage（规则 S3，由 S3b 在 M1 起强制）：
 * 换存储后端（M5 的远程实现）因此不需要改这里。
 */

/** 同步读取（store 模块初始化用）。只有本地实现提供 loadSync，远程存储走 hydrate。 */
export function loadPersisted(): { resume: ResumeData; appearance: AppearancePref } | null {
  const storage = getActiveStorage();
  const raw = storage?.loadSync?.();
  return raw ? importPersisted(raw) : null;
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

/** 写入当前启用的存储插件（由调用方防抖，NFR-2：与历史解耦） */
export async function savePersisted(state: PersistedState): Promise<void> {
  const storage = getActiveStorage();
  if (!storage) return;
  await storage.save(state);
}

export { STORAGE_VERSION };
export type { PersistedState };
