import { useState } from "react";
import { useI18n } from "@/shared/i18n";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { setUiPref } from "@/plugins/core/enabled";
import { MousePointerClick } from "lucide-react";

const ONBOARD_KEY = "rs_onboarded";

/**
 * 统一首次使用序列（P0：降低首用认知门槛）。
 * 第 1 步：点字即改；第 2 步：点击「导出 PDF 文件」下载干净 PDF（不再走打印管线）。
 * 完成写入 rs_onboarded，之后不再弹出。
 */
export function FirstRunGuide({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  const finish = () => {
    setUiPref(ONBOARD_KEY, true);
    onClose();
  };

  return (
    <Dialog open onClose={finish} title={t("onboard.title")}>
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
            <p className="text-sm">{t("onboard.step1.desc")}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <p className="text-sm text-muted-foreground">{t("onboard.step2.desc")}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={finish}
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
              <Button onClick={finish}>{t("onboard.finish")}</Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
