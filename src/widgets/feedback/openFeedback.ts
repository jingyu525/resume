// 反馈闭环：打开预填的 GitHub Issue（零后端、不收集个人数据）。
// 仅带当前页面与语言，便于复现；用户自愿填写内容。
const REPO = "https://github.com/jingyu525/resume";

export function openFeedback(locale: string, pathname: string): void {
  const title = encodeURIComponent(`[反馈/${locale}] `);
  const body = encodeURIComponent(
    `**页面**：${pathname}\n**语言**：${locale}\n\n// 请描述你遇到的问题或建议：\n`,
  );
  window.open(
    `${REPO}/issues/new?title=${title}&body=${body}&labels=feedback`,
    "_blank",
    "noopener",
  );
}
