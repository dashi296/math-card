import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVoiceNumberRecognition } from '@/features/voice-recognition/model/use-voice-number-recognition';
import { Fonts } from '@/shared/config/theme';
import { CARD_TRANSITION_DELAY_MS, VOICE_RECOGNITION_START_DELAY_MS } from '@/shared/config/timing';
import { calculateAccuracy } from '@/shared/lib/stats';
import { useAppColors } from '@/shared/lib/use-app-colors';
import { useSoundEffect } from '@/shared/lib/use-sound-effect';
import { AppButton } from '@/shared/ui/app-button';
import { useMathFlashcard } from '../model/use-math-flashcard';

export default function MathFlashcard() {
  const c = useAppColors();

  const {
    problem,
    userAnswer,
    isCorrect,
    stats,
    showFeedback,
    checkAnswerWithCandidates,
    nextProblem,
    resetStats,
    resetFeedback,
  } = useMathFlashcard(20);

  const {
    isListening,
    recognizedNumber,
    allCandidateNumbers,
    interimText,
    error,
    startListening,
    stopListening,
    clearResults,
  } = useVoiceNumberRecognition();

  const { playCorrectSound, playIncorrectSound } = useSoundEffect();

  const lastCheckedNumberRef = useRef<string | null>(null);
  const checkAnswerCallCountRef = useRef(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (showFeedback) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
    }
  }, [showFeedback, isCorrect, playCorrectSound, playIncorrectSound]);

  useEffect(() => {
    if (showFeedback && isCorrect) {
      clearResults();
      const timer = setTimeout(() => {
        nextProblem();
      }, CARD_TRANSITION_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [showFeedback, isCorrect, clearResults, nextProblem]);

  useEffect(() => {
    if (hasStarted && problem && !showFeedback && !isListening) {
      if (!recognizedNumber) {
        lastCheckedNumberRef.current = null;
      }
      const timer = setTimeout(() => {
        startListening();
      }, VOICE_RECOGNITION_START_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [hasStarted, problem, showFeedback, isListening, recognizedNumber, startListening]);

  useEffect(() => {
    if (
      recognizedNumber &&
      !showFeedback &&
      recognizedNumber !== lastCheckedNumberRef.current &&
      allCandidateNumbers.length > 0
    ) {
      stopListening();
      lastCheckedNumberRef.current = recognizedNumber;
      checkAnswerCallCountRef.current += 1;
      console.log('[MathFlashcard] Checking with all candidates:', allCandidateNumbers);
      checkAnswerWithCandidates(allCandidateNumbers);
    }
  }, [
    recognizedNumber,
    allCandidateNumbers,
    showFeedback,
    checkAnswerWithCandidates,
    stopListening,
  ]);

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

  if (!problem) {
    return null;
  }

  const accuracy = calculateAccuracy(stats.correct, stats.total);

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceSecondary }]}>
      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: c.textMuted }]}>正解</Text>
          <Text style={[styles.statValue, { color: c.statCorrect, fontFamily: Fonts?.rounded }]}>
            {stats.correct}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: c.textMuted }]}>不正解</Text>
          <Text style={[styles.statValue, { color: c.statIncorrect, fontFamily: Fonts?.rounded }]}>
            {stats.incorrect}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: c.textMuted }]}>正解率</Text>
          <Text style={[styles.statValue, { color: c.statDefault, fontFamily: Fonts?.rounded }]}>
            {accuracy}%
          </Text>
        </View>
      </View>

      {/* Problem Card */}
      <View style={[styles.problemCard, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}>
        <Text style={[styles.problemText, { color: c.problemText, fontFamily: Fonts?.rounded }]}>
          {problem.num1} {problem.operator === '*' ? '×' : problem.operator} {problem.num2} = ?
        </Text>
      </View>

      {/* Listening Status */}
      <View style={styles.statusArea}>
        {isListening && (
          <>
            <Text style={[styles.listeningText, { color: c.success, fontFamily: Fonts?.rounded }]}>
              🎤 聞き取り中...
            </Text>
            <Text style={[styles.hintText, { color: c.textMuted }]}>答えを声で言ってください</Text>
          </>
        )}
      </View>

      {/* Interim */}
      {interimText && !showFeedback && (
        <View
          style={[
            styles.interimCard,
            { backgroundColor: c.warningBg, borderColor: c.warningBorder },
          ]}
        >
          <Text style={[styles.interimLabel, { color: c.warningText }]}>認識中:</Text>
          <Text style={[styles.interimValue, { color: c.warningText, fontFamily: Fonts?.rounded }]}>
            {interimText}
          </Text>
        </View>
      )}

      {/* Feedback */}
      {showFeedback && (
        <View
          style={[
            styles.feedbackCard,
            isCorrect
              ? { backgroundColor: c.successBg, borderColor: c.successBorder }
              : { backgroundColor: c.errorBg, borderColor: c.errorBorder },
          ]}
        >
          <Text style={styles.feedbackEmoji}>{isCorrect ? '🎉' : '😅'}</Text>
          <Text
            style={[
              styles.feedbackTitle,
              {
                color: isCorrect ? c.successText : c.errorText,
                fontFamily: Fonts?.rounded,
              },
            ]}
          >
            {isCorrect ? '正解！' : '残念！'}
          </Text>
          <Text style={[styles.feedbackDetail, { color: c.textSecondary }]}>
            あなたの答え: {userAnswer}
            {'\n'}
            正解: {problem.answer}
          </Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View
          style={[styles.errorCard, { backgroundColor: c.errorBg, borderColor: c.errorBorder }]}
        >
          <Text style={[styles.errorText, { color: c.errorText }]}>{error}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!hasStarted && <AppButton title="🎤 開始する" onPress={handleStart} variant="success" />}

        {hasStarted && !showFeedback && isListening && (
          <AppButton title="⏸ 一時停止" onPress={stopListening} variant="danger" />
        )}

        {hasStarted && !showFeedback && !isListening && recognizedNumber && (
          <AppButton title="🎤 再認識" onPress={handleRetry} variant="warning" />
        )}

        {showFeedback && !isCorrect && (
          <AppButton title="🔄 もう一度挑戦" onPress={handleRetry} variant="warning" />
        )}
      </View>

      {stats.total > 0 && (
        <View style={styles.resetArea}>
          <AppButton title="最初からやり直す" onPress={handleResetStats} variant="ghost" />
        </View>
      )}

      {/* Instructions */}
      <View style={[styles.infoCard, { backgroundColor: c.infoBg, borderColor: c.infoBorder }]}>
        <Text style={[styles.infoText, { color: c.infoText }]}>
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
    alignItems: 'center',
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 28,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  problemCard: {
    paddingVertical: 44,
    paddingHorizontal: 48,
    borderRadius: 24,
    marginBottom: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  problemText: {
    fontSize: 52,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  statusArea: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 13,
    marginTop: 6,
  },
  interimCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  interimLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  interimValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  feedbackCard: {
    padding: 28,
    borderRadius: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  feedbackEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  feedbackDetail: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  resetArea: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  infoCard: {
    marginTop: 28,
    padding: 16,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '500',
  },
});
