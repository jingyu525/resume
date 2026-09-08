/**
 * 未保存改动标记（P1-11 退出拦截用）。
 *
 * 仅为一个模块级布尔量，不读写 localStorage（规则 S3 只放行存储插件 / 插件开关模块），
 * 由 useAutoSave 在编辑触发时置位、写盘完成后清除。
 */
let dirty = false;

export function markDirty(): void {
  dirty = true;
}

export function clearDirty(): void {
  dirty = false;
}

export function isDirty(): boolean {
  return dirty;
}
