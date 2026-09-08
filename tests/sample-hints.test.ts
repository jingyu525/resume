import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import {
  resetSampleHintCache,
  sampleHints,
  withSampleHint,
} from "@/plugins/sample-hints";

beforeAll(() => bootstrapPlugins());
beforeEach(() => resetSampleHintCache());

describe("示例提示：只读提取，绝不写入简历数据", () => {
  it("条目型章节提取 标题/副标题/描述 示例", () => {
    const h = sampleHints("experience", "zh");
    expect(h.title).toBeTruthy();
    expect(h.subtitle).toBeTruthy();
    expect(h.description).toBeTruthy();
  });

  it("分组型章节提取 分组名/技能列表 示例", () => {
    const h = sampleHints("skills", "zh");
    expect(h.groupName).toBeTruthy();
    expect(h.groupItems).toBeTruthy();
  });

  it("描述示例已转为纯文本（不带富文本标签）", () => {
    const h = sampleHints("experience", "zh");
    expect(h.description).toBeTruthy();
    expect(h.description).not.toContain("<p>");
    expect(h.description).not.toContain("<em");
  });

  it("未注册的 kind 返回空对象而不抛错", () => {
    expect(sampleHints("no-such-kind", "zh")).toEqual({});
  });

  it("同一 kind 不同语言给出不同示例", () => {
    const zh = sampleHints("experience", "zh");
    const en = sampleHints("experience", "en");
    expect(zh.title).toBeTruthy();
    expect(en.title).toBeTruthy();
    expect(zh.title).not.toBe(en.title);
  });

  it("withSampleHint：有示例才拼接，无示例保留原提示", () => {
    expect(withSampleHint("公司名", "星河科技", "例：")).toBe("公司名 · 例：星河科技");
    expect(withSampleHint("公司名", undefined, "例：")).toBe("公司名");
  });
});
