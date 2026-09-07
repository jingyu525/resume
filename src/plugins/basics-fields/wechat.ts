import { MessageCircle } from "lucide-react";
import type { BasicsFieldPlugin } from "@/plugins/core/types";

/**
 * 微信：地域化字段的样板。
 *
 * 中国场景常用；其它地区可禁用本插件并启用 linkedin / facebook 等同类型插件，
 * 这正是"基本信息字段插件化"要解决的问题（无需改数据模型，M2 后经 contacts 扩展）。
 */
export const wechatField: BasicsFieldPlugin = {
  id: "basics-wechat",
  kind: "basics-field",
  labelKey: "edit.wechat",
  version: 1,
  fieldKey: "wechat",
  inputType: "text",
  order: 40,
  localized: false,
  icon: MessageCircle,
};
