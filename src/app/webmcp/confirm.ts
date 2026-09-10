import { useSyncExternalStore } from "react";

/**
 * WebMCP 写操作的确认闸门。
 *
 * 协议的 `consequentialHint` 只是「告诉代理这是重大操作」，是否真的拦下来
 * 取决于浏览器/代理的实现——本应用不能把「用户知情」这件事外包给它们。
 * 所以这里自己做一道闸：工具在真正写入 store **之前** await 本模块，
 * 由 `WebMcpConfirmDialog` 把变更摘要摆到用户面前，用户点同意才落库。
 *
 * 纯模块级状态（非 React state）：`execute` 是普通异步函数，拿不到组件树，
 * 只能通过模块级 Promise 与 UI 通信。
 */

export interface WebMcpConfirmRequest {
  toolName: string;
  /** 待确认变更的可读摘要：一行一条 `field: value` */
  summary: string;
}

type Listener = () => void;

let pending: WebMcpConfirmRequest | null = null;
let resolvePending: ((approved: boolean) => void) | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): WebMcpConfirmRequest | null {
  return pending;
}

/** 供 UI 订阅待确认请求 */
export function useWebMcpConfirm(): WebMcpConfirmRequest | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 当前是否有待确认请求（测试与工具内部使用） */
export function getWebMcpConfirmSnapshot(): WebMcpConfirmRequest | null {
  return pending;
}

/**
 * 请求用户确认，resolve 为用户是否同意。
 *
 * 同一时刻只处理一个请求：代理并发调用写工具时，后到的直接判否（不排队）。
 * 排队会让后一个调用无限期挂起，而代理无法知道自己在等什么。
 */
export function requestWebMcpConfirmation(request: WebMcpConfirmRequest): Promise<boolean> {
  if (pending) return Promise.resolve(false);
  pending = request;
  emit();
  return new Promise<boolean>((resolve) => {
    resolvePending = resolve;
  });
}

/** 用户在弹窗上的决定：同意 / 拒绝 / 关闭（关闭等同拒绝） */
export function resolveWebMcpConfirmation(approved: boolean): void {
  const resolve = resolvePending;
  resolvePending = null;
  pending = null;
  emit();
  resolve?.(approved);
}
