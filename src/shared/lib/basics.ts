import type { BasicInfo, Localized } from "@/entities/resume/model";
import type { Locale } from "@/entities/locale";
import { localizedText } from "./localized";

/**
 * 读取基本信息字段插件声明的值。
 *
 * 放在 shared：预览区（features/pagination/BlockView）与左编辑面板（features/resume-editing）
 * 都要按同一套规则取值，且 shared 不能依赖 plugins，所以参数是结构化字段描述而非插件对象。
 * 字段由插件声明，键名编译期不可知，只能按下标取（插件契约保证 fieldKey 合法）。
 */
export function readBasicField(
  basics: BasicInfo,
  field: { fieldKey: string; localized: boolean },
  locale: Locale,
): string {
  const raw = (basics as unknown as Record<string, unknown>)[field.fieldKey];
  if (field.localized) return localizedText(raw as Localized<string>, locale);
  return typeof raw === "string" ? raw : "";
}
