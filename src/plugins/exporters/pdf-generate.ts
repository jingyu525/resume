import type { ExportContext, ExporterPlugin } from "@/plugins/core/types";
import { localizedText } from "@/shared/lib/localized";
import { isIOS } from "@/shared/lib/platform";
import { trackError } from "@/shared/analytics/analytics";

const A4_W_MM = 210;
const A4_H_MM = 297;
/** 截图倍率：A4 @96dpi ≈ 794px，×2 ≈ 1588px，文字足够清晰且文件体积可控 */
const CAPTURE_SCALE = 2;
/**
 * iOS 一律降采样到 ×1.5（≈1191px 宽，仍清晰）。
 * 移动端 canvas 内存上限与算力都远低于桌面，倍率是最直接的耗时/失败率杠杆：
 * 面积比 ×2 少 44%，多页导出时差别非常明显。
 */
const CAPTURE_SCALE_IOS = 1.5;
/** object URL 延迟回收时间：确保下载/打开已开始 */
const REVOKE_DELAY_MS = 15000;
/**
 * 生成阶段**整体**超时：从等字体到最后一页截图，全程只计这一次。
 *
 * 曾是按步骤各计 30s，多页会叠加成 30s×页数——用户侧就是「一直转圈」。
 * 超时即抛出 → runExport 兜住 → UI 提示失败，绝不无限等待。
 */
const EXPORT_TIMEOUT_MS = 30000;
/** 分包加载超时：正常是毫秒级，只在网络/分包异常时兜底 */
const IMPORT_TIMEOUT_MS = 10000;
/**
 * 系统分享面板的等待上限。
 *
 * 用户在面板里可能长时间不操作，某些环境也可能压根不 settle；一味 await 会让按钮
 * 一直转圈。到点不判失败，改落兜底框——PDF 已经生成好了，用户仍有一条手动拿文件的路。
 */
const SHARE_TIMEOUT_MS = 45000;
/**
 * 字体就绪等待上限，与 PaginatedResume 的测量等待保持一致。
 *
 * iOS Safari 上 document.fonts.ready 可能迟迟不 resolve（项目内已知行为），
 * 裸 await 会让导出永久挂起——连整体超时都救不了，因为它卡在计时开始之前。
 */
const FONTS_TIMEOUT_MS = 3000;
/** 等待分页就绪的上限：分页测量跑在 rAF 里，用户可能在首帧前就点了导出。
 *  测量只需一帧，1.5s 足以覆盖字体阻塞等极端情况，又不会让人干等。 */
const PAGES_WAIT_MS = 1500;
/** 截图期间给导出副本容器加的临时类（配合 globals.css，见 withCaptureLayout） */
const EXPORTING_CLASS = "rs-exporting";
/** 兜底弹层的 DOM id：用于去重，避免重复点击叠出多层 */
const HANDOFF_ID = "rs-export-handoff";

type Translate = ExportContext["t"];

function withTimeout<T>(p: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      onTimeout?.();
      reject(new Error("export-timeout"));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

/**
 * 取已分页的 .print-area，必要时等一帧。
 *
 * 分页测量跑在 requestAnimationFrame 里，刚进页面 / 刚切语言 / 刚改疏密时，
 * 用户可能在测量完成前就点了导出。直接读 DOM 会拿到 0 页，旧实现此时静默返回
 * ——用户点了没反应，最糟的一类失败。这里轮询等它就绪，等不到再抛错交给调用方提示。
 */
async function waitForPages(): Promise<HTMLElement[]> {
  const read = () => Array.from(document.querySelectorAll<HTMLElement>(".print-area"));
  const first = read();
  if (first.length > 0) return first;

  const deadline = Date.now() + PAGES_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const els = read();
    if (els.length > 0) return els;
  }
  return [];
}

/**
 * 截图期间临时把导出副本容器从 fixed 改为 absolute 离屏（见 globals.css 的 .rs-exporting）。
 *
 * html2canvas 对 position:fixed 的处理长期不可靠：它会把目标克隆进临时 iframe，
 * 定位基准随之变化，典型后果是整页空白 / 内容偏移。absolute 离屏是它的安全区，
 * 且同样不影响屏幕布局。注意 @media print 里另有 static 规则，不受此处影响。
 */
async function withCaptureLayout<T>(fn: () => Promise<T>): Promise<T> {
  const hosts = Array.from(document.querySelectorAll<HTMLElement>(".rs-print-source"));
  hosts.forEach((el) => el.classList.add(EXPORTING_CLASS));
  try {
    return await fn();
  } finally {
    hosts.forEach((el) => el.classList.remove(EXPORTING_CLASS));
  }
}

/**
 * 等字体就绪再截图，避免字形/分页错位。
 *
 * 两道兜底都不能省：iOS Safari 上 fonts.ready 可能永不 resolve（裸 await 会永久挂起），
 * 也可能直接 reject（字体服务异常）——两者都必须继续导出，宁可字形略偏也不能不出片。
 */
async function waitFonts(): Promise<void> {
  const ready = document.fonts?.ready;
  if (!ready) return;
  await Promise.race([
    ready.catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, FONTS_TIMEOUT_MS)),
  ]);
}

async function generatePdfBlob(pages: HTMLElement[], scale: number): Promise<Blob> {
  await waitFonts();

  // 仅在用户点击导出时动态加载（代码分割 + 不拖累首屏/测试）
  const { jsPDF } = await withTimeout(import("jspdf"), IMPORT_TIMEOUT_MS);
  const html2canvas = (await withTimeout(import("html2canvas-pro"), IMPORT_TIMEOUT_MS)).default;

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    // 不再逐页计时：整体超时已在 run 里覆盖全部分页，逐页计时会叠加成 30s×页数
    const canvas = await html2canvas(pages[i], {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    // 无 footer：直接铺满整页 A4（分页已保证每页内容落在 297mm 内）
    const img = canvas.toDataURL("image/jpeg", 0.95);
    // 立即释放画布：多页顺序截图时，iOS 的 canvas 内存上限很容易被几张大图吃满而中途失败
    canvas.width = 0;
    canvas.height = 0;
    if (i > 0) doc.addPage();
    doc.addImage(img, "JPEG", 0, 0, A4_W_MM, A4_H_MM);
  }

  return doc.output("blob");
}

/** navigator.share 的能力探测类型（TS lib 尚未覆盖 files 重载） */
type ShareNavigator = Navigator & {
  canShare?: (data: { files?: File[] }) => boolean;
  share?: (data: { files?: File[]; title?: string }) => Promise<void>;
};

/**
 * 走系统分享面板把文件交给用户（Web Share API Level 2，iOS 15+ / Android）。
 *
 * 这是 iOS 上唯一可靠的「交出文件」通道：面板里可直接「存储到文件」「打印」「AirDrop」，
 * 全部由系统接管。注意它要求用户手势；生成 PDF 是异步的，手势可能已过期，
 * 因此失败不算错误——交由 openHandoff 里的按钮（那次点击本身是手势）兜底。
 *
 * @returns 是否已完成交付（true 表示不必再兜底，含用户主动取消）
 */
async function shareFile(blob: Blob, filename: string): Promise<boolean> {
  const nav = navigator as ShareNavigator;
  if (typeof nav.share !== "function" || typeof nav.canShare !== "function") return false;

  const file = new File([blob], filename, { type: "application/pdf" });
  if (!nav.canShare({ files: [file] })) return false;

  try {
    await withTimeout(nav.share({ files: [file] }), SHARE_TIMEOUT_MS);
    return true;
  } catch (err) {
    // 用户在系统面板里取消：他的意图是「先不存」，别再弹兜底框烦他
    if ((err as { name?: string } | null)?.name === "AbortError") return true;
    return false;
  }
}

/** 常规下载：<a download>。桌面端与 Android 的可靠路径，iOS 13+ 也可用。 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

const ACTION_BASE =
  "display:flex;align-items:center;justify-content:center;box-sizing:border-box;" +
  "width:100%;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:500;" +
  "text-decoration:none;cursor:pointer";
const ACTION_PRIMARY =
  ACTION_BASE + ";border:1px solid #18181b;background:#18181b;color:#fff";
const ACTION_GHOST =
  ACTION_BASE + ";border:1px solid #d4d4d8;background:#fff;color:#18181b";

function makeAction(label: string, css: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.textContent = label;
  a.setAttribute("aria-label", label);
  a.style.cssText = css;
  return a;
}

function makeButton(label: string, css: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.setAttribute("aria-label", label);
  b.style.cssText = css;
  return b;
}

/**
 * 交付兜底框：把 blob 变成几个「点一下就生效」的入口。
 *
 * 存在的理由：自动交付（系统分享 / <a download>）依赖用户手势，而 PDF 是异步生成的，
 * 手势可能已过期。框里每个按钮的点击本身就是一次新手势，因此到这里必然能拿到文件。
 * iOS Safari 不能用 iframe 预览 PDF（自 iOS 13 起系统级不支持，表现为白屏/只有第一页），
 * 所以这里一律是「把文件交出去」，不做内嵌预览。
 *
 * 文案全部走 DOM 的 textContent / setAttribute，不拼 HTML，天然无注入面。
 */
function openHandoff(blob: Blob, filename: string, t: Translate): void {
  document.getElementById(HANDOFF_ID)?.remove();

  const url = URL.createObjectURL(blob);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  const close = () => {
    document.removeEventListener("keydown", onKey);
    document.getElementById(HANDOFF_ID)?.remove();
    // 延迟回收：用户点完下载，系统可能还在读取这个 URL
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  };

  const overlay = document.createElement("div");
  overlay.id = HANDOFF_ID;
  overlay.className = "no-print";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", t("export.readyTitle"));
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:10000;display:flex;align-items:center;" +
    "justify-content:center;padding:16px;background:rgba(9,9,11,.45)";

  const card = document.createElement("div");
  card.style.cssText =
    "width:100%;max-width:320px;padding:20px;border-radius:14px;background:#fff;" +
    "box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:inherit;color:#18181b";

  const title = document.createElement("h2");
  title.textContent = t("export.readyTitle");
  title.style.cssText = "margin:0 0 6px;font-size:16px;font-weight:600";

  const hint = document.createElement("p");
  hint.textContent = t("export.readyHint");
  hint.style.cssText = "margin:0 0 16px;font-size:13px;line-height:1.5;color:#52525b";

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;flex-direction:column;gap:8px";

  // 主路径：真链接 + download，点击即由用户手势驱动，成功率最高
  const save = makeAction(t("export.saveFile"), ACTION_PRIMARY);
  save.href = url;
  save.download = filename;
  save.addEventListener("click", () => setTimeout(close, 0));

  actions.appendChild(save);

  const nav = navigator as ShareNavigator;
  const file = new File([blob], filename, { type: "application/pdf" });
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    const share = makeButton(t("export.share"), ACTION_GHOST);
    share.addEventListener("click", () => {
      void nav.share?.({ files: [file] }).then(close, () => {
        /* 取消或失败都留着框，用户还能换「保存到文件」 */
      });
    });
    actions.appendChild(share);
  }

  const open = makeAction(t("export.openTab"), ACTION_GHOST);
  open.href = url;
  open.target = "_blank";
  open.rel = "noopener";
  open.addEventListener("click", () => setTimeout(close, 0));
  actions.appendChild(open);

  const cancel = makeButton(t("common.close"), ACTION_GHOST);
  cancel.addEventListener("click", close);
  actions.appendChild(cancel);

  card.appendChild(title);
  card.appendChild(hint);
  card.appendChild(actions);
  overlay.appendChild(card);
  // 点空白处关闭（点在卡片上不算）
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
  save.focus();
}

/**
 * 纯前端生成 PDF 文件，绕过浏览器/iOS 打印管线，
 * 因此不会带系统注入的「页码 + 网址」页脚（无 footer，最干净专业）。
 * 复用预览里已分页的 .print-area 元素逐页截图，零排版重写，预览即所得。
 * jspdf / html2canvas-pro（oklch 兼容分支）仅在导出时动态加载。
 *
 * 交付策略（本文件最容易踩坑的一段，改动前请先读）：
 * - iOS：只有系统分享面板能把文件可靠交出去；iframe 预览与顶层导航到 blob:/data:
 *   都是死路（前者自 iOS 13 起系统级不支持，后者被 Safari 拦截表现为空白页）。
 * - 其它平台：<a download> 即可。
 * - 两条自动路径都失败时，落到 openHandoff 由用户手动点一次——那次点击必是用户手势。
 */
export const pdfGenerateExporter: ExporterPlugin = {
  id: "pdf-generate",
  kind: "exporter",
  labelKey: "export.pdfFile",
  version: 1,
  default: true,
  async run({ resume, locale, t }: ExportContext) {
    const filename = `${localizedText(resume.basics.name, locale) || "resume"}.pdf`;

    const pages = await waitForPages();
    if (pages.length === 0) {
      // 拿不到分页内容 = 导出什么都没发生。抛错让调用方提示，绝不静默返回
      trackError("export-empty");
      throw new Error("no-print-area");
    }

    const scale = isIOS() ? CAPTURE_SCALE_IOS : CAPTURE_SCALE;
    const blob = await withTimeout(
      withCaptureLayout(() => generatePdfBlob(pages, scale)),
      EXPORT_TIMEOUT_MS,
      () => trackError("export-timeout"),
    );

    if (isIOS()) {
      if (await shareFile(blob, filename)) return;
    } else {
      try {
        downloadBlob(blob, filename);
        return;
      } catch {
        trackError("export-deliver");
      }
    }
    openHandoff(blob, filename, t);
  },
};
