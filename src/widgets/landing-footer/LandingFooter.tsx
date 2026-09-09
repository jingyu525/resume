import { useNavigate } from "react-router-dom";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { openFeedback } from "@/widgets/feedback/openFeedback";
import { VoteWidget } from "@/widgets/feedback/VoteWidget";

export function LandingFooter() {
  const { t, locale } = useI18n();
  const nav = useNavigate();
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight">{t("footer.cta")}</h2>
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={() => nav("/editor")}>
            {t("hero.ctaPrimary")} <ArrowRight size={18} />
          </Button>
        </div>
        <p className="mx-auto mt-8 flex max-w-xl items-start justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>{t("footer.privacy")}</span>
        </p>
        <div className="mt-6">
          <VoteWidget />
        </div>
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => openFeedback(locale, "/")}>
            {t("feedback.label")}
          </Button>
        </div>
      </div>
    </footer>
  );
}
