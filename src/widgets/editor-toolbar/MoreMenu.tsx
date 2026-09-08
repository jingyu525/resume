import { useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { useI18n } from "@/shared/i18n";
import { useToast } from "@/shared/ui/toast";
import { DropdownMenu } from "@/shared/ui/dropdown";
import { Dialog } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { exportBackup, useImportBackup } from "@/features/backup-io/backup";
import { MoreHorizontal, Download, Upload, Sparkles, Trash2, Briefcase } from "lucide-react";
import { ROLE_IDS } from "@/plugins/resume-template";

export function MoreMenu() {
  const { t } = useI18n();
  const toast = useToast();
  const fillSample = useResumeStore((s) => s.fillSample);
  const clearAll = useResumeStore((s) => s.clearAll);
  const applyTemplate = useResumeStore((s) => s.applyTemplate);
  const importBackup = useImportBackup();
  const [confirmClear, setConfirmClear] = useState(false);
  const [showRoles, setShowRoles] = useState(false);

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
            onClick: () => {
              fillSample();
              toast(t("toast.sampleFilled"));
            },
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
              onClick={() => {
                applyTemplate(role);
                setShowRoles(false);
                toast(t("toast.sampleFilled"));
              }}
            >
              {t(`role.${role}`)}
            </Button>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={() => setShowRoles(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
