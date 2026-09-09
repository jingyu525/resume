[中文](./README.zh.md) · [English](./README.md) · [日本語](./README.ja.md) · [Deutsch](./README.de.md) · [한국어](./README.ko.md)

# Résumé Studio · ローカルファーストの履歴書組版スタジオ

> デザインの知識がなくても、履歴書を「Apple のプロ向け文書」レベルの作品に仕上げられます。WYSIWYG、A4 精密ページ分割、5 言語を一源から。
> **すべてはあなたのブラウザ内だけで動作します。バックエンド・アカウント・アップロードはなく、あなたのデータには触れません。**

[![Try Online](https://img.shields.io/badge/%E2%96%B6%20Try%20Online-R%C3%A9sum%C3%A9%20Studio-2563eb?style=for-the-badge)](https://jingyu525.github.io/resume/)
[![Local-First](https://img.shields.io/badge/privacy-local--first-22c55e?style=for-the-badge)]()
[![Open Source](https://img.shields.io/badge/open--source-source--available-6b7280?style=for-the-badge)]()

![Résumé Studio プレビュー](./public/og-cover.png)

## なぜ Résumé Studio なのか

- **デザイン知識ゼロでも作品レベル** —— Word の余白や改ページと格闘する必要はありません。どこでもクリックして編集、リアルタイムで WYSIWYG。
- **データはいつもあなたの手元に** —— 通信せず、収集せず、アップロードもしません。タブを閉じれば持ち運べ、キャッシュを消せば消えます。
- **一度の組版で 5 言語展開** —— 中 / 英 / 日 / 独 / 韓、UI と本文が同期して切り替わり、言語が足りない場合は自動でフォールバック。
- **無料・オープンソース・透明** —— コードは公開され、追跡可能。実装はブラックボックスではありません。

## オンラインで試す

インストール不要、開くだけで使えます：**https://jingyu525.github.io/resume/**

## 主な機能

- **WYSIWYG ＋ A4 精密ページ分割**：1 つのブロックがページをまたがらない、セクション見出しの孤行なし、下部セーフティゾーン、リアルタイム総ページ数、プレビューの自動縮小。
- **その場で編集**：プレビュー内のテキストをクリックして編集。選択ポップオーバーは 太字 / アクセントカラー / 書式リセット の 3 アクションのみ。外部から貼り付けた内容は自動でサニタイズされ、意味とアクセントカラーのみを保持。
- **外観の 4 つの次元**：テーマカラー、レイアウト（単栏 / サイドバー 2 栏）、トーン（フォーマル / ソフト / ライブリー）、密度スライダー。デフォルトへのワンクリック復元。
- **5 言語を一源から**：中 / 英 / 日 / 独 / 韓、UI と履歴書本文が同期して切り替わり、自動フォールバック。
- **ローカルファースト**：ブラウザに自動保存され、リロードしても消えない。検証付きバックアップファイルの書き出し / 読み込みに対応。
- **元に戻す / やり直す**：連続入力は 1 ステップにまとめられ、`Ctrl/Cmd+Z`、`Ctrl/Cmd+Shift+Z`、`Ctrl+Y` に対応。
- **PDF の書き出し / 保存**：ワンクリックで PDF を書き出し。システムのフッターや画面専用要素は用紙に載りません。

## プライバシーに関する約束

私たちはあなたのデータを一切保存しません。バックエンドもアカウントもアップロードもなし —— タブを閉じれば持ち運べ、キャッシュを消せば消えます。これが、多くの SaaS 履歴書ツールと根本的に異なる点です。

## クイックスタート（ローカル開発）

```bash
npm install
npm run dev        # ローカル開発（デフォルト http://localhost:5173）
```

- `/` —— マーケティングランディングページ
- `/editor` —— 履歴書エディタ

## 利用可能なスクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 型チェック ＋ 本番ビルド |
| `npm run preview` | 本番ビルドをプレビュー |
| `npm run lint` | ESLint チェック |
| `npm run typecheck` | 型チェックのみ |
| `npm run test` | Vitest テストを実行 |

## 技術スタック

Vite 7 · React 19 · TypeScript（strict）· Tailwind CSS v4 · Zustand + zundo · DOMPurify · lucide-react · Vitest

コードは **Feature-Sliced Design** に従って層を分け：`app → pages → widgets → features → entities → shared`。
詳細な層構造・状態の流れ・主要モジュール設計は [`ARCHITECTURE.md`](./ARCHITECTURE.md) を参照。

## ディレクトリ概要

```
src/
├── app/        # エントリ、providers（I18n/Theme/Toast）、ルーティング、グローバルスタイル
├── pages/      # landing（マーケティング）、editor
├── widgets/    # landing-hero/features/footer、editor-toolbar、preview-pane
├── features/   # resume-editing、inline-richtext、appearance-control、language-switch、
│               # undo-redo、persistence、backup-io、pagination、print-export
├── entities/   # resume / appearance / locale モデル
├── shared/     # ui（shadcn 風コンポーネント）、lib、types、config、i18n（5 言語辞書）
└── store/      # Zustand store（zundo の undo/redo 含む）、移行と永続化
tests/          # コア純ロジックの単体テスト：sanitize / pagination / i18n fallback / undo merge / migration
```

---

Résumé Studio はオープンソースのプロジェクトです。スターやコントリビューションを歓迎します。サンプルの文案とプレースホルダーはデモンストレーション用です。ご自身の情報に置き換えてください。