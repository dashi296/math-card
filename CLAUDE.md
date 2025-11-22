# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Math Card is a React Native mobile application built with Expo that provides an interactive math learning experience using voice recognition. The app allows users to practice addition problems by speaking their answers in Japanese, with automatic scoring and feedback.

### Key Features
- **Voice-Powered Addition Practice**: Random addition problems (1-20 range) with voice input for answers
- **Real-Time Feedback**: Immediate visual feedback for correct/incorrect answers
- **Progress Tracking**: Displays statistics including correct answers, incorrect answers, and accuracy percentage
- **Japanese Voice Recognition**: Converts spoken Japanese numbers to digits using expo-speech-recognition
- **Smart Recognition**: Uses best-match algorithm to select the most likely number from multiple candidates

## Technology Stack

- **Framework**: Expo 54 with React Native 0.81.5
- **Router**: Expo Router 6 (file-based routing)
- **Language**: TypeScript with strict mode
- **Linter & Formatter**: Biome (fast, modern alternative to ESLint and Prettier)
- **Navigation**: React Navigation 7 with bottom tabs
- **Voice Recognition**: expo-speech-recognition (Expo official package)
- **New Architecture**: Enabled (React Native's new architecture)
- **Experiments**: Typed routes and React Compiler enabled

## Development Commands

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Lint code (with Biome)
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Format code
npm run format

# Reset project (removes example code)
npm run reset-project
```

## Project Structure

### File-Based Routing (Expo Router)
- `app/_layout.tsx` - Root layout with theme provider and Stack navigator
- `app/(tabs)/_layout.tsx` - Tab layout with Home and Explore tabs
- `app/(tabs)/index.tsx` - Home screen with math flashcard feature
- `app/(tabs)/explore.tsx` - Explore screen
- `app/modal.tsx` - Modal screen example

Routes are generated automatically from the file structure. Typed routes are enabled for type-safe navigation.

### Components
- `components/math-flashcard.tsx` - Main math flashcard component (addition practice with voice recognition)
  - Displays random addition problems (1-20 range)
  - Accepts voice input for answers using `useVoiceNumberRecognition` hook
  - Provides immediate feedback (correct/incorrect)
  - Tracks statistics (correct, incorrect, accuracy percentage)
  - Auto-advances to next problem after feedback
- `components/voice-number-recognition.tsx` - Standalone voice recognition component (UI only)
  - Displays voice recognition interface and results
  - Uses `useVoiceNumberRecognition` custom hook for logic
  - Supports continuous recognition mode for rapid input
  - Shows interim results for real-time feedback
- `components/themed-*.tsx` - Theme-aware UI components
- `components/ui/` - Reusable UI components (IconSymbol, Collapsible)
- `components/haptic-tab.tsx` - Tab with haptic feedback

### Hooks
- `hooks/use-math-flashcard.ts` - Custom hook for math flashcard logic
  - Generates random addition problems
  - Manages user answers and correctness state
  - Tracks statistics (correct, incorrect, total, accuracy)
  - Returns: problem, userAnswer, isCorrect, stats, showFeedback, checkAnswer, nextProblem, resetStats
- `hooks/use-voice-number-recognition.ts` - Custom hook for voice-based number recognition
  - Handles Japanese voice input using expo-speech-recognition
  - Implements best-match selection from multiple recognition candidates
  - Auto-restart mode for continuous recognition
  - Returns: isListening, recognizedNumber, recognizedText, interimText, error, autoRestart, startListening, stopListening, clearResults, setAutoRestart
- `hooks/use-color-scheme.ts` - Color scheme hook for theme support
- `hooks/use-theme-color.ts` - Theme color hook

### Utils
- `utils/japanese-number-parser.ts` - Japanese number parsing utilities
  - `extractNumber(text: string): string` - Converts Japanese number words to digits
  - `scoreNumberCandidate(text: string): number` - Scores how likely a candidate is a number
  - Supports hiragana, katakana, and kanji (e.g., "いち" → "1", "じゅう" → "10", "二十三" → "23")
  - Handles numbers from 0 to 99999

### Other Directories
- `constants/` - Theme constants and app-wide constants
- `assets/` - Images, fonts, and other static assets

## Platform-Specific Configuration

### iOS (app.json)
- Microphone permission: NSMicrophoneUsageDescription
- Speech recognition permission: NSSpeechRecognitionUsageDescription
- Bundle ID: com.dashi296.mathcard
- Supports tablets

### Android (app.json)
- Permissions: RECORD_AUDIO
- Package: com.dashi296.mathcard
- Edge-to-edge UI enabled
- Predictive back gesture disabled

## Path Aliases

The project uses `@/*` as an alias for the root directory:
```typescript
import { VoiceNumberRecognition } from '@/components/voice-number-recognition';
```

## Voice Recognition Architecture

The voice recognition feature is architected with separation of concerns:

### Custom Hook (hooks/use-voice-number-recognition.ts)
- Manages voice recognition state and lifecycle
- Handles expo-speech-recognition events (start, end, result, error)
- Implements best-match selection algorithm:
  - Receives multiple candidates via `maxAlternatives: 5`
  - Scores each candidate based on number-related keywords
  - Automatically selects the most likely number
- Supports continuous mode for rapid input
- Configuration:
  - lang: "ja-JP"
  - interimResults: true (real-time feedback)
  - maxAlternatives: 5 (for best-match selection)
  - continuous: true (better short pronunciation recognition)
  - contextualStrings: extensive list of Japanese numbers
  - iOS optimization: iosTaskHint: "dictation"

### Utility (utils/japanese-number-parser.ts)
- Pure functions for Japanese number parsing
- Handles complex multi-digit numbers (e.g., "二千三百四十五" → "2345")
- Supports multiple formats: hiragana, katakana, kanji, Arabic numerals
- Scoring system for candidate selection:
  - Number keywords: +10 points each
  - Convertible to number: +50 points
  - Contains Arabic numerals: +30 points
  - Single character (non-numeric): -20 points
  - Noise words (です, は, etc.): -15 points each

### Component (components/voice-number-recognition.tsx)
- Presentation layer only
- Displays recognition status, interim results, and final results
- Provides user controls (start, stop, continuous mode, clear)
- No business logic - delegates to custom hook

## Theme System

The app uses React Navigation's theme provider with:
- Light/Dark mode support via useColorScheme hook
- Theme colors defined in constants/theme.ts
- Themed components that automatically adapt to color scheme

## Development Notes

- The app uses React Native's New Architecture (enabled in app.json)
- React Compiler experiment is enabled for optimizations
- TypeScript is configured with strict mode
- All permissions for voice recognition must be properly configured in app.json for both platforms
