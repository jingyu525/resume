import { describe, it, expect } from "vitest";
import { translate } from "@/shared/i18n";
import {
  localizedValue,
  localizedText,
  localizedSource,
  isRichEmpty,
} from "@/shared/lib/localized";

describe("i18n 回退链（FR-6）", () => {
  it("当前语言命中直接返回", () => {
    expect(translate("zh", "editor.undo")).toBe("撤销");
    expect(translate("en", "editor.undo")).toBe("Undo");
  });

  it("缺失 key 返回 key 本身（不崩溃）", () => {
    expect(translate("zh", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("多语言字段回退：当前→默认(en)→任一已有", () => {
    // 仅 en 有值，当前 zh 缺失 -> 默认 en 命中 -> 回退到 en
    const field = { en: "Hello" };
    expect(localizedValue(field, "zh")).toBe("Hello");
    // 当前与默认都缺失，回退到任意已有
    expect(localizedValue({ de: "Hallo" }, "ja")).toBe("Hallo");
  });

  it("默认语言存在时优先默认（默认语言为 en）", () => {
    const field = { zh: "你好", en: "Hello" };
    // ko 缺失 -> 优先回退到默认语言 en
    expect(localizedValue(field, "ko")).toBe("Hello");
  });

  it("空字段回退为空串", () => {
    expect(localizedValue({}, "zh")).toBeUndefined();
  });

  it("当前语言字段值为 null 时跳过回退链", () => {
    expect(localizedValue({ zh: null } as Record<string, string | null>, "zh")).toBeUndefined();
  });

  it("localizedText 缺值回退空串", () => {
    expect(localizedText({}, "zh")).toBe("");
  });
});

describe("localizedSource（回退可见性：编辑区据此标注来源语言）", () => {
  it("当前语言命中：非回退，source 为当前语言", () => {
    expect(localizedSource({ zh: "你好", de: "Hallo" }, "de")).toEqual({
      value: "Hallo",
      source: "de",
      fallback: false,
    });
  });

  it("当前语言缺失回退到默认语言：标为回退并给出来源语言", () => {
    // 德语缺失 -> 显示默认语言 en，编辑区需提示「正在显示 English 回退」
    expect(localizedSource({ zh: "自我评价", en: "Summary" }, "de")).toEqual({
      value: "Summary",
      source: "en",
      fallback: true,
    });
  });

  it("当前与默认都缺失：回退到任一已有语言", () => {
    expect(localizedSource({ en: "Summary" }, "ja")).toEqual({
      value: "Summary",
      source: "en",
      fallback: true,
    });
  });

  it("字段为空时既不回退也无来源", () => {
    expect(localizedSource({}, "de")).toEqual({
      value: undefined,
      source: undefined,
      fallback: false,
    });
  });

  it("localizedValue 与 localizedSource 取值一致（单一回退实现）", () => {
    const field = { zh: "你好", ko: "안녕" };
    for (const l of ["zh", "en", "ja", "de", "ko"] as const) {
      expect(localizedValue(field, l)).toBe(localizedSource(field, l).value);
    }
  });
});

describe("isRichEmpty (富文本空值判定)", () => {
  it("undefined/空串/纯空白视为空", () => {
    expect(isRichEmpty(undefined)).toBe(true);
    expect(isRichEmpty("")).toBe(true);
    expect(isRichEmpty("   ")).toBe(true);
  });

  it("仅含标签无可见文本视为空", () => {
    expect(isRichEmpty("<p></p>")).toBe(true);
    expect(isRichEmpty("<p><br></p>")).toBe(true);
  });

  it("含可见文本视为非空", () => {
    expect(isRichEmpty("<p>你好</p>")).toBe(false);
    expect(isRichEmpty("a&nbsp;b")).toBe(false);
  });
});
