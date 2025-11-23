import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { CardSet } from '@/db/schema';
import { useCardSetFlashcard } from '@/hooks/use-card-set-flashcard';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { useVoiceNumberRecognition } from '@/hooks/use-voice-number-recognition';
import CardSetSelector from './card-set-selector';

export default function CardSetFlashcard() {
  const [selectedCardSet, setSelectedCardSet] = useState<CardSet | null>(null);

  const {
    currentCard,
    userAnswer,
    isCorrect,
    stats,
    showFeedback,
    isCompleted,
    checkAnswer,
    nextCard,
    resetFeedback,
  } = useCardSetFlashcard(selectedCardSet);

  const {
    isListening,
    recognizedNumber,
    interimText,
    error,
    startListening,
    stopListening,
    clearResults,
  } = useVoiceNumberRecognition();

  const { playCorrectSound, playIncorrectSound } = useSoundEffect();

  // Track the last checked number to avoid duplicate checks
  const lastCheckedNumberRef = useRef<string | null>(null);

  // Track if user has started (first manual start)
  const [hasStarted, setHasStarted] = useState(false);

  // カードセットが変更されたら、セッションをリセット
  useEffect(() => {
    setHasStarted(false);
    clearResults();
    lastCheckedNumberRef.current = null;
  }, [clearResults]);

  // Play sound effect when answer is checked
  useEffect(() => {
    if (showFeedback) {
      if (isCorrect) {
        console.log('[Sound] Playing correct sound');
        playCorrectSound();
      } else {
        console.log('[Sound] Playing incorrect sound');
        playIncorrectSound();
      }
    }
  }, [showFeedback, isCorrect, playCorrectSound, playIncorrectSound]);

  // Auto-advance to next card if answer is correct
  useEffect(() => {
    if (showFeedback && isCorrect) {
      console.log('[Auto-advance] Correct answer! Clearing results and moving to next card');

      // Clear the recognized number
      clearResults();

      // Wait a bit for clearResults to take effect before generating next card
      const timer = setTimeout(() => {
        console.log('[Auto-advance] Now generating next card');
        nextCard();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showFeedback, isCorrect, clearResults, nextCard]);

  // Auto-start voice recognition when a new card is shown (only after initial start)
  useEffect(() => {
    if (hasStarted && currentCard && !showFeedback && !isListening) {
      console.log('[Auto-start] Starting voice recognition automatically');

      // Only reset ref if recognizedNumber has been cleared
      if (!recognizedNumber) {
        console.log('[Auto-start] Resetting lastCheckedNumberRef to null');
        lastCheckedNumberRef.current = null;
      }

      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        startListening();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [hasStarted, currentCard, showFeedback, isListening, recognizedNumber, startListening]);

  // Auto-check answer when a number is recognized
  useEffect(() => {
    if (recognizedNumber && !showFeedback && recognizedNumber !== lastCheckedNumberRef.current) {
      const answer = Number.parseInt(recognizedNumber, 10);

      if (!Number.isNaN(answer)) {
        console.log('Stopping listening and checking answer:', answer);
        stopListening();
        lastCheckedNumberRef.current = recognizedNumber;
        checkAnswer(answer);
      }
    }
  }, [recognizedNumber, showFeedback, checkAnswer, stopListening]);

  const handleStart = () => {
    console.log('[Start] User started the session');
    setHasStarted(true);
    startListening();
  };

  const handleRetry = () => {
    console.log('[Retry] User retrying the same card');
    clearResults();
    lastCheckedNumberRef.current = null;
    resetFeedback();
  };

  const handleBackToSelection = () => {
    setSelectedCardSet(null);
    setHasStarted(false);
    clearResults();
    lastCheckedNumberRef.current = null;
  };

  // カードセットが選択されていない場合は、選択画面を表示
  if (!selectedCardSet) {
    return <CardSetSelector onSelectCardSet={setSelectedCardSet} selectedCardSetId={null} />;
  }

  // 全てのカードが完了した場合
  if (isCompleted) {
    const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '0.0';

    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>おめでとうございます!</Text>
          <Text style={styles.completionMessage}>全てのカードを完了しました!</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>正解</Text>
              <Text style={[styles.statValue, styles.correctText]}>{stats.correct}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>不正解</Text>
              <Text style={[styles.statValue, styles.incorrectText]}>{stats.incorrect}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>正解率</Text>
              <Text style={styles.statValue}>{accuracy}%</Text>
            </View>
          </View>

          <View style={styles.button}>
            <Button
              title="別のカードセットを選ぶ"
              onPress={handleBackToSelection}
              color="#2196F3"
            />
          </View>
        </View>
      </View>
    );
  }

  // カードが読み込まれていない場合
  if (!currentCard) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>カードを読み込み中...</Text>
      </View>
    );
  }

  const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.cardSetName}>{selectedCardSet.name}</Text>
        <Text style={styles.progressText}>
          {stats.currentCardIndex + 1} / {stats.totalCards} 枚目
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>正解</Text>
          <Text style={[styles.statValue, styles.correctText]}>{stats.correct}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>不正解</Text>
          <Text style={[styles.statValue, styles.incorrectText]}>{stats.incorrect}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>正解率</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>
      </View>

      {/* Problem Section */}
      <View style={styles.problemContainer}>
        <Text style={styles.problemText}>
          {currentCard.num1} {currentCard.operator} {currentCard.num2} = ?
        </Text>
      </View>

      {/* Voice Recognition Status */}
      <View style={styles.statusContainer}>
        {isListening && (
          <>
            <Text style={styles.listeningText}>🎤 聞き取り中...</Text>
            <Text style={styles.hintText}>答えを声で言ってください</Text>
          </>
        )}
      </View>

      {/* Interim Recognition */}
      {interimText && !showFeedback && (
        <View style={styles.interimContainer}>
          <Text style={styles.interimLabel}>認識中:</Text>
          <Text style={styles.interimText}>{interimText}</Text>
        </View>
      )}

      {/* Feedback Section */}
      {showFeedback && (
        <View
          style={[
            styles.feedbackContainer,
            isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
          ]}
        >
          <Text style={styles.feedbackEmoji}>{isCorrect ? '🎉' : '😅'}</Text>
          <Text style={styles.feedbackText}>{isCorrect ? '正解!' : '残念!'}</Text>
          <Text style={styles.answerText}>
            あなたの答え: {userAnswer}
            {'\n'}
            正解: {currentCard.answer}
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!hasStarted ? (
          <View style={styles.button}>
            <Button title="🎤 開始する" onPress={handleStart} color="#4CAF50" />
          </View>
        ) : !showFeedback ? (
          <>
            {isListening && (
              <View style={styles.button}>
                <Button title="⏸ 一時停止" onPress={stopListening} color="#f44336" />
              </View>
            )}
            {!isListening && recognizedNumber && (
              <View style={styles.button}>
                <Button title="🎤 再認識" onPress={handleRetry} color="#FF9800" />
              </View>
            )}
          </>
        ) : !isCorrect ? (
          <View style={styles.button}>
            <Button title="🔄 もう一度挑戦" onPress={handleRetry} color="#FF9800" />
          </View>
        ) : null}

        <View style={styles.button}>
          <Button
            title="← カードセット選択に戻る"
            onPress={handleBackToSelection}
            color="#757575"
          />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💡 使い方:{'\n'}
          1. 「開始する」ボタンを押す{'\n'}
          2. 計算の答えを声で言う（例：「じゅうご」）{'\n'}
          3. 自動で採点されます{'\n'}
          4. 正解 → すぐに次の問題へ自動で進む{'\n'}
          5. 不正解 → 正解するまで同じ問題を繰り返す
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  cardSetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  correctText: {
    color: '#4CAF50',
  },
  incorrectText: {
    color: '#f44336',
  },
  problemContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  problemText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
  statusContainer: {
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  interimContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  interimLabel: {
    fontSize: 12,
    color: '#f57c00',
    marginBottom: 5,
  },
  interimText: {
    fontSize: 20,
    color: '#e65100',
    fontWeight: '600',
  },
  feedbackContainer: {
    padding: 30,
    borderRadius: 15,
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  correctFeedback: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  incorrectFeedback: {
    backgroundColor: '#ffebee',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  feedbackEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  answerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
  },
  error: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
    width: '100%',
  },
  button: {
    width: '100%',
  },
  infoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'left',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  completionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  completionMessage: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
});
