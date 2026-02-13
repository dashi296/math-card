import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVoiceNumberRecognition } from '@/features/voice-recognition/model/use-voice-number-recognition';
import { Fonts } from '@/shared/config/theme';
import { CARD_TRANSITION_DELAY_MS, VOICE_RECOGNITION_START_DELAY_MS } from '@/shared/config/timing';
import type { CardSet } from '@/shared/data/db/schema';
import { calculateAccuracy } from '@/shared/lib/stats';
import { useAppColors } from '@/shared/lib/use-app-colors';
import { useSoundEffect } from '@/shared/lib/use-sound-effect';
import { AppButton } from '@/shared/ui/app-button';
import { useCardSetFlashcard } from '../model/use-card-set-flashcard';
import AnswerTimeChart from './answer-time-chart';
import CardSetSelector from './card-set-selector';

export default function CardSetFlashcard() {
  const c = useAppColors();
  const [selectedCardSet, setSelectedCardSet] = useState<CardSet | null>(null);

  const {
    currentCard,
    userAnswer,
    isCorrect,
    stats,
    showFeedback,
    isCompleted,
    checkAnswerWithCandidates,
    nextCard,
    resetFeedback,
    skipToLastCard,
  } = useCardSetFlashcard(selectedCardSet);

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
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setHasStarted(false);
    clearResults();
    lastCheckedNumberRef.current = null;
  }, [clearResults]);

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
        nextCard();
      }, CARD_TRANSITION_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [showFeedback, isCorrect, clearResults, nextCard]);

  useEffect(() => {
    if (hasStarted && currentCard && !showFeedback && !isListening) {
      if (!recognizedNumber) {
        lastCheckedNumberRef.current = null;
      }
      const timer = setTimeout(() => {
        startListening();
      }, VOICE_RECOGNITION_START_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [hasStarted, currentCard, showFeedback, isListening, recognizedNumber, startListening]);

  useEffect(() => {
    if (
      recognizedNumber &&
      !showFeedback &&
      recognizedNumber !== lastCheckedNumberRef.current &&
      allCandidateNumbers.length > 0
    ) {
      stopListening();
      lastCheckedNumberRef.current = recognizedNumber;
      console.log('[CardSetFlashcard] Checking with all candidates:', allCandidateNumbers);
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

  const handleBackToSelection = () => {
    setSelectedCardSet(null);
    setHasStarted(false);
    clearResults();
    lastCheckedNumberRef.current = null;
  };

  if (!selectedCardSet) {
    return <CardSetSelector onSelectCardSet={setSelectedCardSet} selectedCardSetId={null} />;
  }

  // Completion screen
  if (isCompleted) {
    const accuracy = calculateAccuracy(stats.correct, stats.total);

    return (
      <View style={[styles.container, { backgroundColor: c.surfaceSecondary }]}>
        <View
          style={[styles.completionCard, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}
        >
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={[styles.completionTitle, { color: c.success, fontFamily: Fonts?.rounded }]}>
            おめでとうございます!
          </Text>
          <Text style={[styles.completionMessage, { color: c.textSecondary }]}>
            全てのカードを完了しました!
          </Text>

          <View style={[styles.statsRow, { backgroundColor: c.surfaceSecondary }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>正解</Text>
              <Text
                style={[styles.statValue, { color: c.statCorrect, fontFamily: Fonts?.rounded }]}
              >
                {stats.correct}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>不正解</Text>
              <Text
                style={[styles.statValue, { color: c.statIncorrect, fontFamily: Fonts?.rounded }]}
              >
                {stats.incorrect}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>正解率</Text>
              <Text
                style={[styles.statValue, { color: c.statDefault, fontFamily: Fonts?.rounded }]}
              >
                {accuracy}%
              </Text>
            </View>
          </View>

          <AnswerTimeChart
            answerTimes={stats.answerTimes}
            isCorrectResults={stats.isCorrectResults}
          />

          <AppButton
            title="別のカードセットを選ぶ"
            onPress={handleBackToSelection}
            variant="primary"
            fullWidth
          />
        </View>
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View style={[styles.container, { backgroundColor: c.surfaceSecondary }]}>
        <Text style={[styles.loadingText, { color: c.textSecondary }]}>カードを読み込み中...</Text>
      </View>
    );
  }

  const accuracy = calculateAccuracy(stats.correct, stats.total);
  const progress = stats.totalCards > 0 ? (stats.currentCardIndex + 1) / stats.totalCards : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceSecondary }]}>
      {/* Header with card set name and progress */}
      <View style={styles.headerSection}>
        <Text style={[styles.cardSetName, { color: c.primary, fontFamily: Fonts?.rounded }]}>
          {selectedCardSet.name}
        </Text>
        <Text style={[styles.progressLabel, { color: c.textSecondary }]}>
          {stats.currentCardIndex + 1} / {stats.totalCards} 枚目
        </Text>
        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: c.primary, width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

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
          {currentCard.num1} {currentCard.operator === '*' ? '×' : currentCard.operator}{' '}
          {currentCard.num2} = ?
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
            {isCorrect ? '正解!' : '残念!'}
          </Text>
          <Text style={[styles.feedbackDetail, { color: c.textSecondary }]}>
            あなたの答え: {userAnswer}
            {'\n'}
            正解: {currentCard.answer}
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

      <View style={styles.backArea}>
        <AppButton
          title="← カードセット選択に戻る"
          onPress={handleBackToSelection}
          variant="ghost"
        />
      </View>

      {__DEV__ && stats.totalCards > 1 && (
        <View style={styles.devArea}>
          <AppButton title="[DEV] 最後の1問まで飛ばす" onPress={skipToLastCard} variant="ghost" />
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
          5. 不正解 → 正解するまで同じ問題を繰り返す
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
  headerSection: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  cardSetName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
  backArea: {
    marginTop: 12,
    alignItems: 'center',
  },
  devArea: {
    marginTop: 4,
    alignItems: 'center',
    opacity: 0.6,
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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  completionCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  completionEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  completionMessage: {
    fontSize: 16,
    marginBottom: 28,
  },
});
