/** 原生打印导出（FR-8）：调用系统打印 → 另存为 PDF，保留矢量文字，屏幕专属元素不上纸 */
export function triggerPrint() {
  window.print();
}
