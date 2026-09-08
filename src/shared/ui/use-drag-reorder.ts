import { useState } from "react";
import type { DragEvent } from "react";

/**
 * 列表拖拽排序（原生 HTML5 DnD，零第三方依赖）。
 *
 * 两个刻意的设计取舍：
 *  1. 只有「把手」可拖，整卡不设 draggable —— 卡片里全是输入控件，
 *     整卡可拖会和"在输入框里选中文字"冲突。
 *  2. 键盘可达性仍由「上移 / 下移」按钮承担 —— 原生 DnD 无法键盘操作，
 *     所以按钮是保留而非替换，拖拽只是给鼠标用户的快捷方式。
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return {
    /** 拖拽把手：只有它是 draggable */
    handleProps: (index: number) => ({
      draggable: true,
      onDragStart: (e: DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        // Firefox：不写入数据不会启动拖拽
        e.dataTransfer.setData("text/plain", String(index));
        setDragIndex(index);
      },
      onDragEnd: reset,
    }),
    /** 行容器：接收落点并给出高亮反馈 */
    rowProps: (index: number) => ({
      onDragOver: (e: DragEvent) => {
        if (dragIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overIndex !== index) setOverIndex(index);
      },
      onDrop: (e: DragEvent) => {
        if (dragIndex === null) return;
        e.preventDefault();
        if (dragIndex !== index) onReorder(dragIndex, index);
        reset();
      },
    }),
    isDragging: (index: number) => dragIndex === index,
    isOver: (index: number) => dragIndex !== null && dragIndex !== index && overIndex === index,
  };
}
