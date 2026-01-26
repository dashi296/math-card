import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeDatabase } from '@/db/client';
import type { CardSet } from '@/db/schema';
import {
  endPracticeSession,
  resetCardSetProgress,
  startPracticeSession,
  updateCardSetProgress,
} from '@/db/service';
import type { MathCard } from '@/utils/card-set-generator';
import { generateCardsForSet, shuffleCards } from '@/utils/card-set-generator';

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

      // 統計情報を更新
      const newStats = {
        ...stats,
        correct: stats.correct + (correct ? 1 : 0),
        incorrect: stats.incorrect + (correct ? 0 : 1),
        total: stats.total + 1,
      };
      setStats(newStats);

      // データベースに問題とセッション結果を保存
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
      const session = await startPracticeSession();
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
  }, [cards, stats]);

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
      startPracticeSession()
        .then((session) => {
          currentSessionIdRef.current = session.id;
          console.log('[Database] Initial session started:', session);
        })
        .catch((error) => {
          console.error('[Database] Failed to start session:', error);
        });
    }
  }, [currentCard]);

  const isCompleted = currentCard === null && cards.length > 0;

  return {
    currentCard,
    userAnswer,
    isCorrect,
    stats,
    showFeedback,
    isCompleted,
    checkAnswer,
    nextCard,
    resetFeedback,
  };
}
