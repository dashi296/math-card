import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { CARD_TRANSITION_DELAY_MS, VOICE_RECOGNITION_START_DELAY_MS } from '@/constants/timing';
import { useMathFlashcard } from '@/hooks/use-math-flashcard';
import { useSoundEffect } from '@/hooks/use-sound-effect';
import { useVoiceNumberRecognition } from '@/hooks/use-voice-number-recognition';
import { calculateAccuracy } from '@/utils/stats';

export default function MathFlashcard() {
  const {
    problem,
    userAnswer,
    isCorrect,
    stats,
    showFeedback,
    checkAnswer,
    nextProblem,
    resetStats,
    resetFeedback,
  } = useMathFlashcard(20);

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
  const checkAnswerCallCountRef = useRef(0);

  // Track if user has started (first manual start)
  const [hasStarted, setHasStarted] = useState(false);

  // Play sound effect when answer is checked
  useEffect(() => {
    if (showFeedback) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
    }
  }, [showFeedback, isCorrect, playCorrectSound, playIncorrectSound]);

  // Auto-advance to next problem if answer is correct
  useEffect(() => {
    if (showFeedback && isCorrect) {
      // Clear the recognized number
      clearResults();

      // Wait a bit for clearResults to take effect before generating next problem
      const timer = setTimeout(() => {
        nextProblem();
      }, CARD_TRANSITION_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [showFeedback, isCorrect, clearResults, nextProblem]);

  // Auto-start voice recognition when a new problem is shown (only after initial start)
  useEffect(() => {
    if (hasStarted && problem && !showFeedback && !isListening) {
      // Only reset ref if recognizedNumber has been cleared
      if (!recognizedNumber) {
        lastCheckedNumberRef.current = null;
      }

      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        startListening();
      }, VOICE_RECOGNITION_START_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [hasStarted, problem, showFeedback, isListening, recognizedNumber, startListening]);

  // Auto-check answer when a number is recognized
  useEffect(() => {
    if (recognizedNumber && !showFeedback && recognizedNumber !== lastCheckedNumberRef.current) {
      const answer = Number.parseInt(recognizedNumber, 10);

      if (!Number.isNaN(answer)) {
        // Stop listening BEFORE checking answer to prevent next utterance from being appended
        stopListening();

        lastCheckedNumberRef.current = recognizedNumber;
        checkAnswerCallCountRef.current += 1;
        checkAnswer(answer);
      }
    }
  }, [recognizedNumber, showFeedback, checkAnswer, stopListening]);

  const handleStart = () => {
    setHasStarted(true);
    startListening();
  };

  const handleRetry = () => {
    clearResults();
    lastCheckedNumberRef.current = null;
    resetFeedback();
  };

  const handleResetStats = () => {
    resetStats();
    setHasStarted(false);
    clearResults();
    lastCheckedNumberRef.current = null;
  };

  const renderActionButtons = () => {
    if (!hasStarted) {
      return (
        <View style={styles.button}>
          <Button title="🎤 開始する" onPress={handleStart} color="#4CAF50" />
        </View>
      );
    }

    if (!showFeedback) {
      return (
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
      );
    }

    if (!isCorrect) {
      return (
        <View style={styles.button}>
          <Button title="🔄 もう一度挑戦" onPress={handleRetry} color="#FF9800" />
        </View>
      );
    }

    return null;
  };

  if (!problem) {
    return null;
  }

  const accuracy = calculateAccuracy(stats.correct, stats.total);

  return (
    <View style={styles.container}>
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
          {problem.num1} {problem.operator} {problem.num2} = ?
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
          <Text style={styles.feedbackText}>{isCorrect ? '正解！' : '残念！'}</Text>
          <Text style={styles.answerText}>
            あなたの答え: {userAnswer}
            {'\n'}
            正解: {problem.answer}
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
      <View style={styles.buttonContainer}>{renderActionButtons()}</View>

      {/* Reset Button */}
      {stats.total > 0 && (
        <View style={styles.resetContainer}>
          <Button title="最初からやり直す" onPress={handleResetStats} color="#757575" />
        </View>
      )}

      {/* Instructions */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💡 使い方:{'\n'}
          1. 「開始する」ボタンを押す{'\n'}
          2. 計算の答えを声で言う（例：「じゅうご」）{'\n'}
          3. 自動で採点されます{'\n'}
          4. 正解 → すぐに次の問題へ自動で進む{'\n'}
          5. 不正解 → 正解するまで同じ問題を繰り返す{'\n'}
          {'\n'}※ 正解すれば自動で次々と問題が進みます
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
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 10,
  },
  button: {
    minWidth: 150,
  },
  resetContainer: {
    marginTop: 20,
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
});
