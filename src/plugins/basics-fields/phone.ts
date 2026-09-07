import { Phone } from "lucide-react";
import type { BasicsFieldPlugin } from "@/plugins/core/types";

/** 电话：地域无关的通用字段 */
export const phoneField: BasicsFieldPlugin = {
  id: "basics-phone",
  kind: "basics-field",
  labelKey: "edit.phone",
  version: 1,
  fieldKey: "phone",
  inputType: "tel",
  order: 10,
  localized: false,
  icon: Phone,
};
