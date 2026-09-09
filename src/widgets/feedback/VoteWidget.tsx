import { useState } from "react";
import { useI18n } from "@/shared/i18n";
import { IconButton } from "@/shared/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { trackEvent } from "@/shared/analytics/analytics";

/**
 * 一行式满意度信号：👍/👎 直接上报匿名事件（vote:up / vote:down），
 * 零后端、不收集个人数据，比打开 GitHub Issue 门槛更低、覆盖率更高。
 */
export function VoteWidget() {
  const { t } = useI18n();
  const [voted, setVoted] = useState(false);

  if (voted) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t("vote.thanks")}
      </p>
    );
  }

  const vote = (kind: "up" | "down") => {
    trackEvent(`vote:${kind}`);
    setVoted(true);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className="text-sm text-muted-foreground">{t("vote.prompt")}</span>
      <IconButton label={t("vote.up")} onClick={() => vote("up")}>
        <ThumbsUp size={18} />
      </IconButton>
      <IconButton label={t("vote.down")} onClick={() => vote("down")}>
        <ThumbsDown size={18} />
      </IconButton>
    </div>
  );
}
