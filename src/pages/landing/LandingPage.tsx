import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { LanguageSwitcher } from "@/features/language-switch/LanguageSwitcher";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import { useMemo } from "react";
import { createSampleResume } from "@/plugins/resume-template";
import { PaginatedResume } from "@/features/pagination/PaginatedResume";
import { Github, FileText, Type, Bot, Code2, HardDrive, Lock } from "lucide-react";

// 落地页展示区缩放系数（A4 在 hero 区按此比例缩小）
const SHOWCASE_SCALE = 0.6;
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

  // 展示区用真实渲染管线（PaginatedResume）渲染样例简历，随界面语言切换；
  // 卡片只读 + 点击进入真实编辑器。原因：就地编辑会改动全局 store，而自动保存是全局的，
  // 会覆盖回访者的已存简历，故落地页只做「真实预览 + 一点即进编辑器」。
  const sample = useMemo(() => createSampleResume(), []);

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

        {/* 编辑器展示区：真实渲染管线渲染的样例简历（随界面语言切换），
            只读 + 点击进入真实编辑器，制造「点一下就懂」 */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">{t("showcase.title")}</h2>
          <div className="flex justify-center">
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate("/editor")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate("/editor");
                }
              }}
              className="group relative rotate-1 cursor-pointer rounded-lg bg-white p-2 shadow-2xl ring-1 ring-border transition-transform hover:-translate-y-1"
            >
              <span className="no-print pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {t("nav.try")}
              </span>
              <div
                className="overflow-hidden rounded-sm"
                style={{ width: `${210 * SHOWCASE_SCALE}mm`, height: `${297 * SHOWCASE_SCALE}mm` }}
              >
                <div
                  style={{
                    transform: `scale(${SHOWCASE_SCALE})`,
                    transformOrigin: "top left",
                    pointerEvents: "none",
                  }}
                >
                  <PaginatedResume resume={sample} locale={locale} appearance={DEFAULT_APPEARANCE} />
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
