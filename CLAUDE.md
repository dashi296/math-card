# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Math Card is a React Native mobile application built with Expo that provides voice-based number recognition in Japanese. The app allows users to speak numbers in Japanese and converts them to numerical digits.

## Technology Stack

- **Framework**: Expo 54 with React Native 0.81.5
- **Router**: Expo Router 6 (file-based routing)
- **Language**: TypeScript with strict mode
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

# Lint code
npm run lint

# Reset project (removes example code)
npm run reset-project
```

## Project Structure

### File-Based Routing (Expo Router)
- `app/_layout.tsx` - Root layout with theme provider and Stack navigator
- `app/(tabs)/_layout.tsx` - Tab layout with Home and Explore tabs
- `app/(tabs)/index.tsx` - Home screen with voice recognition feature
- `app/(tabs)/explore.tsx` - Explore screen
- `app/modal.tsx` - Modal screen example

Routes are generated automatically from the file structure. Typed routes are enabled for type-safe navigation.

### Components
- `components/voice-number-recognition.tsx` - Main voice recognition component
  - Handles Japanese voice input using expo-speech-recognition
  - Converts Japanese number words to digits (e.g., "いち" → "1", "じゅう" → "10")
  - Supports both hiragana/katakana and kanji number inputs
  - Uses `useSpeechRecognitionEvent` hooks for event handling (start, end, result, error)
- `components/themed-*.tsx` - Theme-aware UI components
- `components/ui/` - Reusable UI components (IconSymbol, Collapsible)
- `components/haptic-tab.tsx` - Tab with haptic feedback

### Other Directories
- `hooks/` - Custom React hooks (color scheme, theme color)
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

## Voice Recognition Implementation

The voice recognition feature (components/voice-number-recognition.tsx) requires understanding of:
- expo-speech-recognition module with `ExpoSpeechRecognitionModule.start()` and `.stop()` methods
- `useSpeechRecognitionEvent` hooks for event handling (start, end, result, error)
- Japanese number conversion logic (handles multiple formats: kanji, hiragana, katakana, and multi-digit numbers)
- Recognition options: lang, interimResults, maxAlternatives, continuous, contextualStrings
- Android-specific recording options with AudioEncodingAndroid

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
