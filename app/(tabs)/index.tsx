import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CardSetFlashcard from '@/features/card-sets/ui/card-set-flashcard';
import MathFlashcard from '@/features/math-practice/ui/math-flashcard';
import { Fonts } from '@/shared/config/theme';
import { useAppColors } from '@/shared/lib/use-app-colors';

type Mode = 'card-set' | 'random';

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>('card-set');
  const c = useAppColors();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: c.surfaceSecondary }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.headerEmoji]}>🧮</Text>
        <Text style={[styles.title, { color: c.textPrimary, fontFamily: Fonts?.rounded }]}>
          音声で計算練習
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          声で答えて、どんどん上達しよう
        </Text>
      </View>

      <View style={[styles.modeToggle, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Pressable
          style={[styles.modeTab, mode === 'card-set' && { backgroundColor: c.primary }]}
          onPress={() => setMode('card-set')}
        >
          <Text
            style={[
              styles.modeTabText,
              {
                color: mode === 'card-set' ? c.primaryText : c.textSecondary,
                fontFamily: Fonts?.rounded,
              },
            ]}
          >
            カードセット
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeTab, mode === 'random' && { backgroundColor: c.primary }]}
          onPress={() => setMode('random')}
        >
          <Text
            style={[
              styles.modeTabText,
              {
                color: mode === 'random' ? c.primaryText : c.textSecondary,
                fontFamily: Fonts?.rounded,
              },
            ]}
          >
            ランダム
          </Text>
        </Pressable>
      </View>

      <View style={styles.flashcardContainer}>
        {mode === 'card-set' ? <CardSetFlashcard /> : <MathFlashcard />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  flashcardContainer: {
    flex: 1,
    minHeight: 600,
    paddingHorizontal: 4,
  },
});
