import { Mail } from "lucide-react";
import type { BasicsFieldPlugin } from "@/plugins/core/types";

/** 邮箱：地域无关的通用字段 */
export const emailField: BasicsFieldPlugin = {
  id: "basics-email",
  kind: "basics-field",
  labelKey: "edit.email",
  version: 1,
  fieldKey: "email",
  inputType: "email",
  order: 20,
  localized: false,
  icon: Mail,
};
