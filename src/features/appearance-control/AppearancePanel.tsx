import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { ACCENT_COLORS, LAYOUTS, TONES } from "@/shared/config/presets";
import { cn } from "@/shared/lib/cn";
import { Slider } from "@/shared/ui/slider";
import { Button } from "@/shared/ui/button";
import { RotateCcw } from "lucide-react";

/** 外观四直觉维度：主色 / 版式 / 气质 / 疏密（FR-5），系统将直觉轴翻译为版面数值 */
export function AppearancePanel() {
  const { t } = useI18n();
  const appearance = useResumeStore((s) => s.appearance);
  const setAppearance = useResumeStore((s) => s.setAppearance);
  const resetAppearance = useResumeStore((s) => s.resetAppearance);

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("appearance.title")}</h3>
        <Button variant="ghost" size="sm" onClick={resetAppearance}>
          <RotateCcw size={14} />
          {t("appearance.reset")}
        </Button>
      </div>

      <Field label={t("appearance.accent")}>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.label}
              title={c.label}
              onClick={() => setAppearance({ accent: c.value })}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform",
                appearance.accent === c.value
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105",
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </Field>

      <Field label={t("appearance.layout")}>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setAppearance({ layout: l.value })}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors",
                appearance.layout === l.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-secondary",
              )}
            >
              {t(l.labelKey)}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("appearance.tone")}>
        <div className="grid grid-cols-3 gap-2">
          {TONES.map((tn) => (
            <button
              key={tn.value}
              type="button"
              onClick={() => setAppearance({ tone: tn.value })}
              className={cn(
                "rounded-lg border px-2 py-2 text-sm transition-colors",
                appearance.tone === tn.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-secondary",
              )}
            >
              {t(tn.labelKey)}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t("appearance.density")}>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t("appearance.density.compact")}</span>
          <Slider
            value={appearance.density}
            onChange={(v) => setAppearance({ density: v })}
            aria-label={t("appearance.density")}
          />
          <span className="text-xs text-muted-foreground">{t("appearance.density.spacious")}</span>
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
