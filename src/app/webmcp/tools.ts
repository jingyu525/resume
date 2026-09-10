import { useResumeStore } from "@/store/useResumeStore";
import { ACCENT_COLORS, LAYOUTS, TONES } from "@/shared/config/presets";
import { detectEmptySections } from "@/shared/lib/emptySections";
import { localizedText } from "@/shared/lib/localized";
import { BUILTIN_LOCALES } from "@/entities/locale";
import { getDefaultExporter, registeredLocales } from "@/plugins/core/registry";
import { runExport } from "@/features/print-export/runExport";
import { exportBackup } from "@/features/backup-io/backup";
import type { AppearancePref } from "@/entities/appearance/model";
import { requestWebMcpConfirmation } from "./confirm";
import type { WebMcpTool } from "./types";

/**
 * 工具描述一律用英文：它面向的是浏览器内的 AI 代理（跨语言通用），
 * 不能随界面语言变化——同一个工具的描述在会话中途换语言会让代理认知混乱。
 * 界面文案仍然全部走 i18n 字典（规则 I1），两者互不影响。
 */

/** 会随界面语言切换的姓名字段（写当前语言） */
const LOCALIZED_BASIC_FIELDS = ["name", "title", "city"] as const;
/** 与语言无关的联系方式字段 */
const PLAIN_BASIC_FIELDS = ["phone", "email", "wechat", "website"] as const;

type LocalizedBasicField = (typeof LOCALIZED_BASIC_FIELDS)[number];
type PlainBasicField = (typeof PLAIN_BASIC_FIELDS)[number];

/** 一次待应用的字段变更；`localized` 决定写进当前语言还是语言无关字段 */
type BasicChange =
  | { field: LocalizedBasicField; value: string; localized: true }
  | { field: PlainBasicField; value: string; localized: false };

/** 已注册语言（内置五语 + 语言包插件贡献的语言） */
function availableLocales(): string[] {
  return Array.from(new Set<string>([...BUILTIN_LOCALES, ...registeredLocales()]));
}

/**
 * 应用能力的 WebMCP 工具集。
 *
 * 设计原则（对齐 Chrome 最佳实践）：
 * - 单一职责、不重叠；工具数量克制（注册过多会消耗代理上下文、引发工具混淆）。
 * - 只暴露既有能力，绝不新增网络请求或后端调用——本应用本地优先，
 *   所有写操作都经 store，因此照样进撤销历史、照样被自动保存。
 * - 非法输入返回「可操作的错误信息」，而不是抛异常。
 */
export function buildResumeTools(): WebMcpTool[] {
  return [
    {
      name: "get_resume",
      description:
        "Get the user's full résumé as JSON: basic info, all sections, appearance settings and the current UI language.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: () => {
        const { resume, appearance, locale } = useResumeStore.getState();
        return JSON.stringify({ resume, appearance, locale }, null, 2);
      },
    },

    {
      name: "list_sections",
      description:
        "List the résumé sections in display order, with each section's kind, title, visibility and whether it is still empty.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: () => {
        const { resume, locale } = useResumeStore.getState();
        const rows = resume.sections.map((section) => ({
          kind: section.kind,
          title: localizedText(section.title, locale) || section.kind,
          visible: section.visible,
          empty:
            detectEmptySections({ ...resume, sections: [section] }, locale).length > 0,
        }));
        return JSON.stringify(rows, null, 2);
      },
    },

    {
      name: "update_basics",
      description:
        "Update fields in the résumé header. name, title and city are localized and are written to the currently active UI language; phone, email, wechat and website are language-neutral. The change is applied only after the user approves it in a confirmation dialog.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name, e.g. 'Zhang Wei'." },
          title: {
            type: "string",
            description: "Professional headline, e.g. 'Senior Frontend Engineer'.",
          },
          phone: { type: "string", description: "Phone number." },
          email: { type: "string", description: "Email address." },
          city: { type: "string", description: "City or location." },
          wechat: { type: "string", description: "WeChat ID." },
          website: { type: "string", description: "Personal site or portfolio URL." },
        },
        required: [],
      },
      // 会改写用户亲手填的内容，属于重大操作：代理/浏览器应据此要求确认
      annotations: { consequentialHint: true },
      execute: async (input) => {
        const changes: BasicChange[] = [];
        for (const field of LOCALIZED_BASIC_FIELDS) {
          const value = input[field];
          if (typeof value === "string") changes.push({ field, value, localized: true });
        }
        for (const field of PLAIN_BASIC_FIELDS) {
          const value = input[field];
          if (typeof value === "string") changes.push({ field, value, localized: false });
        }
        if (changes.length === 0) {
          return "Nothing to update: pass at least one of name, title, phone, email, city, wechat, website.";
        }

        /*
         * 写用户内容前必须拿到用户本人的同意：代理不能替用户决定简历里写什么。
         * 注意顺序——先收集、确认通过后才落库，绝不"先写再问"。
         */
        const approved = await requestWebMcpConfirmation({
          toolName: "update_basics",
          summary: changes.map((c) => `${c.field}: ${c.value}`).join("\n"),
        });
        if (!approved) {
          return "The user did not approve this change; the résumé was left untouched. Ask them before retrying.";
        }

        const store = useResumeStore.getState();
        for (const change of changes) {
          if (change.localized) {
            store.updateBasicLocalized(change.field, store.locale, change.value);
          } else {
            store.updateBasicPlain(change.field, change.value);
          }
        }
        return `Updated basic info: ${changes.map((c) => c.field).join(", ")}.`;
      },
    },

    {
      name: "set_locale",
      description:
        "Switch the editor UI language. This also decides which language the localized résumé fields are read from and written to.",
      inputSchema: {
        type: "object",
        properties: {
          locale: {
            type: "string",
            enum: availableLocales(),
            description: "BCP-47 language code.",
          },
        },
        required: ["locale"],
      },
      execute: (input) => {
        const requested = typeof input.locale === "string" ? input.locale : "";
        const allowed = availableLocales();
        if (!allowed.includes(requested)) {
          return `Unknown locale "${requested}". Available locales: ${allowed.join(", ")}.`;
        }
        useResumeStore.getState().setLocale(requested);
        return `UI language switched to "${requested}".`;
      },
    },

    {
      name: "set_appearance",
      description:
        "Adjust how the résumé looks: accent color, column layout, typographic tone, or light/dark mode of the editor.",
      inputSchema: {
        type: "object",
        properties: {
          accent: {
            type: "string",
            enum: ACCENT_COLORS.map((c) => c.label),
            description: "Accent color preset, by name.",
          },
          layout: {
            type: "string",
            enum: LAYOUTS.map((l) => l.value),
            description:
              "'single' = one column; 'sidebar' = two columns with the profile/skills in a side panel.",
          },
          tone: {
            type: "string",
            enum: TONES.map((t) => t.value),
            description: "Typographic tone: 'formal', 'soft' or 'lively'.",
          },
          mode: {
            type: "string",
            enum: ["light", "dark", "system"],
            description: "Light/dark appearance of the editor.",
          },
        },
        required: [],
      },
      execute: (input) => {
        const patch: Partial<AppearancePref> = {};
        const applied: string[] = [];

        if (typeof input.accent === "string") {
          const needle = input.accent.toLowerCase();
          const hit = ACCENT_COLORS.find(
            (c) => c.label.toLowerCase() === needle || c.value.toLowerCase() === needle,
          );
          if (!hit) {
            return `Unknown accent "${input.accent}". Available: ${ACCENT_COLORS.map((c) => c.label).join(", ")}.`;
          }
          patch.accent = hit.value;
          applied.push(`accent=${hit.label}`);
        }

        if (typeof input.layout === "string") {
          const hit = LAYOUTS.find((l) => l.value === input.layout);
          if (!hit) {
            return `Unknown layout "${input.layout}". Available: ${LAYOUTS.map((l) => l.value).join(", ")}.`;
          }
          patch.layout = hit.value;
          applied.push(`layout=${hit.value}`);
        }

        if (typeof input.tone === "string") {
          const hit = TONES.find((t) => t.value === input.tone);
          if (!hit) {
            return `Unknown tone "${input.tone}". Available: ${TONES.map((t) => t.value).join(", ")}.`;
          }
          patch.tone = hit.value;
          applied.push(`tone=${hit.value}`);
        }

        if (typeof input.mode === "string") {
          if (input.mode !== "light" && input.mode !== "dark" && input.mode !== "system") {
            return `Unknown mode "${input.mode}". Available: light, dark, system.`;
          }
          patch.mode = input.mode;
          applied.push(`mode=${input.mode}`);
        }

        if (applied.length === 0) {
          return "Nothing to update: pass at least one of accent, layout, tone, mode.";
        }
        useResumeStore.getState().setAppearance(patch);
        return `Appearance updated: ${applied.join(", ")}.`;
      },
    },

    {
      name: "export_pdf",
      description:
        "Export the résumé as an A4 PDF, generated in the browser, and start the file download.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        const exporter = getDefaultExporter();
        if (!exporter) return "No default PDF exporter is registered.";
        if (document.querySelectorAll(".print-area").length === 0) {
          return "The résumé preview is not rendered yet. Open the editor page (/editor) first, then retry.";
        }
        await runExport(exporter);
        return "PDF export finished; the browser should be downloading the file.";
      },
    },

    {
      name: "export_backup",
      description:
        "Download a JSON backup of the résumé and appearance settings. This is the user's only protection against losing local data.",
      inputSchema: { type: "object", properties: {} },
      execute: () => {
        exportBackup();
        return "Backup download started.";
      },
    },
  ];
}
