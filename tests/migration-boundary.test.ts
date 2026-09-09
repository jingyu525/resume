import { describe, it, expect } from "vitest";
import { migrate, validateBackup, STORAGE_VERSION } from "@/store/migrations";

/**
 * 持久化迁移边界（FR-9 升级不丢数据、不报错）。
 * 既有 migration.test / migration-branches.test 已覆盖损坏输入、非法语言、未知 kind、
 * appearance 各分支等；本文件锁定「v1→v2 升级补齐插件扩展字段 fields」这条迁移钩子，
 * 以及「无 version 字段」「validateBackup 透传 migrate 剔除非法语言」两条易漏边界。
 */
describe("migrations 边界（v1→v2 升级 / 版本兜底）", () => {
  it("v1 数据（章节无 fields）迁移后每个章节都补齐 fields 容器", () => {
    const v1 = {
      version: 1,
      resume: {
        basics: { name: { zh: "李" } },
        sections: [
          {
            id: "s1",
            kind: "experience",
            title: { zh: "经历" },
            visible: true,
            order: 0,
            items: [{ id: "it1", title: { zh: "A" } }],
          },
          {
            id: "s2",
            kind: "skills",
            title: { zh: "技能" },
            visible: true,
            order: 1,
            items: [],
            groups: [{ id: "g1", name: { zh: "语言" }, items: { zh: "中文" } }],
          },
        ],
      },
      appearance: {},
    };
    const r = migrate(v1);
    expect(r.version).toBe(STORAGE_VERSION);
    // 升级钩子必须给每个章节补上 fields（即使原 v1 完全没有该字段）
    for (const sec of r.resume.sections) {
      expect(sec).toHaveProperty("fields");
      expect(typeof sec.fields).toBe("object");
    }
    // v2 已存在 fields 的章节不应被清空
    const withFields = migrate({
      version: 1,
      resume: {
        basics: { name: { zh: "李" } },
        sections: [
          {
            id: "s",
            kind: "experience",
            title: { zh: "T" },
            visible: true,
            order: 0,
            items: [],
            fields: { custom: "keep" },
          },
        ],
      },
      appearance: {},
    });
    expect((withFields.resume.sections[0].fields as Record<string, unknown>).custom).toBe("keep");
  });

  it("缺 version 字段时退化为当前版本并仍补全结构", () => {
    const r = migrate({ resume: { basics: {}, sections: [] }, appearance: {} });
    expect(r.version).toBe(STORAGE_VERSION);
    expect(r.resume.sections.length).toBeGreaterThan(0);
  });

  it("validateBackup 复用 migrate 的非法语言剔除：导入即净化", () => {
    const raw = {
      version: 1,
      resume: {
        basics: { name: { zh: "李", xx: "bad" } },
        sections: [
          { id: "s", kind: "experience", title: { zh: "T", xx: "no" }, visible: true, order: 0, items: [] },
        ],
      },
      appearance: {},
    };
    expect(validateBackup(raw)).toBe(true);
    // 通过 migrate 后确认非法语言已被剔除（validateBackup 内部调用 sanitizeLocales）
    const r = migrate(raw);
    expect((r.resume.basics.name as Record<string, string>).xx).toBeUndefined();
    expect(r.resume.sections[0].title.zh).toBe("T");
    expect((r.resume.sections[0].title as Record<string, string>).xx).toBeUndefined();
  });

  it("整段数据为真实损坏 JSON 字符串（非对象）时 migrate 不崩且兜底", () => {
    const r = migrate("}{not valid json" as unknown);
    expect(r.version).toBe(STORAGE_VERSION);
    expect(r.resume.sections.length).toBeGreaterThan(0);
  });

  it("未知 kind 章节经 migrate 后数据完整保留（buildBlocks 仅跳过渲染，不丢数据）", () => {
    const r = migrate({
      version: STORAGE_VERSION,
      resume: {
        basics: { name: { zh: "X" } },
        sections: [
          {
            id: "s",
            kind: "my-custom-plugin-section",
            title: { zh: "自定义" },
            visible: true,
            order: 0,
            items: [{ id: "it", title: { zh: "内容" }, description: { zh: "详情" } }],
          },
        ],
      },
      appearance: {},
    });
    expect(r.resume.sections).toHaveLength(1);
    expect(r.resume.sections[0].kind).toBe("my-custom-plugin-section");
    expect(r.resume.sections[0].items[0].description?.zh).toBe("详情");
  });
});
