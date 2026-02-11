/**
 * Japanese number parsing utilities
 *
 * Main exports for extracting and scoring numbers from Japanese voice input
 */

import {
  FUZZY_MATCH_THRESHOLD,
  kanjiToNum,
  MISRECOGNITION_MAP,
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

  // 誤認識パターンにマッチする場合は高スコアを付与
  for (const misrecognizedWord of Object.keys(MISRECOGNITION_MAP)) {
    if (text === misrecognizedWord || text.includes(misrecognizedWord)) {
      score += SCORE.NUMBER_CONVERSION; // 数字変換可能と同等のスコア
      break;
    }
  }

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
    // 変換後の数字が2桁以上の場合、さらに追加ボーナス
    if (extractedNumber.length >= 2) {
      score += SCORE.COMPOUND_NUMBER_BONUS;
    }
  }

  // アラビア数字が含まれている場合はさらに加点
  if (/\d/.test(text)) {
    score += SCORE.ARABIC_NUMERAL;
  }

  // 複合数字（十、百、千）を含む場合は大きく加点
  const compoundUnits = ['じゅう', 'ジュウ', '十', 'ひゃく', 'ヒャク', '百', 'せん', 'セン', '千'];
  for (const unit of compoundUnits) {
    if (lowerText.includes(unit.toLowerCase())) {
      score += SCORE.COMPOUND_NUMBER_BONUS;
    }
  }

  // 長い表現を優先（文字数に応じたボーナス）
  score += text.length * SCORE.LENGTH_BONUS_PER_CHAR;

  // テキストが短すぎる場合は減点
  if (text.length === 1 && !text.match(/\d/)) {
    score += SCORE.SINGLE_CHAR_PENALTY;
  }

  // 2文字以下で数字でない場合は強いペナルティ（ただし誤認識パターンは除外）
  const isMisrecognized = Object.keys(MISRECOGNITION_MAP).some((word) => text.includes(word));
  if (
    text.length <= 2 &&
    !text.match(/\d/) &&
    !compoundUnits.some((u) => lowerText.includes(u.toLowerCase())) &&
    !isMisrecognized
  ) {
    score += SCORE.SHORT_TEXT_PENALTY;
  }

  // 余計な単語が含まれている場合は減点（ただし誤認識パターンは除外）
  if (!isMisrecognized) {
    for (const word of NOISE_WORDS) {
      if (lowerText.includes(word)) {
        score += SCORE.NOISE_WORD_PENALTY;
      }
    }
  }

  // 抽出された数字が3桁以上の場合にペナルティ（計算問題の範囲は通常1-100）
  if (extractedNumber.match(/^\d+$/)) {
    const numValue = Number.parseInt(extractedNumber, 10);
    if (numValue >= 1000) {
      score += SCORE.FOUR_DIGIT_PENALTY;
    } else if (numValue >= 100) {
      score += SCORE.THREE_DIGIT_PENALTY;
    }

    // 繰り返しパターンの検出（例: 1010, 121, 1212など）
    // 数字が2桁以上で、前半と後半が同じ、または数字の繰り返しパターン
    if (extractedNumber.length >= 3) {
      const hasRepeatingPattern =
        // 前半と後半が同じ（1010 = 10 + 10）
        (extractedNumber.length % 2 === 0 &&
         extractedNumber.slice(0, extractedNumber.length / 2) === extractedNumber.slice(extractedNumber.length / 2)) ||
        // 同じ桁の繰り返し（111, 222など）
        /^(\d)\1+$/.test(extractedNumber);

      if (hasRepeatingPattern) {
        score += SCORE.REPEATING_PATTERN_PENALTY;
      }
    }
  }

  return score;
}
