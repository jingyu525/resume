import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { createEmptyResume, createSampleResume } from "@/plugins/resume-template";
import { useResumeStore } from "@/store/useResumeStore";
import { ExportMenu } from "@/widgets/editor-toolbar/ExportMenu";
import { ToastProvider } from "@/shared/ui/toast";
import { DEFAULT_LOCALE } from "@/entities/locale";
import { dictionaries } from "@/shared/i18n/dictionaries";

beforeAll(() => bootstrapPlugins());

const dict = dictionaries[DEFAULT_LOCALE];
const exportLabel = dict["export.pdfFile"];

function renderAndExport() {
  render(
    <ToastProvider>
      <ExportMenu />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: exportLabel }));
}

/**
 * 空简历点导出，弹「确定导出空简历？」是没有意义的：用户真正的困惑是
 * 「不知道怎么开始」。此时应直接引导去填写，只保留「部分章节为空」的确认。
 */
describe("整份简历为空时不提供「导出空白」", () => {
  it("字段全空：不弹确认框，改为提示先去填写", () => {
    useResumeStore.setState({ resume: createEmptyResume() });
    renderAndExport();
    expect(screen.queryByText(dict["export.emptyCheck"])).toBeNull();
    expect(screen.getByText(dict["export.emptyAll"])).toBeTruthy();
  });

  it("只有部分章节为空：仍走确认框，不误拦有内容的简历", () => {
    const sample = createSampleResume();
    const target = sample.sections.find((s) => s.kind === "summary") ?? sample.sections[0];
    useResumeStore.setState({
      resume: {
        ...sample,
        sections: sample.sections.map((s) =>
          s.id === target.id ? { ...s, items: [], groups: [] } : s,
        ),
      },
    });
    renderAndExport();
    expect(screen.getByText(dict["export.emptyCheck"])).toBeTruthy();
  });
});
