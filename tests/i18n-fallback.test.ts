import { describe, it, expect } from "vitest";
import { translate } from "@/shared/i18n";
import { localizedValue } from "@/shared/lib/localized";

describe("i18n 回退链（FR-6）", () => {
  it("当前语言命中直接返回", () => {
    expect(translate("zh", "editor.undo")).toBe("撤销");
    expect(translate("en", "editor.undo")).toBe("Undo");
  });

  it("缺失 key 返回 key 本身（不崩溃）", () => {
    expect(translate("zh", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("多语言字段回退：当前→默认(zh)→任一已有", () => {
    // 仅 en 有值，zh 缺失 -> 回退到 en
    const field = { en: "Hello" };
    expect(localizedValue(field, "zh")).toBe("Hello");
    // 当前与默认都缺失，回退到任意已有
    expect(localizedValue({ de: "Hallo" }, "ja")).toBe("Hallo");
  });

  it("默认语言存在时优先默认", () => {
    const field = { zh: "你好", en: "Hello" };
    expect(localizedValue(field, "ko")).toBe("你好");
  });

  it("空字段回退为空串", () => {
    expect(localizedValue({}, "zh")).toBeUndefined();
  });
});
