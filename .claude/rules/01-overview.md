# プロジェクト概要

Math Cardは、音声認識を使用したインタラクティブな数学学習体験を提供するReact Nativeモバイルアプリケーション(Expo使用)です。日本語での音声入力により加算問題を練習し、自動採点とフィードバックを受けることができます。

## 主な機能

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
