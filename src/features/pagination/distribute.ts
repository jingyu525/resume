import type { Block } from "./buildBlocks";

/**
 * 纯函数分页分配（FR-7）：把有序原子块分配到固定内容高度的 A4 页。
 * - 单块不跨页：每个块原子放入，放不下整块移到下一页。
 * - 标题不孤行：keepWithNext 的章节标题与紧随的首块一并判断是否换页。
 * 该函数在 DOM 之外运行，便于单元测试。
 */
export function distributeBlocks(
  blocks: Block[],
  heights: Map<string, number>,
  contentHpx: number,
): Block[][] {
  const laid: Block[][] = [];
  let page: Block[] = [];
  let remaining = contentHpx;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const h = heights.get(b.id) ?? 0;
    let need = h;
    if (b.keepWithNext && blocks[i + 1]) {
      need += heights.get(blocks[i + 1].id) ?? 0;
    }
    if (remaining < need - 0.5 && page.length > 0) {
      laid.push(page);
      page = [];
      remaining = contentHpx;
    }
    page.push(b);
    remaining -= h;
  }
  if (page.length) laid.push(page);
  return laid.length ? laid : [[]];
}
