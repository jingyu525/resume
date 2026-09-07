import type { PersistedState } from "@/entities/resume/persist";
import type { StoragePlugin } from "@/plugins/core/types";

/**
 * 示范远程存储插件（默认禁用，需配置 token）。
 *
 * 证明「存储可插件安装」：与本地存储走同一套 StoragePlugin 契约（M5）。
 * 真实实现应替换为 `fetch` 调用你的后端 / GitHub Gist / 云存储 SDK；
 * 这里用 `localStorage` 按 token 命名空间模拟「远程」，零网络依赖即可演示
 * capabilities.remote + requiresAuth + configure() 的全链路。
 *
 * 默认禁用符合规则 C6：远程/实验能力不得默认开启（避免把数据悄悄发到远端）。
 */
const REMOTE_KEY_PREFIX = "resume-studio:remote:";
const TOKEN_KEY = "resume-studio:remote-token";

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* 忽略 */
  }
}

export const remoteStorageDemo: StoragePlugin = {
  id: "storage-remote-demo",
  kind: "storage",
  labelKey: "storage.remote",
  version: 1,
  defaultEnabled: false,
  capabilities: { remote: true, requiresAuth: true },

  // 远程存储不支持同步读取：store 初始化走本地路径，启用本插件后由 hydrate 异步回填
  async load(): Promise<PersistedState | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const raw = localStorage.getItem(REMOTE_KEY_PREFIX + token);
      return raw ? (JSON.parse(raw) as PersistedState) : null;
    } catch {
      return null;
    }
  },

  async save(state: PersistedState): Promise<void> {
    const token = getToken();
    if (!token) return;
    try {
      localStorage.setItem(REMOTE_KEY_PREFIX + token, JSON.stringify(state));
    } catch {
      /* 配额溢出等：静默失败 */
    }
  },

  async clear(): Promise<void> {
    const token = getToken();
    if (!token) return;
    try {
      localStorage.removeItem(REMOTE_KEY_PREFIX + token);
    } catch {
      /* 忽略 */
    }
  },

  /** 引导用户配置 token（真实实现里替换为 OAuth / 表单） */
  async configure(): Promise<void> {
    const token = window.prompt("输入远程存储 Token（演示用：将作为远端命名空间）")?.trim();
    if (token) setToken(token);
  },
};
