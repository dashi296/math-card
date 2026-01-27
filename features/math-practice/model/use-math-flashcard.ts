import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeDatabase } from '@/shared/data/db/client';
import type { OperatorType } from '@/shared/data/db/schema';
import { endPracticeSession, startPracticeSession } from '@/shared/data/db/service';

export interface MathProblem {
  num1: number;
  num2: number;
  operator: OperatorType; // 演算子: +, -, *, /
  answer: number;
}

export interface FlashcardStats {
  correct: number;
  incorrect: number;
  total: number;
}

export function useMathFlashcard(
  maxNumber = 20,
  operators: OperatorType[] = ['+'] // デフォルトは足し算のみ
) {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState<FlashcardStats>({
    correct: 0,
    incorrect: 0,
    total: 0,
  });
  const [showFeedback, setShowFeedback] = useState(false);

  // Use ref to keep the latest problem without causing checkAnswer to change
  const problemRef = useRef<MathProblem | null>(problem);
  problemRef.current = problem;

  // 現在のセッションIDを追跡
  const currentSessionIdRef = useRef<number | null>(null);

  // データベースを初期化
  useEffect(() => {
    initializeDatabase().catch((error) => {
      console.error('[Database] Failed to initialize:', error);
    });
  }, []);

  // Generate a new problem
  const generateProblem = useCallback(async () => {
    console.log('[generateProblem] Called - This will reset showFeedback to false');

    // ランダムに演算子を選択
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let num1: number;
    let num2: number;
    let answer: number;

    // 演算子に応じて問題を生成
    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * maxNumber) + 1;
        num2 = Math.floor(Math.random() * maxNumber) + 1;
        answer = num1 + num2;
        break;
      case '-':
        // 引き算：答えが負にならないように大きい数から小さい数を引く
        num1 = Math.floor(Math.random() * maxNumber) + 1;
        num2 = Math.floor(Math.random() * num1) + 1;
        answer = num1 - num2;
        break;
      case '*':
        // 掛け算：数を小さめに設定（1〜10）
        num1 = Math.floor(Math.random() * Math.min(10, maxNumber)) + 1;
        num2 = Math.floor(Math.random() * Math.min(10, maxNumber)) + 1;
        answer = num1 * num2;
        break;
      case '/': {
        // 割り算：割り切れる問題を生成
        num2 = Math.floor(Math.random() * Math.min(10, maxNumber)) + 1;
        const quotient = Math.floor(Math.random() * Math.min(10, maxNumber)) + 1;
        num1 = num2 * quotient;
        answer = quotient;
        break;
      }
      default:
        num1 = Math.floor(Math.random() * maxNumber) + 1;
        num2 = Math.floor(Math.random() * maxNumber) + 1;
        answer = num1 + num2;
    }

    try {
      // セッションを開始
      const session = await startPracticeSession();
      currentSessionIdRef.current = session.id;
      console.log('[Database] Session started:', session);
    } catch (error) {
      console.error('[Database] Failed to start session:', error);
    }

    setProblem({ num1, num2, operator, answer });
    setUserAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
    console.log('[generateProblem] Set showFeedback to false');
  }, [maxNumber, operators]);

  // Generate initial problem
  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  // Debug: Track showFeedback changes
  useEffect(() => {
    console.log('[useMathFlashcard] showFeedback changed to:', showFeedback);
  }, [showFeedback]);

  // Check the user's answer - stable function reference
  const checkAnswer = useCallback(
    async (answer: number) => {
      const currentProblem = problemRef.current;
      console.log('checkAnswer called:', { answer, currentProblem });
      if (!currentProblem) {
        console.log('No problem available!');
        return;
      }

      setUserAnswer(answer);
      const correct = answer === currentProblem.answer;
      setIsCorrect(correct);
      setShowFeedback(true);
      console.log('Set showFeedback to true, correct:', correct);

      setStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
        total: prev.total + 1,
      }));

      // データベースにセッション結果を保存
      if (currentSessionIdRef.current !== null) {
        try {
          const updatedSession = await endPracticeSession(currentSessionIdRef.current, {
            isCorrect: correct,
            userAnswer: answer,
          });
          console.log('[Database] Session ended:', updatedSession);
        } catch (error) {
          console.error('[Database] Failed to end session:', error);
        }
      }
    },
    [] // Empty deps - stable function reference
  );

  // Move to next problem
  const nextProblem = useCallback(() => {
    console.log('[nextProblem] Called');
    generateProblem();
  }, [generateProblem]);

  // Reset stats
  const resetStats = useCallback(() => {
    console.log('[resetStats] Called');
    setStats({
      correct: 0,
      incorrect: 0,
      total: 0,
    });
    generateProblem();
  }, [generateProblem]);

  // Reset feedback to retry the same problem
  const resetFeedback = useCallback(() => {
    console.log('[resetFeedback] Clearing feedback to retry');
    setUserAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
  }, []);

  return {
    problem,
    userAnswer,
    isCorrect,
    stats,
    showFeedback,
    checkAnswer,
    nextProblem,
    resetStats,
    resetFeedback,
    generateProblem,
  };
}
