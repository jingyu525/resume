import { describe, it, expect } from "vitest";
import { distributeBlocks } from "@/features/pagination/distribute";
import type { Block } from "@/features/pagination/buildBlocks";

function item(id: string, _h: number, keepWithNext = false): Block {
  return {
    id,
    type: "item",
    sectionId: "s",
    hasHeader: true,
    item: {} as never,
    keepWithNext,
  } as Block;
}

function head(id: string, _h: number, keepWithNext = false): Block {
  return { id, type: "section-head", sectionId: "s", title: "T", keepWithNext } as Block;
}

describe("distributeBlocks (FR-7 分页)", () => {
  it("单块不跨页：放不下的块整块移到下一页", () => {
    const blocks = [item("a", 100), item("b", 100), item("c", 100)];
    const heights = new Map([
      ["a", 100],
      ["b", 100],
      ["c", 100],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    expect(pages).toHaveLength(2);
    expect(pages[0].map((b) => b.id)).toEqual(["a", "b"]);
    expect(pages[1].map((b) => b.id)).toEqual(["c"]);
  });

  it("标题不孤行：章节标题与首块一并判断换页", () => {
    const blocks = [head("h", 20, true), item("i", 200)];
    const heights = new Map([
      ["h", 20],
      ["i", 200],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    expect(pages[0].map((b) => b.id)).toEqual(["h", "i"]);
  });

  it("标题单独在页尾时不出现（与首块同页或首块在下一页顶）", () => {
    const blocks = [head("h", 20, true), item("i", 300)];
    const heights = new Map([
      ["h", 20],
      ["i", 300],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    // 标题放首页顶，首块放次页顶，标题不在页尾成孤行
    expect(pages[0][0].id).toBe("h");
    expect(pages[1][0].id).toBe("i");
  });

  it("所有块都被分配且不重复", () => {
    const blocks = [item("a", 50), item("b", 50), item("c", 50)];
    const heights = new Map([
      ["a", 50],
      ["b", 50],
      ["c", 50],
    ]);
    const pages = distributeBlocks(blocks, heights, 1000);
    const flat = pages.flat();
    expect(flat).toHaveLength(3);
    expect(new Set(flat.map((b) => b.id)).size).toBe(3);
  });

  it("空块列表返回单页占位 [[]]", () => {
    expect(distributeBlocks([], new Map(), 250)).toEqual([[]]);
  });

  it("高度缺失的块按 0 计（?? 兜底，不崩）", () => {
    const pages = distributeBlocks([item("a", 100)], new Map(), 250);
    expect(pages[0][0].id).toBe("a");
  });

  it("末块 keepWithNext 但无后继时 && 短路不越界", () => {
    const pages = distributeBlocks([head("h", 20, true)], new Map([["h", 20]]), 250);
    expect(pages[0][0].id).toBe("h");
  });

  it("keepWithNext 后继块高度缺失时按 0 计（?? 兜底分支）", () => {
    const blocks = [head("h", 20, true), item("i", 100)];
    const heights = new Map([["h", 20]]); // i 不在 heights 中
    const pages = distributeBlocks(blocks, heights, 250);
    expect(pages[0].map((b) => b.id)).toEqual(["h", "i"]);
  });
});
