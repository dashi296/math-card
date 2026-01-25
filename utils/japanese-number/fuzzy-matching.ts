/**
 * Fuzzy matching functions for Japanese number recognition
 */

import {
  FUZZY_MATCH_THRESHOLD,
  PARTIAL_MATCH_SIMILARITY,
  phoneticSimilarity,
  UNIT_FUZZY_MATCH_THRESHOLD,
} from './constants';
import { calculateSimilarity } from './helpers';
import type { NumberMap } from './types';

/**
 * ファジーマッチングで基本数字を取得（0-9）
 *
 * 音韻類似度と部分一致を考慮して、不正確な発声から数字を認識
 */
export function getBasicNumberFuzzy(text: string, kanjiMap: NumberMap): number | null {
  const lowerText = text.toLowerCase().trim();

  // 完全一致を優先
  for (const [key, value] of Object.entries(kanjiMap)) {
    if (lowerText.includes(key.toLowerCase())) {
      return value;
    }
  }

  // 音韻類似度マッピングをチェック
  for (const [base, variants] of Object.entries(phoneticSimilarity)) {
    for (const variant of variants) {
      const similarity = calculateSimilarity(lowerText, variant);
      if (similarity >= FUZZY_MATCH_THRESHOLD) {
        // ベース音から数字を取得
        for (const [key, value] of Object.entries(kanjiMap)) {
          if (key.toLowerCase() === base.toLowerCase()) {
            return value;
          }
        }
      }
    }
  }

  // ファジーマッチング（部分一致）
  let bestMatch: { key: string; value: number; similarity: number } | null = null;
  for (const [key, value] of Object.entries(kanjiMap)) {
    const keyLower = key.toLowerCase();
    if (lowerText.includes(keyLower) || keyLower.includes(lowerText)) {
      const similarity = calculateSimilarity(lowerText, keyLower);
      if (similarity >= FUZZY_MATCH_THRESHOLD) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { key, value, similarity };
        }
      }
    }
  }

  return bestMatch ? bestMatch.value : null;
}

/**
 * 基本数字を取得（0-9）
 */
export function getBasicNumber(text: string, kanjiMap: NumberMap): number {
  const fuzzyResult = getBasicNumberFuzzy(text, kanjiMap);
  return fuzzyResult !== null ? fuzzyResult : 0;
}

/**
 * ファジーマッチングで位取り単位を検索
 */
export function findUnitFuzzy(
  text: string,
  unitMap: NumberMap
): {
  unit: string;
  multiplier: number;
  match: RegExpMatchArray | null;
} | null {
  // 完全一致を優先
  for (const [unit, multiplier] of Object.entries(unitMap)) {
    const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(.+)?(${escapedUnit})(.*)$`);
    const match = text.match(regex);
    if (match) {
      return { unit, multiplier, match };
    }
  }

  // ファジーマッチング（部分一致）
  let bestMatch: {
    unit: string;
    multiplier: number;
    match: RegExpMatchArray;
    similarity: number;
  } | null = null;

  for (const [unit, multiplier] of Object.entries(unitMap)) {
    // 単位の類似バリエーションをチェック
    const unitVariants = phoneticSimilarity[unit] || [unit];
    for (const variant of unitVariants) {
      const similarity = calculateSimilarity(text, variant);
      if (similarity >= UNIT_FUZZY_MATCH_THRESHOLD) {
        const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(.+)?(${escapedVariant})(.*)$`);
        const match = text.match(regex);
        if (match && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = { unit, multiplier, match, similarity };
        }
      }
    }

    // 部分一致チェック
    const partialUnit = unit.substring(0, Math.max(1, unit.length - 1));
    if (text.includes(partialUnit) && partialUnit.length >= 1) {
      const escapedPartial = partialUnit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(.+)?(${escapedPartial})(.*)$`);
      const match = text.match(regex);
      if (match && (!bestMatch || PARTIAL_MATCH_SIMILARITY > (bestMatch.similarity || 0))) {
        bestMatch = { unit, multiplier, match, similarity: PARTIAL_MATCH_SIMILARITY };
      }
    }
  }

  return bestMatch
    ? {
        unit: bestMatch.unit,
        multiplier: bestMatch.multiplier,
        match: bestMatch.match,
      }
    : null;
}
