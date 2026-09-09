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

/** 收集所有块 id，并断言无重复、无丢失 */
function flatIds(pages: Block[][]): string[] {
  return pages.flat().map((b) => b.id);
}

describe("distributeBlocks 分页临界边界 (FR-7)", () => {
  it("内容恰好满页：累计高度 == contentHpx 时整页不换页", () => {
    // 阈值判断为 remaining < need - 0.5，恰好相等时应留在当前页
    const blocks = [item("a", 100), item("b", 100), item("c", 50)];
    const heights = new Map([
      ["a", 100],
      ["b", 100],
      ["c", 50],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    expect(pages).toHaveLength(1);
    expect(flatIds(pages)).toEqual(["a", "b", "c"]);
  });

  it("临界 +0.5：累计超过 contentHpx 半像素即触发换页", () => {
    // a+b=200 占满首页剩余（剩 50），c=51 使剩余 50 < 51-0.5 → 换页
    const blocks = [item("a", 100), item("b", 100), item("c", 51)];
    const heights = new Map([
      ["a", 100],
      ["b", 100],
      ["c", 51],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    expect(pages).toHaveLength(2);
    expect(pages[0].map((b) => b.id)).toEqual(["a", "b"]);
    expect(pages[1].map((b) => b.id)).toEqual(["c"]);
  });

  it("最后一页剩余空间恰好不足一整块（仅差 1px）也换页", () => {
    // 第一页放 200，剩余 50；下一块 51 → 换页
    const blocks = [item("a", 200), item("b", 51)];
    const heights = new Map([
      ["a", 200],
      ["b", 51],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    expect(pages).toHaveLength(2);
    expect(pages[0][0].id).toBe("a");
    expect(pages[1][0].id).toBe("b");
  });

  it("单块高于整页（超高块）：独占一页且不被丢弃、不死循环", () => {
    const blocks = [item("tall", 500), item("after", 50)];
    const heights = new Map([
      ["tall", 500],
      ["after", 50],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    // 超高块独占一页；其后的块进入下一页
    const ids = flatIds(pages);
    expect(ids).toEqual(["tall", "after"]);
    expect(ids).toHaveLength(2);
    expect(pages[0][0].id).toBe("tall");
  });

  it("连续多个超高块：各占一页且不互相吞没", () => {
    const blocks = [item("t1", 300), item("t2", 400), item("t3", 600)];
    const heights = new Map([
      ["t1", 300],
      ["t2", 400],
      ["t3", 600],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    const ids = flatIds(pages);
    expect(ids).toEqual(["t1", "t2", "t3"]);
    expect(ids).toHaveLength(3);
  });

  it("标题不孤行 临界：标题+首块合计恰好 == contentHpx 同页", () => {
    const blocks = [head("h", 20, true), item("i", 230)];
    const heights = new Map([
      ["h", 20],
      ["i", 230],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    expect(pages[0].map((b) => b.id)).toEqual(["h", "i"]);
  });

  it("标题不孤行 临界：标题+首块合计超出 0.5px 即整体移到下一页顶", () => {
    const blocks = [head("h", 20, true), item("i", 231)];
    const heights = new Map([
      ["h", 20],
      ["i", 231],
    ]);
    const pages = distributeBlocks(blocks, heights, 250);
    // 首页只剩标题会被判定为孤行 → 与首块一起落到次页
    expect(pages.length).toBe(2);
    expect(pages[0][0].id).toBe("h");
    expect(pages[1][0].id).toBe("i");
  });

  it("大规模多页：50 块全部被分配且唯一", () => {
    const blocks: Block[] = [];
    const heights = new Map<string, number>();
    for (let i = 0; i < 50; i++) {
      const id = `b${i}`;
      blocks.push(item(id, 60));
      heights.set(id, 60);
    }
    const pages = distributeBlocks(blocks, heights, 250);
    const ids = flatIds(pages);
    expect(ids).toHaveLength(50);
    expect(new Set(ids).size).toBe(50);
    // 每页最多容纳 floor(250/60)=4 块 → 至少 13 页
    expect(pages.length).toBeGreaterThanOrEqual(13);
  });

  it("keepWithNext 首块缺失高度时按 0 计，不抛错", () => {
    const blocks = [head("h", 20, true), item("i", 100)];
    const heights = new Map([["h", 20]]); // i 缺失
    const pages = distributeBlocks(blocks, heights, 250);
    expect(flatIds(pages)).toEqual(["h", "i"]);
  });
});
