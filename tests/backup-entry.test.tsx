import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EditorToolbar } from "@/widgets/editor-toolbar/EditorToolbar";
import { DEFAULT_LOCALE } from "@/entities/locale";
import { dictionaries } from "@/shared/i18n/dictionaries";

/**
 * 本地存储是易失的（清缓存 / 换设备 / 配额写满），而简历内容是用户唯一
 * 无法重建的东西。因此备份必须在工具栏一级可见——
 * 藏在「更多」菜单里等于没有保险。
 */
describe("导出备份是一级入口", () => {
  it("无需展开任何菜单即可找到导出备份按钮", () => {
    render(
      <MemoryRouter>
        <EditorToolbar onToggleAppearance={() => {}} />
      </MemoryRouter>,
    );
    const label = dictionaries[DEFAULT_LOCALE]["more.export"];
    expect(screen.getByLabelText(label)).toBeTruthy();
  });
});
