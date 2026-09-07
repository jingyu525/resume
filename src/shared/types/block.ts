import type { ResumeItem, SkillGroup } from "@/entities/resume/model";

/**
 * 分页原子块。
 *
 * 放在 shared/types 而非 entities：它不是领域实体，而是"分页与渲染的派生视图结构"
 * （hasHeader / keepWithNext 都服务于版面），同时又被 entities 之外的多层共用——
 * 章节类型插件（src/plugins/section-types）要用它描述产出，
 * 而插件层按 FSD 不得反向依赖 features（规则 A4）。
 *
 * features/pagination/buildBlocks.ts 从这里 re-export，调用方无需改动。
 */
export type Block =
  | { id: string; type: "basics"; keepWithNext?: boolean }
  | { id: string; type: "section-head"; sectionId: string; title: string; keepWithNext: boolean }
  | {
      id: string;
      type: "item";
      sectionId: string;
      hasHeader: boolean;
      item: ResumeItem;
      keepWithNext?: boolean;
      /** 产出该块的章节类型插件 kind，供 BlockView 查回渲染器 */
      sectionKind?: string;
    }
  | {
      id: string;
      type: "skill-group";
      sectionId: string;
      group: SkillGroup;
      keepWithNext?: boolean;
      sectionKind?: string;
    };

export interface BlockTree {
  sidebar: Block[];
  main: Block[];
}
