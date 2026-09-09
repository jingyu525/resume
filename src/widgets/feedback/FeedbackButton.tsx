import { useLocation } from "react-router-dom";
import { useI18n } from "@/shared/i18n";
import { useToast } from "@/shared/ui/toast";
import { IconButton } from "@/shared/ui/button";
import { MessageSquare } from "lucide-react";
import { openFeedback } from "./openFeedback";

/** 编辑器工具栏内的反馈入口：一键打开预填 GitHub Issue。 */
export function FeedbackButton() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { pathname } = useLocation();

  return (
    <IconButton
      label={t("feedback.label")}
      onClick={() => {
        openFeedback(locale, pathname);
        toast(t("feedback.thanks"));
      }}
    >
      <MessageSquare size={18} />
    </IconButton>
  );
}
