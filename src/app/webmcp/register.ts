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

  try {
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
  } catch (error) {
    /*
     * 协议在、但注册被拒，已实测两种情形：
     * 1. 权限被禁用（跨源 iframe 未加 allow="tools"，或响应头
     *    `Permissions-Policy: tools=()`）→ 规范规定抛 NotAllowedError；
     * 2. 早期草案实现（实测 Chrome 146 的 navigator.modelContext）对**已注册的
     *    同名工具**再次注册会抛 InvalidStateError——新规范写的是"替换"，但
     *    现存实现未必跟进。
     * 渐进增强失败既不能影响应用，也不能变成 unhandled rejection
     * （main.tsx 是 `void` 调用），所以在此收口并降级。
     */
    console.warn("[webmcp] tool registration rejected; continuing without it", error);
    return false;
  }
}
