import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";
import { resolveWebMcpConfirmation, useWebMcpConfirm } from "./confirm";

/**
 * AI 代理请求修改简历时的确认弹窗。
 *
 * 弹窗关闭（Esc / 点遮罩 / 右上角）一律等同「拒绝」——对写操作来说，
 * 「没明确同意」必须按拒绝处理，不能按同意。
 */
export function WebMcpConfirmDialog() {
  const { t } = useI18n();
  const request = useWebMcpConfirm();

  return (
    <Dialog
      open={request !== null}
      onClose={() => resolveWebMcpConfirmation(false)}
      title={t("webmcp.confirm.title")}
    >
      <div className="flex items-start gap-2.5">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-sm text-muted-foreground">{t("webmcp.confirm.body")}</p>
      </div>

      {request && (
        <pre className="no-print mt-3 max-h-40 overflow-auto rounded-lg bg-secondary p-3 text-xs whitespace-pre-wrap">
          {request.summary}
        </pre>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={() => resolveWebMcpConfirmation(false)}>
          {t("webmcp.confirm.reject")}
        </Button>
        <Button onClick={() => resolveWebMcpConfirmation(true)}>
          {t("webmcp.confirm.approve")}
        </Button>
      </div>
    </Dialog>
  );
}
