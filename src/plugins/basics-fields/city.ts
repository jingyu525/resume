import { MapPin } from "lucide-react";
import type { BasicsFieldPlugin } from "@/plugins/core/types";

/** 城市：多语言字段（不同语言简历可写不同城市名，如 上海 / Shanghai） */
export const cityField: BasicsFieldPlugin = {
  id: "basics-city",
  kind: "basics-field",
  labelKey: "edit.city",
  version: 1,
  fieldKey: "city",
  inputType: "text",
  order: 30,
  localized: true,
  icon: MapPin,
};
