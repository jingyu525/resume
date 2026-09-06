import type { AppearancePref } from "@/entities/appearance/model";
import type { ResumeData } from "@/entities/resume/model";
import { migrate, STORAGE_VERSION, type PersistedState } from "./migrations";

const STORAGE_KEY = "resume-studio:v1";

/** 读取本地持久化数据（带迁移与异常兜底） */
export function loadPersisted(): { resume: ResumeData; appearance: AppearancePref } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return importPersisted(parsed);
  } catch {
    return null;
  }
}

/** 从已解析对象迁移为当前结构（供 store 初始化与备份导入复用） */
export function importPersisted(raw: unknown): { resume: ResumeData; appearance: AppearancePref } {
  const migrated = migrate(raw);
  return { resume: migrated.resume, appearance: migrated.appearance };
}

/** 写入本地持久化（由调用方防抖，NFR-2：与历史/写盘解耦） */
export function savePersisted(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 配额溢出等：静默失败，不阻塞编辑
  }
}

export { STORAGE_KEY, STORAGE_VERSION };
