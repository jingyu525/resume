import { useI18n } from "@/shared/i18n";
import { FileText, Sparkles, Lock, PenLine, Languages, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "feature.wysiwyg": FileText,
  "feature.typography": Sparkles,
  "feature.privacy": Lock,
  "feature.noai": PenLine,
  "feature.inline": PenLine,
  "feature.i18n": Languages,
};

const KEYS = [
  "feature.wysiwyg",
  "feature.typography",
  "feature.privacy",
  "feature.noai",
  "feature.inline",
  "feature.i18n",
];

export function LandingFeatures() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight">{t("features.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("features.subtitle")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KEYS.map((k) => {
          const Icon = ICONS[k] ?? Eye;
          return (
            <div
              key={k}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon size={20} />
              </div>
              <h3 className="text-base font-semibold">{t(`${k}.title`)}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t(`${k}.desc`)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
