import { Globe } from "lucide-react";
import type { BasicsFieldPlugin } from "@/plugins/core/types";

/** 个人主页 / 作品集链接 */
export const websiteField: BasicsFieldPlugin = {
  id: "basics-website",
  kind: "basics-field",
  labelKey: "edit.website",
  version: 1,
  fieldKey: "website",
  inputType: "url",
  order: 50,
  localized: false,
  icon: Globe,
};
