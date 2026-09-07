import type { AppearancePref } from "@/entities/appearance/model";
import type { ResumeData } from "./model";

/**
 * 持久化快照结构。
 *
 * 放在 entities 是为了让存储插件（src/plugins/storage）与 store 共用同一份定义：
 * 插件层不得依赖 store（规则 A2），store/migrations.ts 从这里 re-export。
 */
export interface PersistedState {
  version: number;
  resume: ResumeData;
  appearance: AppearancePref;
}
