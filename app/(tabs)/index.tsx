import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CardSetFlashcard from '@/features/card-sets/ui/card-set-flashcard';
import { Fonts } from '@/shared/config/theme';
import { useAppColors } from '@/shared/lib/use-app-colors';

export default function HomeScreen() {
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

      <View style={styles.flashcardContainer}>
        <CardSetFlashcard />
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
  flashcardContainer: {
    flex: 1,
    minHeight: 600,
    paddingHorizontal: 4,
  },
});
