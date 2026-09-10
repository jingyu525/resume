import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { createEmptyResume } from "@/plugins/resume-template";
import { useResumeStore } from "@/store/useResumeStore";
import { buildResumeTools } from "@/app/webmcp/tools";
import { getModelContext, registerWebMcpTools } from "@/app/webmcp/register";
import {
  getWebMcpConfirmSnapshot,
  resolveWebMcpConfirmation,
} from "@/app/webmcp/confirm";
import type { WebMcpTool } from "@/app/webmcp/types";

beforeAll(() => bootstrapPlugins());

afterEach(() => {
  // 未决的确认请求必须清掉，否则会留下永久挂起的 Promise 影响后续用例
  resolveWebMcpConfirmation(false);
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "modelContext");
  Reflect.deleteProperty(navigator, "modelContext");
});

function getTool(name: string): WebMcpTool {
  const tool = buildResumeTools().find((t) => t.name === name);
  if (!tool) throw new Error(`tool not found: ${name}`);
  return tool;
}

describe("WebMCP 工具集", () => {
  it("工具名唯一，且每个工具都有描述与 object 类型的 inputSchema", () => {
    const tools = buildResumeTools();
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("只读工具标注 readOnlyHint", () => {
    expect(getTool("get_resume").annotations?.readOnlyHint).toBe(true);
    expect(getTool("list_sections").annotations?.readOnlyHint).toBe(true);
  });

  it("get_resume 返回当前简历、外观与语言", async () => {
    useResumeStore.setState({ resume: createEmptyResume(), locale: "zh" });
    const raw = await getTool("get_resume").execute({});
    const parsed = JSON.parse(raw) as {
      locale: string;
      resume: { sections: unknown[] };
      appearance: { mode: string };
    };
    expect(parsed.locale).toBe("zh");
    expect(parsed.resume.sections.length).toBeGreaterThan(0);
    expect(parsed.appearance.mode).toBeDefined();
  });

  it("list_sections 标出空章节且不遗漏结构", async () => {
    useResumeStore.setState({ resume: createEmptyResume(), locale: "en" });
    const rows = JSON.parse(await getTool("list_sections").execute({})) as {
      kind: string;
      empty: boolean;
      visible: boolean;
    }[];
    expect(rows.length).toBe(createEmptyResume().sections.length);
    // 空简历下每个章节都应为空
    expect(rows.every((r) => r.empty)).toBe(true);
  });

  it("update_basics 先弹确认：确认前不写入，同意后才落库", async () => {
    useResumeStore.setState({ locale: "zh", resume: createEmptyResume() });
    const pending = getTool("update_basics").execute({
      name: "Zhang Wei",
      email: "zhang@example.com",
    });

    // 确认前：请求已挂起、摘要可见，但简历一个字都没动
    const request = getWebMcpConfirmSnapshot();
    expect(request?.toolName).toBe("update_basics");
    expect(request?.summary).toContain("name: Zhang Wei");
    expect(useResumeStore.getState().resume.basics.name.zh).toBeUndefined();

    resolveWebMcpConfirmation(true);
    const message = await pending;

    const { resume } = useResumeStore.getState();
    expect(resume.basics.name.zh).toBe("Zhang Wei");
    expect(resume.basics.email).toBe("zhang@example.com");
    expect(message).toContain("name");
    expect(message).toContain("email");
  });

  it("用户拒绝时简历完全不变，并明确告知代理不要擅自重试", async () => {
    useResumeStore.setState({ locale: "zh", resume: createEmptyResume() });
    const pending = getTool("update_basics").execute({ name: "Overwritten" });
    resolveWebMcpConfirmation(false);
    const message = await pending;

    expect(useResumeStore.getState().resume.basics.name.zh).toBeUndefined();
    expect(message).toMatch(/did not approve/i);
    expect(getWebMcpConfirmSnapshot()).toBeNull();
  });

  it("并发写请求只处理一个，后到者立即被拒（不排队挂起）", async () => {
    useResumeStore.setState({ locale: "zh", resume: createEmptyResume() });
    const first = getTool("update_basics").execute({ name: "A" });
    const second = await getTool("update_basics").execute({ name: "B" });
    expect(second).toMatch(/did not approve/i);

    resolveWebMcpConfirmation(false);
    await first;
  });

  it("会改写用户内容的工具标注 consequentialHint", () => {
    expect(getTool("update_basics").annotations?.consequentialHint).toBe(true);
  });

  it("update_basics 无参数时返回可操作提示而非静默成功", async () => {
    const message = await getTool("update_basics").execute({});
    expect(message).toMatch(/at least one of/i);
  });

  it("set_locale 拒绝未注册语言并列出可选项", async () => {
    const bad = await getTool("set_locale").execute({ locale: "xx" });
    expect(bad).toContain("xx");
    expect(bad).toContain("en");

    const ok = await getTool("set_locale").execute({ locale: "ja" });
    expect(useResumeStore.getState().locale).toBe("ja");
    expect(ok).toContain("ja");
  });

  it("set_appearance 接受自然语言色名并落成 hex，同时可改明暗模式", async () => {
    const message = await getTool("set_appearance").execute({ accent: "Emerald", mode: "dark" });
    const { appearance } = useResumeStore.getState();
    expect(appearance.accent.toLowerCase()).toBe("#16a34a");
    expect(appearance.mode).toBe("dark");
    expect(message).toContain("Emerald");
  });

  it("set_appearance 对非法值返回可选清单", async () => {
    const message = await getTool("set_appearance").execute({ accent: "Fluorescent" });
    expect(message).toContain("Fluorescent");
    expect(message).toContain("Classic Blue");
  });

  it("set_appearance 无参数时不产生任何变更", async () => {
    const before = useResumeStore.getState().appearance;
    const message = await getTool("set_appearance").execute({});
    expect(useResumeStore.getState().appearance).toBe(before);
    expect(message).toMatch(/at least one of/i);
  });

  it("export_pdf 在预览未渲染时给出可操作提示（不静默失败）", async () => {
    const message = await getTool("export_pdf").execute({});
    expect(message).toMatch(/preview|editor/i);
  });

  it("export_backup 触发一次文件下载", async () => {
    const createObjectURL = vi.fn(() => "blob:mock");
    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });
    // jsdom 既没有 createObjectURL 也没有 revokeObjectURL，两个都要补
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const message = await getTool("export_backup").execute({});
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(message).toMatch(/backup/i);
  });
});

describe("WebMCP 注册与降级", () => {
  it("浏览器不支持该协议时静默降级，返回 false", async () => {
    expect(getModelContext()).toBeNull();
    expect(await registerWebMcpTools()).toBe(false);
  });

  it("document.modelContext 可用时逐个注册全部工具", async () => {
    const registerTool = vi.fn(async (_tool: WebMcpTool) => {});
    Object.defineProperty(document, "modelContext", {
      value: { registerTool },
      configurable: true,
    });

    expect(await registerWebMcpTools()).toBe(true);
    expect(registerTool).toHaveBeenCalledTimes(buildResumeTools().length);
    expect(registerTool.mock.calls[0]?.[0].name).toBe("get_resume");
  });

  it("仅提供早期 provideContext 的实现也能批量注册", async () => {
    const provideContext = vi.fn((_context: { tools: WebMcpTool[] }) => {});
    Object.defineProperty(navigator, "modelContext", {
      value: { provideContext },
      configurable: true,
    });

    expect(await registerWebMcpTools()).toBe(true);
    expect(provideContext).toHaveBeenCalledTimes(1);
    expect(provideContext.mock.calls[0]?.[0].tools.length).toBe(buildResumeTools().length);
  });

  it("modelContext 存在但无任何注册方法时不误报成功", async () => {
    Object.defineProperty(document, "modelContext", { value: {}, configurable: true });
    expect(await registerWebMcpTools()).toBe(false);
  });
});
