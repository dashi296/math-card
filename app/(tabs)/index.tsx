import { Image } from 'expo-image';
import { useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import CardSetFlashcard from '@/components/card-set-flashcard';
import MathFlashcard from '@/components/math-flashcard';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Mode = 'card-set' | 'random';

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>('card-set');

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">音声で計算練習</ThemedText>
      </ThemedView>

      {/* Mode Selection */}
      <ThemedView style={styles.modeSelector}>
        <View style={styles.modeSelectorButtons}>
          <Button
            title="カードセットモード"
            onPress={() => setMode('card-set')}
            color={mode === 'card-set' ? '#4CAF50' : '#757575'}
          />
          <Button
            title="ランダムモード"
            onPress={() => setMode('random')}
            color={mode === 'random' ? '#4CAF50' : '#757575'}
          />
        </View>
      </ThemedView>

      <ThemedView style={styles.flashcardContainer}>
        {mode === 'card-set' ? <CardSetFlashcard /> : <MathFlashcard />}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  modeSelector: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modeSelectorButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  flashcardContainer: {
    flex: 1,
    minHeight: 600,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
