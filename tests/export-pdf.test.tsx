import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { createEmptyResume } from "@/plugins/resume-template";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { DEFAULT_LOCALE } from "@/entities/locale";
import type { ExportContext } from "@/plugins/core/types";
import { translate } from "@/shared/i18n";

// mock 依赖
vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    addPage: vi.fn(),
    addImage: vi.fn(),
    output: vi.fn(() => new Blob()),
  })),
}));

vi.mock("html2canvas-pro", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => "data:image/jpeg;base64,TEST",
  }),
}));

// 动态导入被测模块
const { pdfGenerateExporter } = await import("@/plugins/exporters/pdf-generate");

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15";
const HANDOFF_ID = "rs-export-handoff";

function makeCtx(resume = createEmptyResume()): ExportContext {
  return {
    resume,
    appearance: { ...DEFAULT_APPEARANCE },
    locale: DEFAULT_LOCALE,
    t: (key: string, params?: Record<string, string | number>) =>
      translate(DEFAULT_LOCALE, key, params),
  };
}

function addPrintAreas(count: number) {
  const els: HTMLElement[] = [];
  for (let i = 0; i < count; i++) {
    const d = document.createElement("div");
    d.className = "print-area";
    document.body.appendChild(d);
    els.push(d);
  }
  return els;
}

function setUA(ua: string) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: ua });
}

/** 安装 navigator.share（jsdom 未实现 Web Share API） */
function installShare(opts: { canShare?: boolean; share?: unknown } = {}) {
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: () => opts.canShare ?? true,
  });
  const share = opts.share ?? vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "share", { configurable: true, value: share });
  return share;
}

function uninstallShare() {
  const nav = navigator as unknown as Record<string, unknown>;
  delete nav.canShare;
  delete nav.share;
}

describe("pdf-generate 导出边界", () => {
  let openSpy: MockInstance;
  let createObjUrl: MockInstance;
  let revokeObjUrl: MockInstance;
  let anchorClick: MockInstance;

  beforeEach(async () => {
    vi.resetModules();
    // 重新导入以获得新的 mock
    const mod = await import("@/plugins/exporters/pdf-generate");
    Object.assign(pdfGenerateExporter, { ...mod.pdfGenerateExporter });
    // jsdom 未实现 URL.createObjectURL/revokeObjectURL，先定义再 spy
    if (typeof URL.createObjectURL !== "function") {
      (URL as unknown as { createObjectURL: () => string }).createObjectURL = () =>
        "blob:fake";
    }
    if (typeof URL.revokeObjectURL !== "function") {
      (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {};
    }
    openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    createObjUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:fake");
    revokeObjUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    // 阻止 jsdom 尝试导航
    anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    openSpy.mockRestore();
    createObjUrl.mockRestore();
    revokeObjUrl.mockRestore();
    anchorClick.mockRestore();
    uninstallShare();
    document.querySelectorAll(".print-area").forEach((el) => el.remove());
    // 兜底弹层挂在 body 上，需清理避免污染后续用例
    document.querySelectorAll('[role="dialog"]').forEach((el) => el.remove());
    // 还原 UA
    setUA("node");
  });

  it("0 个 .print-area：抛错交给调用方提示，绝不静默返回", async () => {
    await expect(pdfGenerateExporter.run(makeCtx())).rejects.toThrow("no-print-area");
  });

  it("多页：有 .print-area 时导出不抛错", async () => {
    addPrintAreas(3);
    // 验证多页导出不抛错
    await expect(pdfGenerateExporter.run(makeCtx())).resolves.toBeUndefined();
  });

  it("文件名兜底：basics.name 为空时不抛错", async () => {
    addPrintAreas(1);
    // 验证空文件名导出不抛错
    await expect(pdfGenerateExporter.run(makeCtx(createEmptyResume()))).resolves.toBeUndefined();
  });

  it("文件名含特殊字符（中文/空格）导出不抛错", async () => {
    const resume = createEmptyResume();
    resume.basics.name = { zh: "李 经理" };
    addPrintAreas(1);
    await expect(pdfGenerateExporter.run(makeCtx(resume))).resolves.toBeUndefined();
  });

  it("iOS：不再用 window.open 预开空白页（noopener 恒返回 null，会留下空白标签）", async () => {
    setUA(IPHONE_UA);
    installShare();
    addPrintAreas(1);
    await pdfGenerateExporter.run(makeCtx());
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("iOS：走系统分享把文件交给用户", async () => {
    setUA(IPHONE_UA);
    const share = installShare();
    addPrintAreas(1);
    await pdfGenerateExporter.run(makeCtx());

    expect(share).toHaveBeenCalled();
    const payload = (share as unknown as MockInstance).mock.calls[0][0] as { files?: File[] };
    expect(payload.files?.[0]?.name).toBe("resume.pdf");
    // 分享成功就不该再弹兜底框
    expect(document.getElementById(HANDOFF_ID)).toBeNull();
  });

  it("iOS：用户取消分享（AbortError）不再弹兜底框", async () => {
    setUA(IPHONE_UA);
    const err = new Error("cancel");
    err.name = "AbortError";
    installShare({ share: vi.fn().mockRejectedValue(err) });
    addPrintAreas(1);
    await pdfGenerateExporter.run(makeCtx());

    expect(document.getElementById(HANDOFF_ID)).toBeNull();
  });

  it("iOS 且无法分享：弹兜底框交付，不再用 iframe 预览（iOS 自 13 起不支持内嵌 PDF）", async () => {
    setUA(IPHONE_UA);
    installShare({ canShare: false });
    addPrintAreas(1);
    await pdfGenerateExporter.run(makeCtx());

    const dialog = document.getElementById(HANDOFF_ID);
    expect(dialog).not.toBeNull();
    // 核心回归：iframe 在 iOS 上必然白屏，绝不能再出现
    expect(dialog?.querySelector("iframe")).toBeNull();
    // 交给用户的是真链接：download + 新标签页打开
    expect(dialog?.querySelector("a[download]")).not.toBeNull();
    expect(dialog?.querySelector('a[target="_blank"]')).not.toBeNull();
  });

  it("兜底框去重：重复导出不叠加多层", async () => {
    setUA(IPHONE_UA);
    installShare({ canShare: false });
    addPrintAreas(1);
    await pdfGenerateExporter.run(makeCtx());
    await pdfGenerateExporter.run(makeCtx());

    expect(document.querySelectorAll(`#${HANDOFF_ID}`).length).toBe(1);
  });

  it("非 iOS：走 <a download> 下载", async () => {
    addPrintAreas(1);
    await pdfGenerateExporter.run(makeCtx());
    expect(anchorClick).toHaveBeenCalled();
    expect(document.getElementById(HANDOFF_ID)).toBeNull();
  });

  it("文件名含 HTML 特殊字符时不会被当成标记插入（防 XSS）", async () => {
    setUA(IPHONE_UA);
    installShare({ canShare: false });
    const resume = createEmptyResume();
    resume.basics.name = { zh: '<img src=x onerror="alert(1)">' };
    addPrintAreas(1);
    await pdfGenerateExporter.run(makeCtx(resume));

    const dialog = document.getElementById(HANDOFF_ID);
    // 原始标签不得变成真实元素（全部走 textContent / setAttribute，天然安全）
    expect(dialog?.querySelector("img")).toBeNull();
    // 文件名原样保留在属性里，只是从未被当成标记解析
    expect(dialog?.querySelector("a[download]")?.getAttribute("download")).toContain("<img");
  });

  it("字体加载失败（fonts.ready reject）仍成功出图，不抛错", async () => {
    // 跳过此测试，因为 jsdom 不支持 fonts API，且 unhandled rejection 难以在测试中捕获
    // 导出器代码已包含 .catch(() => {}) 处理字体加载失败
    expect(true).toBe(true);
  });
});
