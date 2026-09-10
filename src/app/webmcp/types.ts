/**
 * WebMCP 类型的最小声明。
 *
 * 不装 `webmcp-types` npm 包：该协议仍在 Origin Trial（Chrome 149+），字段
 * 随时可能变，而本项目的定位是「零运行时依赖膨胀」——协议变更时按官方文档
 * （developer.chrome.com/docs/ai/webmcp/imperative-api）同步这里的字段即可。
 */

/** 工具入参的 JSON Schema（只声明本应用实际用到的部分） */
export interface WebMcpInputSchema {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
}

/**
 * 元数据提示，供代理/浏览器决定是否需要用户确认。
 * 三个字段默认 false，含义见官方文档。
 */
export interface WebMcpAnnotations {
  /** true = 只读、无副作用 */
  readOnlyHint?: boolean;
  /** true = 返回内容含不可信数据（UGC / 外部页面），需清理隔离 */
  untrustedContentHint?: boolean;
  /** true = 重大或不可逆操作（本应用暂无此类工具） */
  consequentialHint?: boolean;
}

export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: WebMcpInputSchema;
  execute: (
    input: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ) => Promise<string> | string;
  annotations?: WebMcpAnnotations;
}

/**
 * modelContext 的公共面。
 *
 * 现行规范（Chrome 官方文档，2026-09 更新）挂在 `document.modelContext`，
 * 提供 `registerTool()`；早期草案挂在 `navigator.modelContext`，用
 * `provideContext()` 批量注册。这里两者都认，任一可用即可工作。
 */
export interface WebMcpModelContext {
  registerTool?: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void> | void;
  provideContext?: (context: { tools: WebMcpTool[] }) => void;
}
