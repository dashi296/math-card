/**
 * Japanese number parsing utilities
 *
 * Main exports for extracting and scoring numbers from Japanese voice input
 */

import {
  FUZZY_MATCH_THRESHOLD,
  kanjiToNum,
  NOISE_WORDS,
  phoneticSimilarity,
  SCORE,
  unitToMultiplier,
} from './constants';
import { calculateSimilarity } from './helpers';
import { extractNumber } from './parser';

// Re-export main parsing function
export { extractNumber };

/**
 * 数字キーワードを生成
 */
function generateNumberKeywords(): string[] {
  const keywords = new Set<string>();

  for (const key of Object.keys(kanjiToNum)) {
    keywords.add(key);
  }

  for (const key of Object.keys(unitToMultiplier)) {
    keywords.add(key);
  }

  for (let i = 0; i <= 9; i++) {
    keywords.add(i.toString());
  }

  return Array.from(keywords);
}

const NUMBER_KEYWORDS = generateNumberKeywords();

/**
 * 候補テキストが数字としてどれだけ妥当かをスコアリング
 *
 * 音声認識結果の複数の候補から、最も数字らしい候補を選択するために使用
 */
export function scoreNumberCandidate(text: string): number {
  let score = 0;
  const lowerText = text.toLowerCase();

  // 数字キーワードの出現回数をスコアに加算
  for (const keyword of NUMBER_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += SCORE.KEYWORD_MATCH;
    }
  }

  // ファジーマッチングで数字キーワードを検出
  for (const variants of Object.values(phoneticSimilarity)) {
    for (const variant of variants) {
      const similarity = calculateSimilarity(lowerText, variant);
      if (similarity >= FUZZY_MATCH_THRESHOLD) {
        score += SCORE.FUZZY_MATCH_BASE * similarity;
      }
    }
  }

  // 数字に変換できるかチェック
  const extractedNumber = extractNumber(text);
  if (extractedNumber !== text && extractedNumber.match(/^\d+$/)) {
    score += SCORE.NUMBER_CONVERSION;
  }

  // アラビア数字が含まれている場合はさらに加点
  if (/\d/.test(text)) {
    score += SCORE.ARABIC_NUMERAL;
  }

  // テキストが短すぎる場合は減点
  if (text.length === 1 && !text.match(/\d/)) {
    score += SCORE.SINGLE_CHAR_PENALTY;
  }

  // 余計な単語が含まれている場合は減点
  for (const word of NOISE_WORDS) {
    if (lowerText.includes(word)) {
      score += SCORE.NOISE_WORD_PENALTY;
    }
  }

  return score;
}
