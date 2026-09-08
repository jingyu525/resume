import { useNavigate } from "react-router-dom";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { ShieldCheck, ArrowRight, Github } from "lucide-react";

// GitHub entry URL (enable by setting to your real repo)
const GITHUB_URL = "https://github.com/jingyu525/resume";

export function LandingHero() {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 text-center sm:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_0%,hsl(var(--primary)/0.16),transparent_70%)]" />
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
          <ShieldCheck size={15} className="text-primary" /> {t("hero.privacy")}
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">{t("hero.subtitle")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => nav("/editor")}>
            {t("hero.ctaPrimary")} <ArrowRight size={18} />
          </Button>
          {GITHUB_URL && (
            <Button size="lg" variant="outline" onClick={() => window.open(GITHUB_URL, "_blank")}>
              <Github size={18} /> {t("hero.ctaSecondary")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
