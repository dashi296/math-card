import { useCallback, useEffect, useRef, useState } from 'react';

export interface MathProblem {
  num1: number;
  num2: number;
  answer: number;
}

export interface FlashcardStats {
  correct: number;
  incorrect: number;
  total: number;
}

export function useMathFlashcard(maxNumber = 20) {
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

  // Generate a new problem
  const generateProblem = useCallback(() => {
    console.log('[generateProblem] Called - This will reset showFeedback to false');
    const num1 = Math.floor(Math.random() * maxNumber) + 1;
    const num2 = Math.floor(Math.random() * maxNumber) + 1;
    const answer = num1 + num2;

    setProblem({ num1, num2, answer });
    setUserAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
    console.log('[generateProblem] Set showFeedback to false');
  }, [maxNumber]);

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
    (answer: number) => {
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
