import type { PersistedState } from "@/entities/resume/persist";
import type { StoragePlugin } from "@/plugins/core/types";

const STORAGE_KEY = "resume-studio:v1";

/**
 * 本地存储插件（默认）。
 *
 * 全仓库只有本模块与 `plugins/core/enabled.ts` 允许直接读写 localStorage（规则 S3）：
 * 其它模块想持久化必须经 StoragePlugin，这样"换存储后端"才真的只是一行切换。
 *
 * 读写失败（隐私模式、配额溢出）一律静默：存储失败不能阻塞编辑。
 */
function readSync(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

export const localStoragePlugin: StoragePlugin = {
  id: "storage-local",
  kind: "storage",
  labelKey: "storage.local",
  version: 1,
  defaultEnabled: true,
  capabilities: { remote: false, requiresAuth: false },

  loadSync: readSync,

  async load() {
    return readSync();
  },

  async save(state: PersistedState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      // 配额溢出 / 隐私模式：如实返回失败，由调用方提示用户。
      // 绝不静默成功——那会让用户以为已保存，实际内容没落盘。
      return false;
    }
  },

  async clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 同上
    }
  },
};
