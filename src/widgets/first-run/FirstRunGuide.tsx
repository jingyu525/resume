import { useState } from "react";
import { useI18n } from "@/shared/i18n";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { setUiPref } from "@/plugins/core/enabled";
import { MousePointerClick, ArrowDown } from "lucide-react";

const ONBOARD_KEY = "rs_onboarded";
const PDF_GUIDE_KEY = "rs_pdfGuideDismissed";

/**
 * 统一首次使用序列（P0：降低首用认知门槛 + 消除导出跨平台落差）。
 *
 * 第 1 步：点字即改（带轻量动效强化"可点"感知）；第 2 步：导出 PDF 的三系统做法。
 * 完成则同时写 rs_onboarded 与 rs_pdfGuideDismissed，ExportMenu 的即时引导不再重复弹出；
 * 跳过 / Esc / X 只写 rs_onboarded，PDF 引导仍作为导出时的兜底。
 */
export function FirstRunGuide({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  const finish = (taughtPdf: boolean) => {
    setUiPref(ONBOARD_KEY, true);
    if (taughtPdf) setUiPref(PDF_GUIDE_KEY, true);
    onClose();
  };

  return (
    <Dialog open onClose={() => finish(false)} title={t("onboard.title")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {t("onboard.step", { n: String(step + 1) })}
          </p>
          <div className="flex gap-1.5">
            {[0, 1].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-5 bg-primary" : "w-1.5 bg-muted",
                )}
              />
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <MousePointerClick className="animate-bounce text-primary" size={40} />
            <ArrowDown className="animate-bounce text-muted-foreground" size={18} />
            <p className="text-sm">{t("onboard.step1.desc")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("export.pdfGuide.desc")}</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-14 shrink-0 font-medium">macOS</span>
                <span className="text-muted-foreground">{t("export.pdfGuide.mac")}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-14 shrink-0 font-medium">Windows</span>
                <span className="text-muted-foreground">{t("export.pdfGuide.win")}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-14 shrink-0 font-medium">Linux</span>
                <span className="text-muted-foreground">{t("export.pdfGuide.linux")}</span>
              </li>
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => finish(false)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            {t("onboard.skip")}
          </button>
          <div className="flex gap-2">
            {step === 1 && (
              <Button variant="outline" onClick={() => setStep(0)}>
                {t("onboard.back")}
              </Button>
            )}
            {step === 0 ? (
              <Button onClick={() => setStep(1)}>{t("onboard.next")}</Button>
            ) : (
              <Button onClick={() => finish(true)}>{t("onboard.finish")}</Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
