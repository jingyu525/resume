import { useMemo, useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { useToast } from "@/shared/ui/toast";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { exportBackup, useImportBackup } from "@/features/backup-io/backup";
import { localizedText } from "@/shared/lib/localized";
import { richTextToPlain } from "@/shared/lib/sanitize";
import type { Locale } from "@/entities/locale";
import { createSampleResume, roleSkillHints, ROLE_IDS } from "@/plugins/resume-template";
import { MoreHorizontal, Download, Upload, Sparkles, Trash2, Briefcase } from "lucide-react";

export function MoreMenu() {
  const { t } = useI18n();
  const toast = useToast();
  const locale = useResumeStore((s) => s.locale);
  const clearAll = useResumeStore((s) => s.clearAll);
  const applyTemplate = useResumeStore((s) => s.applyTemplate);
  const importBackup = useImportBackup();
  const [confirmClear, setConfirmClear] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [showSample, setShowSample] = useState(false);

  return (
    <>
      <DropdownMenu
        align="end"
        trigger={
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary" aria-label={t("editor.more")}>
            <MoreHorizontal size={18} />
          </span>
        }
        items={[
          {
            label: t("more.import"),
            icon: <Upload size={15} />,
            onClick: importBackup,
          },
          {
            label: t("more.export"),
            icon: <Download size={15} />,
            onClick: () => {
              exportBackup();
              toast(t("toast.exported"));
            },
          },
          {
            label: t("more.fillSample"),
            icon: <Sparkles size={15} />,
            onClick: () => setShowSample(true),
          },
          {
            label: t("more.roleTemplate"),
            icon: <Briefcase size={15} />,
            onClick: () => setShowRoles(true),
          },
          {
            label: t("more.clear"),
            icon: <Trash2 size={15} />,
            danger: true,
            onClick: () => setConfirmClear(true),
          },
        ]}
      />

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title={t("more.clear")}>
        <p className="text-sm text-muted-foreground">{t("more.confirmClear")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmClear(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              clearAll();
              setConfirmClear(false);
              toast(t("toast.cleared"));
            }}
          >
            {t("common.confirm")}
          </Button>
        </div>
      </Dialog>

      <Dialog open={showRoles} onClose={() => setShowRoles(false)} title={t("more.roleTemplate")}>
        <p className="text-sm text-muted-foreground">{t("more.roleTemplate.confirm")}</p>
        <div className="mt-4 flex flex-col gap-2">
          {ROLE_IDS.map((role) => (
            <Button
              key={role}
              variant="outline"
              className="h-auto flex-col items-start gap-0.5 py-2"
              onClick={() => {
                applyTemplate(role);
                setShowRoles(false);
                toast(t("toast.templateApplied"));
              }}
            >
              <span className="text-sm">{t(`role.${role}`)}</span>
              {/* 明示该岗位会给出哪些技能分类：这是领域知识，也是模板唯一会写入的东西 */}
              <span className="text-xs font-normal text-muted-foreground">
                {roleSkillHints(role, locale)
                  .map((h) => h.name)
                  .join(" / ")}
              </span>
            </Button>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={() => setShowRoles(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </Dialog>

      <SampleReferenceDialog
        open={showSample}
        onClose={() => setShowSample(false)}
        locale={locale}
      />
    </>
  );
}

/**
 * 示例写法参考：只读展示，绝不写入简历数据。
 *
 * 第一性原理：简历内容是用户自己的事实，系统只能提供结构、措辞范式与排版。
 * 示例一旦写进真实容器，就产生不可消除的真假混淆（漏改一处即以虚构身份投递），
 * 因此这里只做「看着参考」，用户的简历数据不受任何影响。
 */
function SampleReferenceDialog({
  open,
  onClose,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
}) {
  const { t } = useI18n();
  const sample = useMemo(() => createSampleResume(), []);

  return (
    <Dialog open={open} onClose={onClose} title={t("more.fillSample")} className="max-w-xl">
      <p className="text-sm text-muted-foreground">{t("sample.refDesc")}</p>
      <div className="mt-4 max-h-[60vh] space-y-3 overflow-auto pr-1">
        {sample.sections.map((sec) => (
          <div key={sec.id} className="rounded-lg border border-border p-3">
            <div className="mb-1 text-sm font-semibold">{localizedText(sec.title, locale)}</div>
            {sec.items.map((it) => {
              const title = localizedText(it.title, locale);
              const subtitle = localizedText(it.subtitle, locale);
              const desc = richTextToPlain(localizedText(it.description, locale));
              return (
                <div key={it.id} className="text-xs text-muted-foreground">
                  {(title || subtitle) && (
                    <div>
                      {title && <span className="font-medium text-foreground">{title}</span>}
                      {subtitle && ` · ${subtitle}`}
                    </div>
                  )}
                  {desc && <p className="mt-1 whitespace-pre-line">{desc}</p>}
                </div>
              );
            })}
            {sec.groups.map((g) => (
              <div key={g.id} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{localizedText(g.name, locale)}</span>
                <p className="mt-1 whitespace-pre-line">{localizedText(g.items, locale)}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
