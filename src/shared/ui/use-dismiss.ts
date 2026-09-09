import { useEffect, useRef } from "react";

/**
 * 浮层（弹层 / 下拉菜单）的关闭副作用：点击外部或按 Esc 即关闭，卸载时解绑。
 *
 * 抽成共用 hook 是因为 ItemDateEditor 与 DropdownMenu 曾各自实现一遍完全相同的
 * 逻辑——重复的副作用最容易在修 bug 时只改一处。这里只依赖 react，
 * 放 shared/ui 不会触碰「shared 不反向依赖上层」的红线。
 *
 * onClose 走 latest-ref：调用方通常传内联箭头函数，若进依赖数组会导致每次渲染
 * 都重新绑定 document 监听。
 */
export function useDismiss(
  ref: { current: HTMLElement | null },
  open: boolean,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCloseRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open]);
}
