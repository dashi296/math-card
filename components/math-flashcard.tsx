import { useEffect, useRef } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useMathFlashcard } from '@/hooks/use-math-flashcard';
import { useVoiceNumberRecognition } from '@/hooks/use-voice-number-recognition';

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
  } = useMathFlashcard(20);

  const {
    isListening,
    recognizedNumber,
    recognizedText,
    interimText,
    error,
    startListening,
    stopListening,
    clearResults,
  } = useVoiceNumberRecognition();

  // Track the last checked number to avoid duplicate checks
  const lastCheckedNumberRef = useRef<string | null>(null);
  const checkAnswerCallCountRef = useRef(0);

  // Debug: Track showFeedback changes in component
  useEffect(() => {
    console.log('[MathFlashcard Component] showFeedback changed to:', showFeedback);
  }, [showFeedback]);

  // Auto-advance to next problem if answer is correct
  useEffect(() => {
    if (showFeedback && isCorrect) {
      console.log('[Auto-advance] Correct answer! Auto-advancing in 2 seconds...');
      const timer = setTimeout(() => {
        console.log('[Auto-advance] Moving to next problem');
        clearResults();
        lastCheckedNumberRef.current = null;
        nextProblem();
      }, 2000); // Wait 2 seconds to show feedback

      return () => clearTimeout(timer);
    }
  }, [showFeedback, isCorrect, clearResults, nextProblem]);

  // Auto-check answer when a number is recognized
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('  recognizedNumber:', recognizedNumber, 'type:', typeof recognizedNumber);
    console.log('  showFeedback:', showFeedback);
    console.log('  lastChecked:', lastCheckedNumberRef.current);

    // Check each condition individually
    const hasRecognizedNumber = !!recognizedNumber;
    const feedbackNotShown = !showFeedback;
    const isDifferentFromLast = recognizedNumber !== lastCheckedNumberRef.current;

    console.log('  Condition checks:');
    console.log('    hasRecognizedNumber:', hasRecognizedNumber);
    console.log('    feedbackNotShown:', feedbackNotShown);
    console.log('    isDifferentFromLast:', isDifferentFromLast);
    console.log(
      '    All conditions met:',
      hasRecognizedNumber && feedbackNotShown && isDifferentFromLast
    );

    if (recognizedNumber && !showFeedback && recognizedNumber !== lastCheckedNumberRef.current) {
      const answer = Number.parseInt(recognizedNumber, 10);
      console.log('  Parsed answer:', answer, 'isNaN:', Number.isNaN(answer));

      if (!Number.isNaN(answer)) {
        console.log('  ✓ Calling checkAnswer with:', answer);
        lastCheckedNumberRef.current = recognizedNumber;
        checkAnswerCallCountRef.current += 1;
        checkAnswer(answer);
        console.log('  ✓ After checkAnswer call');
        stopListening();
      } else {
        console.log('  ✗ Answer is NaN, skipping');
      }
    } else {
      console.log('  ✗ Conditions not met, skipping checkAnswer');
    }
    console.log('=== useEffect end ===');
  }, [recognizedNumber, showFeedback, checkAnswer, stopListening]);

  const handleNextProblem = () => {
    clearResults();
    lastCheckedNumberRef.current = null;
    nextProblem();
  };

  const handleRetry = () => {
    clearResults();
    lastCheckedNumberRef.current = null;
    if (!isListening) {
      startListening();
    }
  };

  // Test function to directly call checkAnswer
  const handleTestCheckAnswer = () => {
    console.log('TEST: Manually calling checkAnswer with answer 99');
    checkAnswer(99);
  };

  if (!problem) {
    return null;
  }

  const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '0.0';

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
          {problem.num1} + {problem.num2} = ?
        </Text>
        {/* Debug info */}
        <Text style={{ fontSize: 10, marginTop: 10, color: '#999' }}>
          Debug: showFeedback={String(showFeedback)},{'\n'}
          recognizedNumber="{recognizedNumber}" (type: {typeof recognizedNumber}){'\n'}
          recognizedText="{recognizedText}" interimText="{interimText}"{'\n'}
          userAnswer={String(userAnswer)}, isCorrect={String(isCorrect)},{'\n'}
          lastChecked="{lastCheckedNumberRef.current}", callCount={checkAnswerCallCountRef.current}
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
          {isCorrect && <Text style={styles.autoAdvanceText}>2秒後に次の問題に進みます...</Text>}
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {/* Test Button */}
      <View style={{ marginVertical: 10 }}>
        <Button
          title="TEST: Call checkAnswer(99)"
          onPress={handleTestCheckAnswer}
          color="#9C27B0"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Text style={{ fontSize: 10, color: '#f00', marginBottom: 10, width: '100%' }}>
          Button mode: {!showFeedback ? 'VOICE INPUT' : isCorrect ? 'AUTO ADVANCE' : 'NEXT PROBLEM'}
        </Text>
        {!showFeedback ? (
          <>
            <View style={styles.button}>
              <Button
                title={isListening ? '停止' : '🎤 音声で回答'}
                onPress={isListening ? stopListening : startListening}
                color={isListening ? '#f44336' : '#4CAF50'}
              />
            </View>
            {recognizedNumber && (
              <View style={styles.button}>
                <Button title="再試行" onPress={handleRetry} color="#FF9800" />
              </View>
            )}
          </>
        ) : !isCorrect ? (
          <View style={styles.button}>
            <Button title="次の問題 →" onPress={handleNextProblem} color="#2196F3" />
          </View>
        ) : null}
      </View>

      {/* Reset Button */}
      {stats.total > 0 && (
        <View style={styles.resetContainer}>
          <Button title="スコアをリセット" onPress={resetStats} color="#757575" />
        </View>
      )}

      {/* Instructions */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💡 使い方:{'\n'}1. 「音声で回答」ボタンを押す{'\n'}2.
          計算の答えを声で言う（例：「じゅうご」）{'\n'}3. 自動で採点されます
          {'\n'}4. 正解なら自動で次の問題へ、不正解なら手動で進む
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
  autoAdvanceText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
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
