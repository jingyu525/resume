import type { Locale } from "@/entities/locale";
import { localizedText } from "@/shared/lib/localized";
import { richTextToPlain } from "@/shared/lib/sanitize";
import { getSectionType } from "./core/registry";

/**
 * 示例提示：从章节插件自带的 createSample() 提取字段级示例文本。
 *
 * 第一性原理：简历内容是用户自己的事实，系统只能提供结构、措辞范式与排版，
 * 不能提供事实。因此示例【只能作为占位提示呈现，永不写入简历数据】——
 * 一旦虚构事实进入真实容器，就产生不可消除的真假混淆（用户漏改一处即以
 * 「李知行 / example.com」投递出去）。
 *
 * 这里只做只读提取与按语言缓存，不产生任何 store 写入。
 */

export interface SampleHints {
  /** 条目主标题（公司 / 项目 / 学校名） */
  title?: string;
  /** 条目副标题（职位 / 角色） */
  subtitle?: string;
  /** 条目描述（经历 / 成果的写法范式） */
  description?: string;
  /** 分组名（技能分类） */
  groupName?: string;
  /** 分组内容（技能列表） */
  groupItems?: string;
}

/** 单行输入框很窄，示例过长会被截断反而看不清；描述类可稍长以示范写法 */
const MAX_SHORT = 24;
const MAX_LONG = 60;

const cache = new Map<string, SampleHints>();

function normalize(text: string, max: number): string | undefined {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

/**
 * 取某章节类型在当前语言下的示例提示。
 *
 * 注册表未就绪（如单测未 bootstrap）或插件未提供 createSample 时返回空对象——
 * 降级为空提示即可，绝不抛错，绝不阻塞编辑。
 */
export function sampleHints(kind: string, locale: Locale): SampleHints {
  const key = `${kind}:${locale}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const hints: SampleHints = {};
  const sample = getSectionType(kind)?.createSample?.();
  if (sample) {
    const item = sample.items[0];
    if (item) {
      hints.title = normalize(localizedText(item.title, locale), MAX_SHORT);
      hints.subtitle = normalize(localizedText(item.subtitle, locale), MAX_SHORT);
      hints.description = normalize(
        richTextToPlain(localizedText(item.description, locale)),
        MAX_LONG,
      );
    }
    const group = sample.groups[0];
    if (group) {
      hints.groupName = normalize(localizedText(group.name, locale), MAX_SHORT);
      // 技能列表是多行标签，横排展示前几个即可表达「这里填什么」
      hints.groupItems = normalize(
        localizedText(group.items, locale).split("\n").join(" / "),
        MAX_LONG,
      );
    }
  }
  cache.set(key, hints);
  return hints;
}

/**
 * 把示例拼进原有占位提示。
 *
 * placeholder 只在字段为空时可见，因此天然满足「一输入即消失」——
 * 示例永远不会与用户真实内容混合。
 */
export function withSampleHint(
  base: string,
  sample: string | undefined,
  egPrefix: string,
): string {
  if (!sample) return base;
  return `${base} · ${egPrefix}${sample}`;
}

/** 仅供测试：清空按语言缓存。 */
export function resetSampleHintCache(): void {
  cache.clear();
}
