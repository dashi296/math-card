# Sharedレイヤー

ドメインに依存しない再利用可能なコード。

## `shared/ui/`

再利用可能なUIコンポーネント:

- `themed-text.tsx`, `themed-view.tsx` - テーマ対応コンポーネント
- `parallax-scroll-view.tsx` - パララックスヘッダースクロールビュー
- `collapsible.tsx` - 展開可能なコンテンツセクション
- `icon-symbol.tsx` - SF Symbolsアイコン(iOS/Android)
- `external-link.tsx` - アプリ内ブラウザリンク
- `haptic-tab.tsx` - 触覚フィードバック付きタブ
- `hello-wave.tsx` - アニメーション波コンポーネント

## `shared/lib/`

共有フックとユーティリティ:

- `use-color-scheme.ts` - カラースキーム検出hook
- `use-theme-color.ts` - テーマカラー解決hook
- `use-sound-effect.ts` - 効果音再生hook
- `stats.ts` - 統計計算ユーティリティ
- `card-set-generator.ts` - カードセット生成と検証

## `shared/config/`

アプリケーション設定:

- `theme.ts` - ライト/ダークモードのテーマカラーとフォント
- `timing.ts` - タイミング定数(遅延、トランジション)

## `shared/data/db/`

データベースレイヤー (Drizzle ORM + expo-sqlite):

- `client.ts` - データベースクライアントと初期化
- `schema.ts` - テーブルスキーマと型定義
- `service.ts` - データベース操作(セッション、カードセット、進捗のCRUD)
