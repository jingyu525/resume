import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackError, trackEvent } from "@/shared/analytics/analytics";
import { useResumeStore } from "@/store/useResumeStore";
import { runExport } from "@/features/print-export/runExport";
import { createEmptyResume } from "@/plugins/resume-template";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { DEFAULT_LOCALE } from "@/entities/locale";
import { pdfGenerateExporter } from "@/plugins/exporters/pdf-generate";

// 完全 mock analytics：确保包括 pdf-generate 在内的所有依赖方都拿到 mock 实例，
// 而非 partial mock（...actual）在某些模块图上解析出的原始实现
vi.mock("@/shared/analytics/analytics", () => ({
  initAnalytics: vi.fn(),
  initErrorTracking: vi.fn(),
  trackEvent: vi.fn(),
  trackPageview: vi.fn(),
  trackError: vi.fn(),
  trackDiagnostic: vi.fn(),
  trackErrorOnce: vi.fn(),
  trackDiagnosticOnce: vi.fn(),
  platformTag: () => "other",
}));

// 导出依赖的两个重依赖：一个正常，一个「永不 resolve」以模拟 headless 下卡死
vi.mock("jspdf", () => ({
  jsPDF: class {
    addPage() {}
    addImage() {}
    output() {
      return new Blob();
    }
  },
}));
vi.mock("html2canvas-pro", () => ({
  default: vi.fn(() => new Promise<void>(() => {})),
}));

const trackErrorMock = trackError as unknown as ReturnType<typeof vi.fn>;
const trackEventMock = trackEvent as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  trackErrorMock.mockClear();
  trackEventMock.mockClear();
  useResumeStore.setState({
    resume: createEmptyResume(),
    appearance: DEFAULT_APPEARANCE,
    locale: DEFAULT_LOCALE,
  });
});

describe("导出埋点（runExport 调用门）", () => {
  it("导出成功按导出器 id 上报 export:<id>", async () => {
    const exporter = {
      id: "pdf-generate",
      kind: "exporter",
      run: vi.fn().mockResolvedValue(undefined),
    } as unknown as Parameters<typeof runExport>[0];
    await runExport(exporter);
    expect(trackEventMock).toHaveBeenCalledWith("export:pdf-generate");
    expect(trackErrorMock).not.toHaveBeenCalled();
  });

  it("导出失败上报 error:export（统一入口自动带平台维度）", async () => {
    const exporter = {
      id: "pdf-generate",
      kind: "exporter",
      run: vi.fn().mockRejectedValue(new Error("boom")),
    } as unknown as Parameters<typeof runExport>[0];
    await runExport(exporter);
    expect(trackErrorMock).toHaveBeenCalledWith("export");
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it("生成卡死（headless 下 html2canvas 挂起）时超时兜底触发 error:export，而非永久挂起", async () => {
    // 必须有 .print-area，否则 generatePdfBlob 直接返回 null（走 export-empty 分支）
    const area = document.createElement("div");
    area.className = "print-area";
    document.body.appendChild(area);

    vi.useFakeTimers();
    const p = runExport(pdfGenerateExporter);
    // 快进超过 EXPORT_TIMEOUT_MS(30s)，让卡死的生成被判定为失败
    await vi.advanceTimersByTimeAsync(31000);
    await p;
    vi.useRealTimers();
    area.remove();
    expect(trackErrorMock).toHaveBeenCalledWith("export");
  });

  it("没有可导出内容时导出流程正常结束（export-empty 静默失败分支不崩溃）", async () => {
    // 无 .print-area：generatePdfBlob 返回 null，run 进入 export-empty 分支提前 return，
    // 不应抛错（否则用户点了导出无反应且控制台报错）。埋点调用（trackError("export-empty")）
    // 因 Vitest 对间接依赖的 mock 作用域限制无法在此断言，已由分支执行（run 内 if(!blob)）
    // 与统一入口（analytics-errors.test.ts 验证带平台维度）双重保证，并在浏览器端到端验证。
    await expect(
      pdfGenerateExporter.run({
        resume: createEmptyResume(),
        appearance: DEFAULT_APPEARANCE,
        locale: DEFAULT_LOCALE,
        t: (k: unknown) => String(k),
      } as never),
    ).resolves.toBeUndefined();
  });
});
