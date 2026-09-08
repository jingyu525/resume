import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { LanguageSwitcher } from "@/features/language-switch/LanguageSwitcher";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { resolveResumeTheme } from "@/shared/config/presets";
import { getTheme } from "@/plugins/core/registry";
import { useMemo } from "react";
import { createSampleResume } from "@/plugins/resume-template";
import { localizedText } from "@/shared/lib/localized";
import { richTextToPlain } from "@/shared/lib/sanitize";
import { Github, FileText, Type, Bot, Code2, HardDrive, Lock } from "lucide-react";
import { LandingHero } from "@/widgets/landing-hero/LandingHero";
import { LandingFeatures } from "@/widgets/landing-features/LandingFeatures";
import { LandingFooter } from "@/widgets/landing-footer/LandingFooter";

// GitHub entry URL (enable by setting to your real repo)
const GITHUB_URL = "https://github.com/jingyu525/resume";

const WHY = [
  { key: "why.word", icon: FileText },
  { key: "why.markdown", icon: Type },
  { key: "why.ai", icon: Bot },
];

const ENGINEERING = [
  { icon: Code2, key: "engineering.p1" },
  { icon: HardDrive, key: "engineering.p2" },
  { icon: Lock, key: "engineering.p3" },
];

export function LandingPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const themePlugin = getTheme(DEFAULT_APPEARANCE.theme);
  const theme = { ...resolveResumeTheme(DEFAULT_APPEARANCE), ...(themePlugin?.cssVars ?? {}) };

  // 展示区直接驱动自样例简历（与「试用」取得的数据一致），随界面语言切换，无硬编码中文
  const sample = useMemo(() => createSampleResume(), []);
  const exp = sample.sections.find((s) => s.kind === "experience");
  const skills = sample.sections.find((s) => s.kind === "skills");
  const expItem = exp?.items[0];
  const name = localizedText(sample.basics.name, locale);
  const job = localizedText(sample.basics.title, locale);
  const city = localizedText(sample.basics.city, locale);
  const contact = [city, sample.basics.email].filter(Boolean).join(" · ");
  const expTitle = expItem ? localizedText(expItem.title, locale) : "";
  const expSub = expItem ? localizedText(expItem.subtitle, locale) : "";
  const expDate = expItem
    ? [expItem.startDate.slice(0, 4), expItem.current ? t("edit.current") : expItem.endDate.slice(0, 4)]
        .filter(Boolean)
        .join(" – ")
    : "";
  const expDesc = expItem ? richTextToPlain(localizedText(expItem.description, locale) ?? "") : "";
  const skillGroups = skills?.groups ?? [];

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <FileText size={16} />
            </span>
            <span className="i18n-truncate max-w-[10rem]">{t("nav.brand")}</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher />
            {GITHUB_URL && (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:inline-flex"
              >
                <Github size={16} /> {t("nav.github")}
              </a>
            )}
            <Button size="sm" className="ml-1" onClick={() => navigate("/editor")}>
              {t("nav.try")}
            </Button>
          </nav>
        </div>
      </header>

      <main className="pt-14">
        <LandingHero />
        <LandingFeatures />

        {/* 为什么不是… */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">{t("whyNot.title")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {WHY.map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-destructive">
                  <Icon size={18} />
                  <h3 className="font-semibold text-foreground">{t(`${key}.title`)}</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[1, 2, 3].map((n) => (
                    <li key={n} className="flex gap-2">
                      <span className="text-destructive">✕</span>
                      <span>{t(`${key}.p${n}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 编辑器展示区：样例简历（随界面语言切换，与「试用」取得的数据一致） */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">{t("showcase.title")}</h2>
          <div className="flex justify-center">
            <div className="rotate-1 rounded-lg bg-white p-2 shadow-2xl ring-1 ring-border">
              <div
                className="a4-page rs-doc"
                style={{ ...(theme as React.CSSProperties), width: "180mm", transform: "scale(1)" }}
              >
                <div className="rs-name">{name}</div>
                <div className="rs-jobtitle">{job}</div>
                <div className="rs-contact">
                  <span>{contact}</span>
                </div>
                {exp && (
                  <div className="rs-section">
                    <div className="rs-section-title">{localizedText(exp.title, locale)}</div>
                    {expItem && (
                      <div className="rs-item">
                        <div className="rs-item-head">
                          <div>
                            <div className="rs-item-title">{expTitle}</div>
                            <div className="rs-item-sub">{expSub}</div>
                          </div>
                          <div className="rs-item-date">{expDate}</div>
                        </div>
                        <div className="rs-desc">{expDesc}</div>
                      </div>
                    )}
                  </div>
                )}
                {skills && (
                  <div className="rs-section">
                    <div className="rs-section-title">{localizedText(skills.title, locale)}</div>
                    {skillGroups.map((g) => (
                      <div className="rs-skill-group" key={g.id}>
                        <div className="rs-skill-name">{localizedText(g.name, locale)}</div>
                        <div className="rs-skill-items">
                          {localizedText(g.items, locale).split("\n").join(" · ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 工程底座 */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">{t("engineering.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {ENGINEERING.map(({ icon: Icon, key }) => (
              <div key={key} className="rounded-2xl border border-border bg-secondary/40 p-5">
                <Icon size={18} className="mb-3 text-primary" />
                <p className="text-sm text-foreground">{t(key)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
