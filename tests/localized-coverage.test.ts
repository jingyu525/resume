import { describe, it, expect } from "vitest";
import { localizedSource, localizedValue, localizedText } from "@/shared/lib/localized";

describe("localizedSource 缺省分支（if !field）", () => {
  it("field 为 undefined / null 时返回空值且不回退", () => {
    expect(localizedSource(undefined, "zh")).toEqual({
      value: undefined,
      source: undefined,
      fallback: false,
    });
    expect(localizedValue(null as never, "zh")).toBeUndefined();
    expect(localizedText(undefined, "zh")).toBe("");
  });
});
