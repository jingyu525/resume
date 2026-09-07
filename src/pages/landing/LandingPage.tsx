import { Link } from "react-router-dom";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { LanguageSwitcher } from "@/features/language-switch/LanguageSwitcher";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { resolveResumeTheme } from "@/shared/config/presets";
import { getTheme } from "@/plugins/core/registry";
import { Github, FileText, Type, Bot, Code2, HardDrive, Lock } from "lucide-react";
import { LandingHero } from "@/widgets/landing-hero/LandingHero";
import { LandingFeatures } from "@/widgets/landing-features/LandingFeatures";
import { LandingFooter } from "@/widgets/landing-footer/LandingFooter";

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
  const { t } = useI18n();
  const themePlugin = getTheme(DEFAULT_APPEARANCE.theme);
  const theme = { ...resolveResumeTheme(DEFAULT_APPEARANCE), ...(themePlugin?.cssVars ?? {}) };

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
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:inline-flex"
            >
              <Github size={16} /> {t("nav.github")}
            </a>
            <Button size="sm" className="ml-1" onClick={() => (window.location.href = "/editor")}>
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

        {/* 编辑器展示区 */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">{t("showcase.title")}</h2>
          <div className="flex justify-center">
            <div className="rotate-1 rounded-lg bg-white p-2 shadow-2xl ring-1 ring-border">
              <div
                className="a4-page rs-doc"
                style={{ ...(theme as React.CSSProperties), width: "180mm", transform: "scale(1)" }}
              >
                <div className="rs-name">李知行</div>
                <div className="rs-jobtitle">高级产品经理</div>
                <div className="rs-contact">
                  <span>shanghai · zhixing.li@example.com</span>
                </div>
                <div className="rs-section">
                  <div className="rs-section-title">工作经历</div>
                  <div className="rs-item">
                    <div className="rs-item-head">
                      <div>
                        <div className="rs-item-title">星河科技</div>
                        <div className="rs-item-sub">高级产品经理</div>
                      </div>
                      <div className="rs-item-date">2021 – 至今</div>
                    </div>
                    <div className="rs-desc">
                      <p>主导企业协作平台核心模块，推动<em className="rs-em">自动化工作流</em>上线。</p>
                    </div>
                  </div>
                </div>
                <div className="rs-section">
                  <div className="rs-section-title">专业技能</div>
                  <div className="rs-skill-group">
                    <div className="rs-skill-name">产品方法</div>
                    <div className="rs-skill-items">用户研究 · 路线图规划 · A/B 实验</div>
                  </div>
                </div>
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
