# 設定とコンベンション

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

## テーマシステム

アプリは以下のReact Navigationのテーマプロバイダーを使用しています:

- `useColorScheme` hook(`shared/lib/use-color-scheme.ts`)によるライト/ダークモードサポート
- `shared/config/theme.ts`で定義されたテーマカラーとフォント
- カラースキームに自動適応するテーマ付きコンポーネント(`shared/ui/themed-*.tsx`)
- 動的テーマ設定のための`useThemeColor` hookによるカラー解決

## 開発ノート

- アプリはReact NativeのNew Architecture(app.jsonで有効化)を使用
- React Compilerの実験機能が最適化のために有効
- TypeScriptはstrict modeで設定
- 音声認識のすべてのパーミッションは、両プラットフォームのapp.jsonで適切に設定する必要があります
