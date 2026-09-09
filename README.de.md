[中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md) · [Deutsch](./README.de.md) · [한국어](./README.ko.md)

# Résumé Studio · Ein lokal-firstes Studio für Lebenslauf-Satz

> Auch ohne Design-Vorkenntnisse einen Lebenslauf im „Apple-Pro-Dokument"-Niveau erstellen. WYSIWYG, präzise A4-Seitenumbrüche, fünf Sprachen aus einer Quelle.
> **Alles läuft ausschließlich in deinem Browser: kein Backend, kein Konto, keine Uploads — deine Daten werden nicht angerührt.**

[![Try Online](https://img.shields.io/badge/%E2%96%B6%20Try%20Online-R%C3%A9sum%C3%A9%20Studio-2563eb?style=for-the-badge)](https://jingyu525.github.io/resume/)
[![Local-First](https://img.shields.io/badge/privacy-local--first-22c55e?style=for-the-badge)]()
[![Open Source](https://img.shields.io/badge/open--source-source--available-6b7280?style=for-the-badge)]()

![Résumé Studio Vorschau](./public/og-cover.png)

## Warum Résumé Studio

- **Profi-Qualität ohne Design-Kenntnisse** —— Kein Kampf mit Word-Rändern und Seitenumbrüchen. Klicke zum Bearbeiten, sieh Änderungen in Echtzeit.
- **Deine Daten bleiben bei dir** —— Kein Netzwerk, keine Sammlung, keine Uploads; schließe den Tab und nimm sie mit, leere den Cache und sie sind weg.
- **Einmal satzen, in fünf Sprachen** —— CN / EN / JA / DE / KO, UI und Inhalt wechseln zusammen, mit automatischem Fallback für fehlende Sprachen.
- **Kostenlos, Open Source, transparent** —— Öffentlicher, nachvollziehbarer Code; keine Blackboxes.

## Online ausprobieren

Keine Installation nötig, einfach öffnen: **https://jingyu525.github.io/resume/**

## Kernfunktionen

- **WYSIWYG + präzise A4-Seitenumbrüche**: kein Block wird über eine Seite getrennt, keine verwaisten Abschnittstitel, unterer Schutzraum, live Gesamtseitenzahl, automatische Vorschau-Skalierung.
- **Direkt bearbeiten**: Text in der Vorschau anklicken zum Bearbeiten; das Auswahl-Popover bietet nur drei Aktionen — fett / Akzentfarbe / Format zurücksetzen; eingefügter externer Inhalt wird automatisch bereinigt, es bleiben nur Semantik und Akzentfarbe.
- **Vier Dimensionen des Erscheinungsbilds**: Akzentfarbe, Layout (einspaltig / Seitenleiste zweispaltig), Ton (formal / weich / lebendig) und Dichte-Regler, mit Ein-Klick-Reset auf Standard.
- **Fünf Sprachen aus einer Quelle**: CN / EN / JA / DE / KO, UI und Lebenslauf-Inhalt wechseln zusammen, automatisches Fallback.
- **Lokal-first**: automatisch im Browser gespeichert, übersteht das Neuladen; Export / Import von validierten Backup-Dateien.
- **Rückgängig / Wiederholen**: fortlaufendes Tippen wird zu einem Schritt zusammengefasst; unterstützt `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl+Y`.
- **Export / PDF speichern**: Ein-Klick-PDF-Export, keine Systemfußzeile, keine bildschirm-exklusiven Elemente auf dem Papier.

## Datenschutzversprechen

Wir speichern keine deiner Daten. Kein Backend, kein Konto, keine Uploads — schließe den Tab und nimm es mit, leere den Cache und es verschwindet. Das ist auch der grundlegende Unterschied zu den meisten SaaS-Lebenslauf-Tools.

## Schnellstart (Lokale Entwicklung)

```bash
npm install
npm run dev        # lokale Entwicklung (Standard http://localhost:5173)
```

- `/` —— Marketing-Landingpage
- `/editor` —— Lebenslauf-Editor

## Verfügbare Skripte

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver starten |
| `npm run build` | Typcheck + Produktions-Build |
| `npm run preview` | Produktions-Build vorschauen |
| `npm run lint` | ESLint-Check |
| `npm run typecheck` | Nur Typcheck |
| `npm run test` | Vitest-Tests ausführen |

## Tech-Stack

Vite 7 · React 19 · TypeScript (strict) · Tailwind CSS v4 · Zustand + zundo · DOMPurify · lucide-react · Vitest

Code folgt **Feature-Sliced Design**: `app → pages → widgets → features → entities → shared`.
Details zu Schichtung, Zustandsfluss und zentralen Modulen in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Verzeichnisüberblick

```
src/
├── app/        # Einstieg, Provider (I18n/Theme/Toast), Routing, globale Styles
├── pages/      # landing (Marketing), editor
├── widgets/    # landing-hero/features/footer, editor-toolbar, preview-pane
├── features/   # resume-editing, inline-richtext, appearance-control, language-switch,
│               # undo-redo, persistence, backup-io, pagination, print-export
├── entities/   # resume / appearance / locale Modelle
├── shared/     # ui (shadcn-Stil Komponenten), lib, types, config, i18n (5-Sprachen-Wörterbuch)
└── store/      # Zustand-Store (mit zundo undo/redo), Migrationen & Persistenz
tests/          # Kern-Unit-Tests der reinen Logik: sanitize / pagination / i18n fallback / undo merge / migration
```

---

Résumé Studio ist ein Open-Source-Projekt. Stars und Beiträge sind willkommen. Beispieltexte und Platzhalter dienen nur der Demonstration — ersetze sie durch deine eigenen Informationen.