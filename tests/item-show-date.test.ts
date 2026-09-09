import { beforeAll, describe, expect, it } from "vitest";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { useResumeStore } from "@/store/useResumeStore";
import { createSampleResume } from "@/plugins/resume-template";
import { DEFAULT_APPEARANCE } from "@/entities/appearance/model";
import type { ResumeItem } from "@/entities/resume/model";

beforeAll(() => bootstrapPlugins());

function seedSample() {
  useResumeStore.getState().loadState(createSampleResume(), { ...DEFAULT_APPEARANCE });
}

/** 找到第一个带起止时间的条目及其所属章节 */
function firstDatedItem(): { sectionId: string; item: ResumeItem } {
  for (const s of useResumeStore.getState().resume.sections) {
    const hit = s.items.find((it) => it.startDate !== "" || it.endDate !== "");
    if (hit) return { sectionId: s.id, item: hit };
  }
  throw new Error("示例简历里找不到带起止时间的条目");
}

function reload(sectionId: string, itemId: string): ResumeItem {
  const section = useResumeStore.getState().resume.sections.find((s) => s.id === sectionId);
  const item = section?.items.find((i) => i.id === itemId);
  if (!item) throw new Error("条目丢失");
  return item;
}

describe("setItemShowDate：日期字段的删除与恢复", () => {
  it("删除字段时一并清空起止时间与「至今」", () => {
    seedSample();
    const { sectionId, item } = firstDatedItem();

    useResumeStore.getState().setItemShowDate(sectionId, item.id, false);

    const after = reload(sectionId, item.id);
    expect(after.showDate).toBe(false);
    expect(after.startDate).toBe("");
    expect(after.endDate).toBe("");
    expect(after.current).toBe(false);
  });

  it("删除后再恢复是空白字段，不会复活上一次的旧值", () => {
    seedSample();
    const { sectionId, item } = firstDatedItem();
    expect(item.startDate).not.toBe("");

    useResumeStore.getState().setItemShowDate(sectionId, item.id, false);
    useResumeStore.getState().setItemShowDate(sectionId, item.id, true);

    const after = reload(sectionId, item.id);
    expect(after.showDate).toBe(true);
    expect(after.startDate).toBe("");
    expect(after.endDate).toBe("");
    expect(after.current).toBe(false);
  });

  it("恢复字段不会把已清空的值写回去（show=true 只置标记）", () => {
    seedSample();
    const { sectionId, item } = firstDatedItem();

    useResumeStore.getState().setItemShowDate(sectionId, item.id, false);
    // 用户重新填写
    useResumeStore.getState().updateItemDate(sectionId, item.id, { startDate: "2030-01" });
    useResumeStore.getState().setItemShowDate(sectionId, item.id, false);
    useResumeStore.getState().setItemShowDate(sectionId, item.id, true);

    expect(reload(sectionId, item.id).startDate).toBe("");
  });

  it("只作用于目标条目，不影响同章节其它条目", () => {
    seedSample();
    const section = useResumeStore.getState().resume.sections.find((s) => s.items.length >= 2);
    expect(section).toBeDefined();
    if (!section) return;
    const [target, other] = section.items;
    const before = { startDate: other.startDate, showDate: other.showDate };

    useResumeStore.getState().setItemShowDate(section.id, target.id, false);

    const afterOther = reload(section.id, other.id);
    expect(afterOther.startDate).toBe(before.startDate);
    expect(afterOther.showDate).toBe(before.showDate);
  });
});
