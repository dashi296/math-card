# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリでコードを操作する際のガイダンスを提供します。

## ドキュメント構成

プロジェクトの詳細なドキュメントは`.claude/rules/`ディレクトリに分割されています:

1. **[プロジェクト概要](.claude/rules/01-overview.md)**
   - アプリケーションの目的と主な機能
   - 技術スタック
   - 開発コマンド

2. **[アーキテクチャ](.claude/rules/02-architecture.md)**
   - Feature-Sliced Design (FSD)の概要
   - ファイルベースルーティング
   - FSDの利点

3. **[Featuresレイヤー](.claude/rules/03-features-layer.md)**
   - math-practice: 数学問題生成と練習
   - card-sets: カードセット管理
   - voice-recognition: 音声認識機能

4. **[Sharedレイヤー](.claude/rules/04-shared-layer.md)**
   - UIコンポーネント
   - 共有ライブラリとユーティリティ
   - 設定とデータベース

5. **[音声認識アーキテクチャ](.claude/rules/05-voice-recognition.md)**
   - Model/Library/UIレイヤーの詳細
   - ベストマッチ選択アルゴリズム
   - スコアリングシステム

6. **[設定とコンベンション](.claude/rules/06-configuration.md)**
   - パスエイリアスとインポートガイドライン
   - プラットフォーム固有の設定
   - テーマシステム
   - 開発ノート

## クイックスタート

```bash
# 依存関係のインストール
bun install

# 開発サーバーの起動
bun start

# コードのリントと自動修正
bun lint:fix
```

## 重要な原則

- **FSDアーキテクチャ**: featuresとsharedの2層構造を維持
- **インポート**: 同一feature内は相対パス、feature間/sharedは絶対パス(`@/`)を使用
- **パッケージマネージャー**: Bunを使用(npmではなく)
- **リンター**: Biomeを使用(ESLint/Prettierではなく)
