import type { LocalePackPlugin } from "@/plugins/core/types";

/**
 * 示范语言包：法语（fr）。
 *
 * 演示「界面语言可插件安装」——本包只翻译了常用键，其余键经 fallback 回退到 en
 * （规则 I2：新增语言包允许声明 fallback，未覆盖的 key 走回退链、非阻断）。
 * 真实交付时可由社区补全全部 126 个键。
 */
export const frPack: LocalePackPlugin = {
  id: "locale-fr",
  kind: "locale-pack",
  labelKey: "language.fr",
  version: 1,
  code: "fr",
  label: "Français",
  fallback: "en",
  dict: {
    fr: {
      "language.fr": "Français",
      "edit.basic": "Profil",
      "edit.sections": "Sections",
      "edit.addSection": "Ajouter une section",
      "edit.itemTitlePlaceholder": "Titre (ex. entreprise)",
      "edit.itemSubtitlePlaceholder": "Sous-titre (ex. poste)",
      "edit.summaryPlaceholder": "Description",
      "edit.startDate": "Début",
      "edit.endDate": "Fin",
      "edit.current": "Actuel",
      "edit.up": "Monter",
      "edit.down": "Descendre",
      "edit.delete": "Supprimer",
      "edit.addItem": "Ajouter une entrée",
      "edit.addGroup": "Ajouter un groupe",
      "edit.missingPlugin": "Plugin de section manquant — données conservées.",
      "edit.fillHint": "Cliquez sur le texte de l'aperçu pour le modifier.",
      "sec.summary": "Profil",
      "sec.experience": "Expérience",
      "sec.project": "Projets",
      "sec.education": "Formation",
      "sec.skills": "Compétences",
      "theme.classic": "Classique",
      "theme.modern": "Moderne",
      "theme.editorial": "Éditorial",
      "theme.minimal": "Minimal",
      "more.language": "Langue",
      "more.export": "Exporter",
      "more.clear": "Effacer",
    },
  },
};
