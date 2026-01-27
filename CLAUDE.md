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
- **Package Manager**: Bun (fast, modern JavaScript runtime and package manager)
- **Linter & Formatter**: Biome (fast, modern alternative to ESLint and Prettier)
- **Navigation**: React Navigation 7 with bottom tabs
- **Voice Recognition**: expo-speech-recognition (Expo official package)
- **New Architecture**: Enabled (React Native's new architecture)
- **Experiments**: Typed routes and React Compiler enabled

## Development Commands

This project uses **Bun** as its package manager for faster installation and execution.

```bash
# Install dependencies
bun install

# Start development server
bun start

# Run on iOS
bun ios

# Run on Android
bun android

# Run on web
bun web

# Lint code (with Biome)
bun lint

# Auto-fix lint errors
bun lint:fix

# Format code
bun format

# Reset project (removes example code)
bun reset-project
```

## Project Structure

This project follows **Feature-Sliced Design (FSD)** architecture with two main layers:
- `features/` - Domain-specific features (business logic organized by feature)
- `shared/` - Domain-agnostic code (reusable utilities, UI components, config)

### File-Based Routing (Expo Router)
- `app/_layout.tsx` - Root layout with theme provider and Stack navigator
- `app/(tabs)/_layout.tsx` - Tab layout with Home and Explore tabs
- `app/(tabs)/index.tsx` - Home screen with math flashcard feature
- `app/(tabs)/explore.tsx` - Explore screen
- `app/modal.tsx` - Modal screen example

Routes are generated automatically from the file structure. Typed routes are enabled for type-safe navigation.

### Features Layer (`features/`)

Domain-specific features organized by business capability:

#### `features/math-practice/`
Random math problem generation and practice mode.
- **ui/math-flashcard.tsx** - Main math flashcard component
  - Displays random addition problems (1-20 range)
  - Accepts voice input for answers
  - Provides immediate feedback (correct/incorrect)
  - Tracks statistics and auto-advances
- **model/use-math-flashcard.ts** - Business logic hook
  - Generates random problems (addition, subtraction, multiplication, division)
  - Manages user answers and correctness state
  - Tracks statistics (correct, incorrect, total, accuracy)
  - Database integration for session tracking

#### `features/card-sets/`
Pre-defined card set management and practice mode.
- **ui/card-set-flashcard.tsx** - Card set practice component
  - Displays problems from selected card set
  - Voice recognition for answers
  - Progress tracking through card set
  - Completion screen with statistics
- **ui/card-set-selector.tsx** - Card set selection interface
  - Lists available card sets by grade level
  - Shows card set details (operator, range, count)
  - Initializes default card sets from database
- **model/use-card-set-flashcard.ts** - Card set practice logic
  - Loads and shuffles card sets
  - Tracks progress through card set
  - Database integration for progress persistence

#### `features/voice-recognition/`
Japanese voice input and number recognition.
- **ui/voice-number-recognition.tsx** - Standalone voice UI component
  - Voice recognition interface and results display
  - Supports continuous recognition mode
  - Shows interim results for real-time feedback
- **model/use-voice-number-recognition.ts** - Voice recognition hook
  - Handles Japanese voice input using expo-speech-recognition
  - Implements best-match selection algorithm
  - Auto-restart mode for continuous recognition
  - Configuration: ja-JP, maxAlternatives: 10, continuous mode
- **lib/japanese-number/** - Japanese number parsing utilities
  - `index.ts` - Main exports and scoring function
  - `parser.ts` - Number extraction from Japanese text
  - `constants.ts` - Japanese number mappings and scoring weights
  - `helpers.ts` - String similarity calculation
  - `fuzzy-matching.ts` - Phonetic similarity matching
  - `types.ts` - TypeScript type definitions

### Shared Layer (`shared/`)

Domain-agnostic reusable code:

#### `shared/ui/`
Reusable UI components:
- `themed-text.tsx`, `themed-view.tsx` - Theme-aware components
- `parallax-scroll-view.tsx` - Parallax header scroll view
- `collapsible.tsx` - Expandable content section
- `icon-symbol.tsx` - SF Symbols icons (iOS/Android)
- `external-link.tsx` - In-app browser links
- `haptic-tab.tsx` - Tab with haptic feedback
- `hello-wave.tsx` - Animated wave component

#### `shared/lib/`
Shared hooks and utilities:
- `use-color-scheme.ts` - Color scheme detection hook
- `use-theme-color.ts` - Theme color resolution hook
- `use-sound-effect.ts` - Sound effect playback hook
- `stats.ts` - Statistical calculation utilities
- `card-set-generator.ts` - Card set generation and validation

#### `shared/config/`
Application configuration:
- `theme.ts` - Theme colors and fonts for light/dark mode
- `timing.ts` - Timing constants (delays, transitions)

#### `shared/data/db/`
Database layer (Drizzle ORM + expo-sqlite):
- `client.ts` - Database client and initialization
- `schema.ts` - Table schemas and type definitions
- `service.ts` - Database operations (CRUD for sessions, card sets, progress)

### Other Directories
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

The project uses path aliases configured in `tsconfig.json`:

```typescript
// Root alias (for assets, app, etc.)
import logo from '@/assets/images/logo.png';

// Features layer alias
import { useVoiceNumberRecognition } from '@/features/voice-recognition/model/use-voice-number-recognition';
import MathFlashcard from '@/features/math-practice/ui/math-flashcard';
import CardSetSelector from '@/features/card-sets/ui/card-set-selector';

// Shared layer alias
import { ThemedText } from '@/shared/ui/themed-text';
import { useThemeColor } from '@/shared/lib/use-theme-color';
import { Colors } from '@/shared/config/theme';
import { initializeDatabase } from '@/shared/data/db/client';

// Within same feature: use relative imports
// In features/math-practice/ui/math-flashcard.tsx:
import { useMathFlashcard } from '../model/use-math-flashcard';

// Cross-feature: use absolute imports with @/features/*
// In features/math-practice/ui/math-flashcard.tsx:
import { useVoiceNumberRecognition } from '@/features/voice-recognition/model/use-voice-number-recognition';
```

### Import Guidelines
- **Within same feature**: Use relative imports (`../model/...`)
- **Cross-feature**: Use absolute imports with `@/features/*`
- **Shared layer**: Always use absolute imports with `@/shared/*`
- **Root (assets, app)**: Use `@/*` alias

## Voice Recognition Architecture

The voice recognition feature (`features/voice-recognition/`) is architected with clean separation of concerns:

### Model Layer (`model/use-voice-number-recognition.ts`)
- Manages voice recognition state and lifecycle
- Handles expo-speech-recognition events (start, end, result, error)
- Implements best-match selection algorithm:
  - Receives multiple candidates via `maxAlternatives: 10`
  - Scores each candidate based on number-related keywords
  - Automatically selects the most likely number
- Supports continuous mode for rapid input
- Configuration:
  - lang: "ja-JP"
  - interimResults: true (real-time feedback)
  - maxAlternatives: 10 (for best-match selection)
  - continuous: true (better short pronunciation recognition)
  - contextualStrings: extensive list of Japanese numbers
  - iOS optimization: iosTaskHint: "dictation"

### Library Layer (`lib/japanese-number/`)
- Pure functions for Japanese number parsing
- Handles complex multi-digit numbers (e.g., "二千三百四十五" → "2345")
- Supports multiple formats: hiragana, katakana, kanji, Arabic numerals
- Scoring system for candidate selection:
  - Number keywords: +10 points each
  - Convertible to number: +50 points
  - Contains Arabic numerals: +30 points
  - Single character (non-numeric): -20 points
  - Noise words (です, は, etc.): -15 points each
- Fuzzy matching for phonetically similar Japanese pronunciations

### UI Layer (`ui/voice-number-recognition.tsx`)
- Presentation layer only
- Displays recognition status, interim results, and final results
- Provides user controls (start, stop, continuous mode, clear)
- No business logic - delegates to custom hook

## Theme System

The app uses React Navigation's theme provider with:
- Light/Dark mode support via `useColorScheme` hook (`shared/lib/use-color-scheme.ts`)
- Theme colors and fonts defined in `shared/config/theme.ts`
- Themed components (`shared/ui/themed-*.tsx`) that automatically adapt to color scheme
- Color resolution via `useThemeColor` hook for dynamic theming

## FSD Architecture Benefits

The Feature-Sliced Design architecture provides:
- **Modularity**: Features are self-contained and can be developed independently
- **Scalability**: Easy to add new features without affecting existing ones
- **Maintainability**: Clear separation between business logic (features) and reusable code (shared)
- **Discoverability**: Logical organization makes it easy to find code
- **Import Control**: Clear import patterns prevent circular dependencies
  - Features can depend on shared layer
  - Shared layer is independent (no feature imports)
  - Features should minimize cross-feature dependencies

## Development Notes

- The app uses React Native's New Architecture (enabled in app.json)
- React Compiler experiment is enabled for optimizations
- TypeScript is configured with strict mode
- All permissions for voice recognition must be properly configured in app.json for both platforms
