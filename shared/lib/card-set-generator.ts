import type { OperatorType } from '@/shared/data/db/schema';

export interface CardSetDefinition {
  id?: number;
  name: string;
  grade: number;
  operator: OperatorType;
  answerMin: number;
  answerMax: number;
  num1Min: number;
  num1Max: number;
  num2Min: number;
  num2Max: number;
  totalCards: number;
}

export interface MathCard {
  num1: number;
  num2: number;
  operator: OperatorType;
  answer: number;
}

// 小学1年生のカードセット定義
// totalCardsは実際に生成される組み合わせ数に基づいて設定
export const GRADE1_CARD_SETS: CardSetDefinition[] = [
  {
    name: '小学1年生のたしざん(1)',
    grade: 1,
    operator: '+',
    answerMin: 1,
    answerMax: 10,
    num1Min: 1,
    num1Max: 9,
    num2Min: 1,
    num2Max: 9,
    totalCards: 45, // 実際の組み合わせ数
  },
  {
    name: '小学1年生のたしざん(2)',
    grade: 1,
    operator: '+',
    answerMin: 11,
    answerMax: 18,
    num1Min: 2,
    num1Max: 9,
    num2Min: 2,
    num2Max: 9,
    totalCards: 36, // 実際の組み合わせ数
  },
  {
    name: '小学1年生のひきざん(1)',
    grade: 1,
    operator: '-',
    answerMin: 0,
    answerMax: 9,
    num1Min: 1,
    num1Max: 10,
    num2Min: 1,
    num2Max: 10,
    totalCards: 55, // 実際の組み合わせ数
  },
  {
    name: '小学1年生のひきざん(2)',
    grade: 1,
    operator: '-',
    answerMin: 2,
    answerMax: 9,
    num1Min: 11,
    num1Max: 18,
    num2Min: 2,
    num2Max: 9,
    totalCards: 36, // 実際の組み合わせ数
  },
];

// 小学2年生のカードセット定義（九九）
export const GRADE2_CARD_SETS: CardSetDefinition[] = [
  {
    name: '小学2年生のかけ算（九九）',
    grade: 2,
    operator: '*',
    answerMin: 1,
    answerMax: 81,
    num1Min: 1,
    num1Max: 9,
    num2Min: 1,
    num2Max: 9,
    totalCards: 81, // 1の段〜9の段の全組み合わせ
  },
  {
    name: '小学2年生のかけ算（1〜3の段）',
    grade: 2,
    operator: '*',
    answerMin: 1,
    answerMax: 27,
    num1Min: 1,
    num1Max: 3,
    num2Min: 1,
    num2Max: 9,
    totalCards: 27,
  },
  {
    name: '小学2年生のかけ算（4〜6の段）',
    grade: 2,
    operator: '*',
    answerMin: 4,
    answerMax: 54,
    num1Min: 4,
    num1Max: 6,
    num2Min: 1,
    num2Max: 9,
    totalCards: 27,
  },
  {
    name: '小学2年生のかけ算（7〜9の段）',
    grade: 2,
    operator: '*',
    answerMin: 7,
    answerMax: 81,
    num1Min: 7,
    num1Max: 9,
    num2Min: 1,
    num2Max: 9,
    totalCards: 27,
  },
];

/**
 * カードセット定義に基づいて全ての問題カードを生成
 */
export function generateCardsForSet(definition: CardSetDefinition): MathCard[] {
  const cards: MathCard[] = [];
  const { operator, answerMin, answerMax, num1Min, num1Max, num2Min, num2Max } = definition;

  if (operator === '+') {
    // 足し算の場合
    for (let num1 = num1Min; num1 <= num1Max; num1++) {
      for (let num2 = num2Min; num2 <= num2Max; num2++) {
        const answer = num1 + num2;
        if (answer >= answerMin && answer <= answerMax) {
          cards.push({ num1, num2, operator, answer });
        }
      }
    }
  } else if (operator === '-') {
    // 引き算の場合
    for (let num1 = num1Min; num1 <= num1Max; num1++) {
      for (let num2 = num2Min; num2 <= num2Max; num2++) {
        const answer = num1 - num2;
        if (answer >= answerMin && answer <= answerMax) {
          cards.push({ num1, num2, operator, answer });
        }
      }
    }
  } else if (operator === '*') {
    // 掛け算の場合
    for (let num1 = num1Min; num1 <= num1Max; num1++) {
      for (let num2 = num2Min; num2 <= num2Max; num2++) {
        const answer = num1 * num2;
        if (answer >= answerMin && answer <= answerMax) {
          cards.push({ num1, num2, operator, answer });
        }
      }
    }
  } else if (operator === '/') {
    // 割り算の場合
    for (let num1 = num1Min; num1 <= num1Max; num1++) {
      for (let num2 = num2Min; num2 <= num2Max; num2++) {
        if (num2 !== 0) {
          const answer = num1 / num2;
          if (Number.isInteger(answer) && answer >= answerMin && answer <= answerMax) {
            cards.push({ num1, num2, operator, answer });
          }
        }
      }
    }
  }

  return cards;
}

/**
 * カードリストをシャッフルする
 */
export function shuffleCards(cards: MathCard[]): MathCard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * カードセット定義を検証して、生成されたカード数が期待値と一致するか確認
 */
export function validateCardSet(definition: CardSetDefinition): {
  isValid: boolean;
  expectedCards: number;
  actualCards: number;
  message: string;
} {
  const cards = generateCardsForSet(definition);
  const actualCards = cards.length;
  const expectedCards = definition.totalCards;

  const isValid = actualCards === expectedCards;
  const message = isValid
    ? `✓ ${definition.name}: ${actualCards}枚 (期待値: ${expectedCards}枚)`
    : `✗ ${definition.name}: ${actualCards}枚 (期待値: ${expectedCards}枚) - 枚数が一致しません`;

  return { isValid, expectedCards, actualCards, message };
}
