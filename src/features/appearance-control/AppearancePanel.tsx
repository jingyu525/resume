import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { ACCENT_COLORS, LAYOUTS, TONES } from "@/shared/config/presets";
import { cn } from "@/shared/lib/cn";
import { Slider } from "@/shared/ui/slider";
import { Button } from "@/shared/ui/button";
import { RotateCcw, Check, Monitor, Sun, Moon } from "lucide-react";
import { TemplateGallery } from "./TemplateGallery";

const MODES = [
  { value: "light" as const, labelKey: "appearance.mode.light", icon: Sun },
  { value: "dark" as const, labelKey: "appearance.mode.dark", icon: Moon },
  { value: "system" as const, labelKey: "appearance.mode.system", icon: Monitor },
] as const;

/** 外观四直觉维度：主色 / 版式 / 气质 / 疏密（FR-5），系统将直觉轴翻译为版面数值 */
export function AppearancePanel() {
  const { t } = useI18n();
  const appearance = useResumeStore((s) => s.appearance);
  const setAppearance = useResumeStore((s) => s.setAppearance);
  const resetAppearance = useResumeStore((s) => s.resetAppearance);

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("appearance.title")}</h3>
        <Button variant="ghost" size="sm" onClick={resetAppearance}>
          <RotateCcw size={14} />
          {t("appearance.reset")}
        </Button>
      </div>

      <Field label={t("theme.title")}>
        <TemplateGallery />
      </Field>

      <Field label={t("appearance.mode")}>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const picked = appearance.mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setAppearance({ mode: m.value })}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm transition-colors",
                  picked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-secondary",
                )}
              >
                <Icon size={15} />
                {t(m.labelKey)}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="border-t pt-5">
        <div className="mb-3 text-xs font-medium text-muted-foreground">{t("appearance.fineTune")}</div>

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

        <Field label={t("appearance.accent")}>
          <div className="flex flex-wrap gap-2.5">
            {ACCENT_COLORS.map((c) => {
              const picked = appearance.accent === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.label}
                  aria-pressed={picked}
                  title={c.label}
                  onClick={() => setAppearance({ accent: c.value })}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full border-2 transition-all",
                    picked
                      ? "border-transparent ring-2 ring-offset-2 ring-foreground scale-110"
                      : "border-transparent hover:scale-105 hover:ring-1 hover:ring-border",
                  )}
                  style={{ backgroundColor: c.value }}
                >
                  {picked && <Check size={14} strokeWidth={3} className="text-white drop-shadow" />}
                </button>
              );
            })}
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
          <div>
            <Slider
              value={appearance.density}
              onChange={(v) => setAppearance({ density: v })}
              aria-label={t("appearance.density")}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("appearance.density.compact")}</span>
              <span>{t("appearance.density.spacious")}</span>
            </div>
          </div>
        </Field>
      </div>

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
