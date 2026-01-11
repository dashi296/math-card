/**
 * Helper functions for Japanese number parsing
 */

import { katakanaToHiragana } from './constants';

/**
 * カタカナをひらがなに変換（数字関連の文字のみ）
 */
export function convertKatakanaToHiragana(text: string): string {
  let result = text;
  for (const [katakana, hiragana] of Object.entries(katakanaToHiragana)) {
    result = result.replace(new RegExp(katakana, 'g'), hiragana);
  }
  return result;
}

/**
 * レーベンシュタイン距離を計算（動的計画法）
 *
 * 2つの文字列間の編集距離（挿入、削除、置換の最小回数）を計算
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * 文字列の類似度を計算（レーベンシュタイン距離ベース）
 *
 * @returns 類似度（0.0〜1.0、1.0が完全一致）
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}
