import type { WebMcpModelContext } from "./types";
import { buildResumeTools } from "./tools";

/**
 * 取当前可用的 modelContext。
 *
 * 现行规范挂 `document.modelContext`（`registerTool()`），早期草案挂
 * `navigator.modelContext`（`provideContext()`）。两个位置都探测，
 * 不写死其中之一——协议仍在 Origin Trial，实现随时可能变。
 */
export function getModelContext(): WebMcpModelContext | null {
  const fromDocument = (document as Document & { modelContext?: WebMcpModelContext })
    .modelContext;
  if (fromDocument) return fromDocument;
  const fromNavigator = (navigator as Navigator & { modelContext?: WebMcpModelContext })
    .modelContext;
  return fromNavigator ?? null;
}

/**
 * 把应用能力注册为 WebMCP 工具，供浏览器内的 AI 代理调用。
 *
 * 不支持 WebMCP 的浏览器（绝大多数，需 Chrome 149+ 且开启源试用）静默返回
 * false —— WebMCP 是渐进增强，缺了它应用必须与从前完全一样。
 *
 * 注册时机要求 store 已就绪（见 main.tsx），因为工具的 execute 直接读写 store。
 */
export async function registerWebMcpTools(): Promise<boolean> {
  const context = getModelContext();
  if (!context) return false;

  const tools = buildResumeTools();

  if (typeof context.registerTool === "function") {
    for (const tool of tools) {
      await context.registerTool(tool);
    }
    return true;
  }

  if (typeof context.provideContext === "function") {
    context.provideContext({ tools });
    return true;
  }

  return false;
}
