import { beforeAll, describe, expect, it } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { useResumeStore } from "@/store/useResumeStore";
import { createSampleResume } from "@/plugins/resume-template";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";

beforeAll(() => bootstrapPlugins());

/**
 * 测试用：直接装载一份带内容的简历。
 * 示例不再允许由 store action 写入（虚构事实不得进入真实容器），
 * 需要内容时由测试显式装载。
 */
function seedSample() {
  useResumeStore.getState().loadState(createSampleResume(), { ...DEFAULT_APPEARANCE });
}

describe("拖拽排序：一次性落到指定位置", () => {
  it("章节可移到任意位置，并重排 order 字段", () => {
    seedSample();
    const before = useResumeStore.getState().resume.sections;
    const firstId = before[0].id;

    useResumeStore.getState().reorderSection(firstId, 3);

    const after = useResumeStore.getState().resume.sections;
    expect(after[3].id).toBe(firstId);
    expect(after.map((s) => s.order)).toEqual(after.map((_, i) => i));
  });

  it("条目可跨多步移动（一次到位，不产生中间态）", () => {
    seedSample();
    const sec = useResumeStore.getState().resume.sections.find((s) => s.kind === "experience")!;
    const ids = sec.items.map((i) => i.id);
    expect(ids.length).toBeGreaterThan(1);

    useResumeStore.getState().reorderItem(sec.id, ids[0], ids.length - 1);

    const moved = useResumeStore.getState().resume.sections.find((s) => s.id === sec.id)!;
    expect(moved.items[moved.items.length - 1].id).toBe(ids[0]);
    expect(moved.items.length).toBe(ids.length);
  });

  it("分组可移到任意位置", () => {
    seedSample();
    const sec = useResumeStore.getState().resume.sections.find((s) => s.kind === "skills")!;
    const ids = sec.groups.map((g) => g.id);
    expect(ids.length).toBeGreaterThan(1);

    useResumeStore.getState().reorderGroup(sec.id, ids[0], ids.length - 1);

    const moved = useResumeStore.getState().resume.sections.find((s) => s.id === sec.id)!;
    expect(moved.groups[moved.groups.length - 1].id).toBe(ids[0]);
  });

  it("越界索引被夹紧到首尾，绝不丢数据", () => {
    seedSample();
    const before = useResumeStore.getState().resume.sections;

    useResumeStore.getState().reorderSection(before[0].id, 999);

    const after = useResumeStore.getState().resume.sections;
    expect(after.length).toBe(before.length);
    expect(after[after.length - 1].id).toBe(before[0].id);
  });
});
