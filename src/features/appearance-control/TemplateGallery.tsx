import type { CSSProperties } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { trackEvent } from "@/shared/analytics/analytics";
import { resolveResumeTheme } from "@/shared/config/presets";
import { applyThemePreset } from "@/shared/lib/themePreset";
import { listThemes } from "@/plugins/core/registry";
import { cn } from "@/shared/lib/cn";
import { Check } from "lucide-react";

/**
 * 模板选择器：每个模板用「套用之后」的真实外观渲染缩略图。
 *
 * 坚持与外观四轴（主色 / 版式 / 气质 / 疏密）一致的「选感觉不选参数」：
 * 主题此前只是一排文字按钮，用户得先认识"经典 / 社论"才知道长什么样。
 * 缩略图吃的是简历渲染的同一套 CSS 变量，所以所见即所得。
 */
export function TemplateGallery() {
  const { t } = useI18n();
  const appearance = useResumeStore((s) => s.appearance);
  const applyTheme = useResumeStore((s) => s.applyTheme);

  return (
    <div className="grid grid-cols-2 gap-2">
      {listThemes().map((th) => {
        const picked = appearance.theme === th.id;
        // 用「套用该模板后」的外观来算缩略图，颜色与版式差异才真实可见
        const preview = applyThemePreset(appearance, th);
        const vars: CSSProperties = {
          ...resolveResumeTheme(preview),
          ...(th.cssVars ?? {}),
        };
        if (th.fonts) {
          (vars as Record<string, string>)["--rs-heading-font"] = th.fonts.heading;
          (vars as Record<string, string>)["--rs-body-font"] = th.fonts.body;
        }

        return (
          <button
            key={th.id}
            type="button"
            onClick={() => {
              applyTheme(th.id);
              trackEvent(`template:${th.id}`);
            }}
            aria-pressed={picked}
            className={cn(
              "relative rounded-lg border p-1.5 text-left transition-all",
              picked
                ? "border-primary bg-primary/10 ring-2 ring-primary/50"
                : "border-border hover:bg-secondary hover:border-foreground/20",
            )}
          >
            <TemplateThumb vars={vars} sidebar={preview.layout === "sidebar"} />
            <div className={cn("mt-1.5 px-0.5 text-xs font-medium", picked && "text-primary")}>
              {t(th.labelKey)}
            </div>
            {picked && (
              <span
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow"
                aria-hidden
              >
                <Check size={13} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 缩略图骨架：不放真实内容，但吃真实变量（accent / 分隔线 / 姓名字号与大小写 /
 * 版式 / 字体栈），因此模板之间的差异来自真实渲染，而不是画上去的装饰。
 * 背景恒为白纸——简历文档本身就是白纸，不随界面深浅色变化。
 */
function TemplateThumb({ vars, sidebar }: { vars: CSSProperties; sidebar: boolean }) {
  const line = (w: string, key: string) => (
    <div key={key} style={{ width: w, height: 1.5, borderRadius: 1, background: "#cbd5e1" }} />
  );

  const section = (key: string, titleWidth: string) => (
    <div key={key} style={{ marginTop: 4 }}>
      <div
        style={{
          color: "var(--rs-accent)",
          borderBottom: "var(--rs-section-rule, 1.5px solid var(--rs-accent))",
          letterSpacing: "var(--rs-section-spacing, 0.04em)",
          fontFamily: "var(--rs-heading-font)",
          fontWeight: "var(--rs-heading-weight)",
          paddingBottom: 1,
        }}
      >
        <div style={{ width: titleWidth, height: 2.5, background: "var(--rs-accent)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2.5 }}>
        {line("100%", `${key}-l1`)}
        {line("88%", `${key}-l2`)}
        {line("64%", `${key}-l3`)}
      </div>
    </div>
  );

  return (
    <div
      style={{ ...vars, background: "#fff" }}
      className="aspect-[210/297] w-full overflow-hidden rounded p-[5px]"
    >
      <div style={{ display: "flex", gap: 3, height: "100%", fontSize: 5, lineHeight: 1.3 }}>
        {sidebar && (
          <div style={{ width: "32%", display: "flex", flexDirection: "column", gap: 2 }}>
            {line("92%", "sb1")}
            {line("70%", "sb2")}
            {line("84%", "sb3")}
            {line("58%", "sb4")}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--rs-heading-font)",
              fontWeight: "var(--rs-heading-weight)",
              fontSize: "var(--rs-name-size, 1.9em)",
              textTransform: "var(--rs-name-transform, none)",
              color: "#111",
              lineHeight: 1.1,
            }}
          >
            Aa
          </div>
          <div style={{ width: "42%", height: 2, marginTop: 2, background: "var(--rs-accent)" }} />
          {section("sec1", "34%")}
          {section("sec2", "26%")}
        </div>
      </div>
    </div>
  );
}
