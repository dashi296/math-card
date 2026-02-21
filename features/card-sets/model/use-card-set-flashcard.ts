import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeDatabase } from '@/shared/data/db/client';
import type { CardSet } from '@/shared/data/db/schema';
import {
  endPracticeSession,
  getDailyAverageAnswerTimes,
  resetCardSetProgress,
  startPracticeSession,
  updateCardSetProgress,
} from '@/shared/data/db/service';
import type { MathCard } from '@/shared/lib/card-set-generator';
import { generateCardsForSet, shuffleCards } from '@/shared/lib/card-set-generator';

export interface CardSetFlashcardStats {
  correct: number;
  incorrect: number;
  total: number;
  currentCardIndex: number;
  totalCards: number;
  progressId: number | null;
}

/**
 * カードセットを使った計算フラッシュカードのカスタムhook
 */
export function useCardSetFlashcard(cardSet: CardSet | null) {
  const [cards, setCards] = useState<MathCard[]>([]);
  const [currentCard, setCurrentCard] = useState<MathCard | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState<CardSetFlashcardStats>({
    correct: 0,
    incorrect: 0,
    total: 0,
    currentCardIndex: 0,
    totalCards: 0,
    progressId: null,
  });
  const [dailyAverageData, setDailyAverageData] = useState<{ date: string; averageTime: number }[]>(
    []
  );

  // Use ref to keep the latest problem without causing checkAnswer to change
  const currentCardRef = useRef<MathCard | null>(currentCard);
  currentCardRef.current = currentCard;

  // 現在のセッションIDを追跡
  const currentSessionIdRef = useRef<number | null>(null);

  // データベースを初期化
  useEffect(() => {
    initializeDatabase().catch((error) => {
      console.error('[Database] Failed to initialize:', error);
    });
  }, []);

  // 進捗をリセットして最初から開始
  const initializeProgress = useCallback(async (cardSetId: number, cardList: MathCard[]) => {
    try {
      // 進捗をリセット（存在しない場合は新規作成）
      const progress = await resetCardSetProgress(cardSetId);

      setStats({
        correct: 0,
        incorrect: 0,
        total: 0,
        currentCardIndex: 0,
        totalCards: cardList.length,
        progressId: progress.id,
      });

      // 最初のカードを設定
      setCurrentCard(cardList[0] || null);
    } catch (error) {
      console.error('[CardSetFlashcard] Failed to initialize progress:', error);
      // エラーが発生しても最初のカードから開始
      setStats({
        correct: 0,
        incorrect: 0,
        total: 0,
        currentCardIndex: 0,
        totalCards: cardList.length,
        progressId: null,
      });
      setCurrentCard(cardList[0] || null);
    }
  }, []);

  // カードセットが変更されたら、カードリストを生成してシャッフル
  useEffect(() => {
    if (!cardSet) {
      setCards([]);
      setCurrentCard(null);
      setStats({
        correct: 0,
        incorrect: 0,
        total: 0,
        currentCardIndex: 0,
        totalCards: 0,
        progressId: null,
      });
      return;
    }

    // カードセットから問題を生成
    const generatedCards = generateCardsForSet(cardSet);
    const shuffledCards = shuffleCards(generatedCards);

    setCards(shuffledCards);

    // 進捗をリセットして最初から開始
    initializeProgress(cardSet.id, shuffledCards);
  }, [cardSet, initializeProgress]);

  // Debug: Track showFeedback changes
  useEffect(() => {
    console.log('[useCardSetFlashcard] showFeedback changed to:', showFeedback);
  }, [showFeedback]);

  // 答えをチェックする
  const checkAnswer = useCallback(
    async (answer: number) => {
      const card = currentCardRef.current;
      console.log('checkAnswer called:', { answer, card });
      if (!card) {
        console.log('No card available!');
        return;
      }

      setUserAnswer(answer);
      const correct = answer === card.answer;
      setIsCorrect(correct);
      setShowFeedback(true);
      console.log('Set showFeedback to true, correct:', correct);

      // データベースにセッション結果を保存
      if (currentSessionIdRef.current !== null) {
        try {
          await endPracticeSession(currentSessionIdRef.current, {
            isCorrect: correct,
            userAnswer: answer,
          });
          console.log('[Database] Session ended');
        } catch (error) {
          console.error('[Database] Failed to end session:', error);
        }
      }

      // 統計情報を更新
      const newStats = {
        ...stats,
        correct: stats.correct + (correct ? 1 : 0),
        incorrect: stats.incorrect + (correct ? 0 : 1),
        total: stats.total + 1,
      };
      setStats(newStats);

      // 進捗を更新
      if (stats.progressId && cardSet) {
        try {
          await updateCardSetProgress(stats.progressId, {
            correctCount: newStats.correct,
            incorrectCount: newStats.incorrect,
          });
        } catch (error) {
          console.error('[Database] Failed to update progress:', error);
        }
      }
    },
    [stats, cardSet]
  );

  // 複数の候補から答えをチェックする
  const checkAnswerWithCandidates = useCallback(
    async (candidates: number[]) => {
      const card = currentCardRef.current;
      console.log('checkAnswerWithCandidates called:', { candidates, card });
      if (!card) {
        console.log('No card available!');
        return;
      }

      // すべての候補の中に正解があるかチェック
      const correctCandidate = candidates.find((c) => c === card.answer);
      const hasCorrectAnswer = correctCandidate !== undefined;

      // 表示用には最初の候補を使用（または正解の候補があればそれを使用）
      const displayAnswer = hasCorrectAnswer ? correctCandidate : candidates[0];

      console.log('[checkAnswerWithCandidates] Candidates:', candidates);
      console.log('[checkAnswerWithCandidates] Correct answer:', card.answer);
      console.log('[checkAnswerWithCandidates] Has correct answer:', hasCorrectAnswer);
      console.log('[checkAnswerWithCandidates] Display answer:', displayAnswer);

      setUserAnswer(displayAnswer);
      setIsCorrect(hasCorrectAnswer);
      setShowFeedback(true);
      console.log('Set showFeedback to true, correct:', hasCorrectAnswer);

      // データベースにセッション結果を保存
      if (currentSessionIdRef.current !== null) {
        try {
          await endPracticeSession(currentSessionIdRef.current, {
            isCorrect: hasCorrectAnswer,
            userAnswer: displayAnswer,
          });
          console.log('[Database] Session ended');
        } catch (error) {
          console.error('[Database] Failed to end session:', error);
        }
      }

      // 統計情報を更新
      const newStats = {
        ...stats,
        correct: stats.correct + (hasCorrectAnswer ? 1 : 0),
        incorrect: stats.incorrect + (hasCorrectAnswer ? 0 : 1),
        total: stats.total + 1,
      };
      setStats(newStats);

      // 進捗を更新
      if (stats.progressId && cardSet) {
        try {
          await updateCardSetProgress(stats.progressId, {
            correctCount: newStats.correct,
            incorrectCount: newStats.incorrect,
          });
        } catch (error) {
          console.error('[Database] Failed to update progress:', error);
        }
      }
    },
    [stats, cardSet]
  );

  // 次のカードに進む
  const nextCard = useCallback(async () => {
    console.log('[nextCard] Called');

    if (cards.length === 0) {
      console.log('[nextCard] No cards available');
      return;
    }

    const nextIndex = stats.currentCardIndex + 1;

    if (nextIndex >= cards.length) {
      console.log('[nextCard] All cards completed!');
      setCurrentCard(null);
      return;
    }

    const nextCardData = cards[nextIndex];

    // セッションを開始
    try {
      const session = await startPracticeSession(cardSet?.id);
      currentSessionIdRef.current = session.id;
      console.log('[Database] Session started:', session);
    } catch (error) {
      console.error('[Database] Failed to start session:', error);
    }

    // 進捗を更新
    if (stats.progressId) {
      try {
        await updateCardSetProgress(stats.progressId, {
          currentCardIndex: nextIndex,
          completedCards: nextIndex,
        });
      } catch (error) {
        console.error('[Database] Failed to update progress:', error);
      }
    }

    setStats((prev) => ({
      ...prev,
      currentCardIndex: nextIndex,
    }));

    setCurrentCard(nextCardData);
    setUserAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
    console.log('[nextCard] Set showFeedback to false');
  }, [cards, stats, cardSet]);

  // フィードバックをリセット（同じ問題をもう一度試す）
  const resetFeedback = useCallback(() => {
    console.log('[resetFeedback] Clearing feedback to retry');
    setUserAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
  }, []);

  // 最初のカードを準備（セッションを開始）
  useEffect(() => {
    if (currentCard && currentSessionIdRef.current === null) {
      startPracticeSession(cardSet?.id)
        .then((session) => {
          currentSessionIdRef.current = session.id;
          console.log('[Database] Initial session started:', session);
        })
        .catch((error) => {
          console.error('[Database] Failed to start session:', error);
        });
    }
  }, [currentCard, cardSet]);

  // [DEV] 最後の1問まで飛ばす（完了画面の確認用）
  const skipToLastCard = useCallback(async () => {
    if (!__DEV__ || cards.length < 2) return;

    const lastIndex = cards.length - 1;
    const lastCard = cards[lastIndex];

    const dummyCorrect = Math.round(lastIndex * 0.7);

    // セッションを開始
    try {
      const session = await startPracticeSession(cardSet?.id);
      currentSessionIdRef.current = session.id;
    } catch (error) {
      console.error('[Database] Failed to start session:', error);
    }

    setStats((prev) => ({
      ...prev,
      currentCardIndex: lastIndex,
      correct: dummyCorrect,
      incorrect: lastIndex - dummyCorrect,
      total: lastIndex,
    }));

    setCurrentCard(lastCard);
    setUserAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
  }, [cards, cardSet]);

  const isCompleted = currentCard === null && cards.length > 0;

  // 完了時に日次平均回答時間データを取得
  useEffect(() => {
    if (isCompleted && cardSet) {
      getDailyAverageAnswerTimes(cardSet.id)
        .then((data) => {
          setDailyAverageData(data);
          console.log('[CardSetFlashcard] Daily average data:', data);
        })
        .catch((error) => {
          console.error('[CardSetFlashcard] Failed to get daily averages:', error);
        });
    }
  }, [isCompleted, cardSet]);

  return {
    currentCard,
    userAnswer,
    isCorrect,
    stats,
    showFeedback,
    isCompleted,
    dailyAverageData,
    checkAnswer,
    checkAnswerWithCandidates,
    nextCard,
    resetFeedback,
    skipToLastCard,
  };
}
