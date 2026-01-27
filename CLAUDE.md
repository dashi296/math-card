# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリでコードを操作する際のガイダンスを提供します。

## プロジェクト概要

Math Cardは、音声認識を使用したインタラクティブな数学学習体験を提供するReact Nativeモバイルアプリケーション(Expo使用)です。日本語での音声入力により加算問題を練習し、自動採点とフィードバックを受けることができます。

### 主な機能
- **音声対応の計算練習**: ランダムな計算問題(1-20の範囲)に音声で回答
- **リアルタイムフィードバック**: 正解/不正解の即座の視覚的フィードバック
- **進捗追跡**: 正解数、不正解数、正答率などの統計表示
- **日本語音声認識**: expo-speech-recognitionを使用して日本語の数字を音声認識しデジタル変換
- **スマート認識**: ベストマッチアルゴリズムで複数の候補から最も可能性の高い数字を選択

## 技術スタック

- **フレームワーク**: Expo 54 + React Native 0.81.5
- **ルーター**: Expo Router 6(ファイルベースルーティング)
- **言語**: TypeScript(strict mode有効)
- **パッケージマネージャー**: Bun(高速で現代的なJavaScriptランタイム/パッケージマネージャー)
- **リンター & フォーマッター**: Biome(ESLintとPrettierの高速で現代的な代替)
- **ナビゲーション**: React Navigation 7 + ボトムタブ
- **音声認識**: expo-speech-recognition(Expo公式パッケージ)
- **New Architecture**: 有効(React Nativeの新アーキテクチャ)
- **実験的機能**: 型付きルートとReact Compilerが有効

## 開発コマンド

このプロジェクトはパッケージマネージャーとして**Bun**を使用しています。

```bash
# 依存関係のインストール
bun install

# 開発サーバーの起動
bun start

# iOSで実行
bun ios

# Androidで実行
bun android

# Webで実行
bun web

# コードのリント(Biome使用)
bun lint

# リントエラーの自動修正
bun lint:fix

# コードのフォーマット
bun format

# プロジェクトのリセット(サンプルコードの削除)
bun reset-project
```

## プロジェクト構造

このプロジェクトは**Feature-Sliced Design (FSD)** アーキテクチャに従い、2つの主要レイヤーで構成されています:
- `features/` - ドメイン固有の機能(機能別に整理されたビジネスロジック)
- `shared/` - ドメインに依存しないコード(再利用可能なユーティリティ、UIコンポーネント、設定)

### ファイルベースルーティング (Expo Router)
- `app/_layout.tsx` - テーマプロバイダーとStackナビゲーターを含むルートレイアウト
- `app/(tabs)/_layout.tsx` - HomeとExploreタブを含むタブレイアウト
- `app/(tabs)/index.tsx` - 数学フラッシュカード機能を含むホーム画面
- `app/(tabs)/explore.tsx` - Explore画面
- `app/modal.tsx` - モーダル画面の例

ルートはファイル構造から自動生成されます。型安全なナビゲーションのための型付きルートが有効です。

### Featuresレイヤー (`features/`)

ビジネス機能別に整理されたドメイン固有の機能:

#### `features/math-practice/`
ランダムな数学問題の生成と練習モード。
- **ui/math-flashcard.tsx** - メインの数学フラッシュカードコンポーネント
  - ランダムな加算問題(1-20の範囲)を表示
  - 音声入力で回答を受け付け
  - 即座のフィードバック(正解/不正解)を提供
  - 統計を追跡し自動で次の問題に進む
- **model/use-math-flashcard.ts** - ビジネスロジックhook
  - ランダムな問題を生成(加算、減算、乗算、除算)
  - ユーザーの回答と正誤状態を管理
  - 統計(正解、不正解、合計、正答率)を追跡
  - セッション追跡のためのデータベース統合

#### `features/card-sets/`
事前定義されたカードセットの管理と練習モード。
- **ui/card-set-flashcard.tsx** - カードセット練習コンポーネント
  - 選択されたカードセットから問題を表示
  - 回答のための音声認識
  - カードセット内の進捗追跡
  - 統計を含む完了画面
- **ui/card-set-selector.tsx** - カードセット選択インターフェース
  - 学年別に利用可能なカードセットをリスト表示
  - カードセットの詳細(演算子、範囲、枚数)を表示
  - データベースからデフォルトのカードセットを初期化
- **model/use-card-set-flashcard.ts** - カードセット練習ロジック
  - カードセットの読み込みとシャッフル
  - カードセット内の進捗追跡
  - 進捗永続化のためのデータベース統合

#### `features/voice-recognition/`
日本語音声入力と数字認識。
- **ui/voice-number-recognition.tsx** - スタンドアロン音声UIコンポーネント
  - 音声認識インターフェースと結果表示
  - 継続認識モードをサポート
  - リアルタイムフィードバックのための暫定結果を表示
- **model/use-voice-number-recognition.ts** - 音声認識hook
  - expo-speech-recognitionを使用した日本語音声入力処理
  - ベストマッチ選択アルゴリズムの実装
  - 継続認識のための自動再開モード
  - 設定: ja-JP、maxAlternatives: 10、continuous mode
- **lib/japanese-number/** - 日本語数字解析ユーティリティ
  - `index.ts` - メインのエクスポートとスコアリング関数
  - `parser.ts` - 日本語テキストからの数字抽出
  - `constants.ts` - 日本語数字のマッピングとスコアリングウェイト
  - `helpers.ts` - 文字列類似度計算
  - `fuzzy-matching.ts` - 音韻的類似度マッチング
  - `types.ts` - TypeScript型定義

### Sharedレイヤー (`shared/`)

ドメインに依存しない再利用可能なコード:

#### `shared/ui/`
再利用可能なUIコンポーネント:
- `themed-text.tsx`, `themed-view.tsx` - テーマ対応コンポーネント
- `parallax-scroll-view.tsx` - パララックスヘッダースクロールビュー
- `collapsible.tsx` - 展開可能なコンテンツセクション
- `icon-symbol.tsx` - SF Symbolsアイコン(iOS/Android)
- `external-link.tsx` - アプリ内ブラウザリンク
- `haptic-tab.tsx` - 触覚フィードバック付きタブ
- `hello-wave.tsx` - アニメーション波コンポーネント

#### `shared/lib/`
共有フックとユーティリティ:
- `use-color-scheme.ts` - カラースキーム検出hook
- `use-theme-color.ts` - テーマカラー解決hook
- `use-sound-effect.ts` - 効果音再生hook
- `stats.ts` - 統計計算ユーティリティ
- `card-set-generator.ts` - カードセット生成と検証

#### `shared/config/`
アプリケーション設定:
- `theme.ts` - ライト/ダークモードのテーマカラーとフォント
- `timing.ts` - タイミング定数(遅延、トランジション)

#### `shared/data/db/`
データベースレイヤー (Drizzle ORM + expo-sqlite):
- `client.ts` - データベースクライアントと初期化
- `schema.ts` - テーブルスキーマと型定義
- `service.ts` - データベース操作(セッション、カードセット、進捗のCRUD)

### その他のディレクトリ
- `assets/` - 画像、フォント、その他の静的アセット

## プラットフォーム固有の設定

### iOS (app.json)
- マイク権限: NSMicrophoneUsageDescription
- 音声認識権限: NSSpeechRecognitionUsageDescription
- Bundle ID: com.dashi296.mathcard
- タブレット対応

### Android (app.json)
- パーミッション: RECORD_AUDIO
- パッケージ: com.dashi296.mathcard
- Edge-to-edge UI有効
- 予測的な戻るジェスチャー無効

## パスエイリアス

プロジェクトは`tsconfig.json`で設定されたパスエイリアスを使用しています:

```typescript
// ルートエイリアス(assets、appなど用)
import logo from '@/assets/images/logo.png';

// Featuresレイヤーエイリアス
import { useVoiceNumberRecognition } from '@/features/voice-recognition/model/use-voice-number-recognition';
import MathFlashcard from '@/features/math-practice/ui/math-flashcard';
import CardSetSelector from '@/features/card-sets/ui/card-set-selector';

// Sharedレイヤーエイリアス
import { ThemedText } from '@/shared/ui/themed-text';
import { useThemeColor } from '@/shared/lib/use-theme-color';
import { Colors } from '@/shared/config/theme';
import { initializeDatabase } from '@/shared/data/db/client';

// 同一feature内: 相対インポートを使用
// features/math-practice/ui/math-flashcard.tsx内:
import { useMathFlashcard } from '../model/use-math-flashcard';

// feature間: @/features/*を使用した絶対インポート
// features/math-practice/ui/math-flashcard.tsx内:
import { useVoiceNumberRecognition } from '@/features/voice-recognition/model/use-voice-number-recognition';
```

### インポートガイドライン
- **同一feature内**: 相対インポートを使用(`../model/...`)
- **feature間**: `@/features/*`を使用した絶対インポート
- **Sharedレイヤー**: 常に`@/shared/*`を使用した絶対インポート
- **ルート(assets、app)**: `@/*`エイリアスを使用

## 音声認識アーキテクチャ

音声認識機能(`features/voice-recognition/`)は、関心事の明確な分離を持つアーキテクチャで構成されています:

### Modelレイヤー (`model/use-voice-number-recognition.ts`)
- 音声認識状態とライフサイクルを管理
- expo-speech-recognitionイベント(start、end、result、error)を処理
- ベストマッチ選択アルゴリズムの実装:
  - `maxAlternatives: 10`で複数の候補を受信
  - 数字関連キーワードに基づいて各候補をスコアリング
  - 最も可能性の高い数字を自動選択
- 迅速な入力のための継続モードをサポート
- 設定:
  - lang: "ja-JP"
  - interimResults: true(リアルタイムフィードバック)
  - maxAlternatives: 10(ベストマッチ選択用)
  - continuous: true(短い発音認識の改善)
  - contextualStrings: 日本語数字の広範なリスト
  - iOS最適化: iosTaskHint: "dictation"

### Libraryレイヤー (`lib/japanese-number/`)
- 日本語数字解析用の純粋関数
- 複雑な複数桁の数字を処理(例: "二千三百四十五" → "2345")
- 複数形式をサポート: ひらがな、カタカナ、漢字、アラビア数字
- 候補選択用のスコアリングシステム:
  - 数字キーワード: 各+10ポイント
  - 数字に変換可能: +50ポイント
  - アラビア数字を含む: +30ポイント
  - 単一文字(非数字): -20ポイント
  - ノイズワード(です、は、など): 各-15ポイント
- 音韻的に類似した日本語発音のファジーマッチング

### UIレイヤー (`ui/voice-number-recognition.tsx`)
- プレゼンテーションレイヤーのみ
- 認識状態、暫定結果、最終結果を表示
- ユーザーコントロールを提供(開始、停止、継続モード、クリア)
- ビジネスロジックなし - カスタムhookに委譲

## テーマシステム

アプリは以下のReact Navigationのテーマプロバイダーを使用しています:
- `useColorScheme` hook(`shared/lib/use-color-scheme.ts`)によるライト/ダークモードサポート
- `shared/config/theme.ts`で定義されたテーマカラーとフォント
- カラースキームに自動適応するテーマ付きコンポーネント(`shared/ui/themed-*.tsx`)
- 動的テーマ設定のための`useThemeColor` hookによるカラー解決

## FSDアーキテクチャの利点

Feature-Sliced Designアーキテクチャは以下を提供します:
- **モジュール性**: 機能は自己完結的で独立して開発可能
- **スケーラビリティ**: 既存機能に影響を与えずに新機能を追加しやすい
- **保守性**: ビジネスロジック(features)と再利用可能なコード(shared)の明確な分離
- **発見可能性**: 論理的な構成によりコードを見つけやすい
- **インポート制御**: 明確なインポートパターンにより循環依存を防止
  - Featuresはsharedレイヤーに依存可能
  - Sharedレイヤーは独立(featureのインポートなし)
  - Features間の依存は最小限に抑えるべき

## 開発ノート

- アプリはReact NativeのNew Architecture(app.jsonで有効化)を使用
- React Compilerの実験機能が最適化のために有効
- TypeScriptはstrict modeで設定
- 音声認識のすべてのパーミッションは、両プラットフォームのapp.jsonで適切に設定する必要があります
