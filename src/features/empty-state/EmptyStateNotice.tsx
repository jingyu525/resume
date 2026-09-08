import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { AlertTriangle, Info } from "lucide-react";
import type { ResumeEmptiness } from "./detect";

/**
 * 空状态提示。
 *
 * 渲染空（全隐藏 / 缺插件）用警示样式：内容明明在却看不见，
 * 用户会以为数据丢了，必须说清楚原因。
 * 事实空用中性样式：那只是还没开始填，不该吓到用户。
 */
export function EmptyStateNotice({ state }: { state: ResumeEmptiness }) {
  const { t } = useI18n();
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const sections = useResumeStore((s) => s.resume.sections);

  if (state.kind === "ok") return null;

  if (state.kind === "no-content") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-2.5 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>{t("empty.noContent")}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        {state.kind === "no-sections" && <p>{t("empty.noSections")}</p>}

        {state.kind === "all-hidden" && (
          <>
            <p>{t("empty.allHidden", { n: state.count })}</p>
            <button
              type="button"
              className="mt-1.5 rounded border border-border px-2 py-1 hover:bg-secondary"
              onClick={() => {
                sections.filter((s) => !s.visible).forEach((s) => toggleSection(s.id));
              }}
            >
              {t("empty.showAll")}
            </button>
          </>
        )}

        {state.kind === "missing-plugin" && (
          <p>{t("empty.missingPlugin", { titles: state.titles.join("、") })}</p>
        )}
      </div>
    </div>
  );
}
