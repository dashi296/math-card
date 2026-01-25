/**
 * Japanese number parsing functions
 */

import { kanjiToNum, unitToMultiplier } from './constants';
import { findUnitFuzzy, getBasicNumber } from './fuzzy-matching';
import { convertKatakanaToHiragana } from './helpers';
import type { NumberMap } from './types';

/**
 * 日本語数字の部分的なパース（千の位まで）
 *
 * 再帰的に処理することで複雑な数字表現に対応
 * 例: "二千三百四十五" → 2345
 */
export function parseJapaneseNumberPart(
  text: string,
  kanjiMap: NumberMap,
  unitMap: NumberMap
): number {
  let result = 0;

  // 千の位
  const senFuzzy = findUnitFuzzy(text, { せん: 1000, 千: 1000 });
  if (senFuzzy?.match) {
    const beforeSen = senFuzzy.match[1];
    const afterSen = senFuzzy.match[3];

    if (beforeSen) {
      const num = getBasicNumber(beforeSen, kanjiMap);
      result += num * 1000;
    } else {
      result += 1000;
    }

    if (afterSen) {
      result += parseJapaneseNumberPart(afterSen, kanjiMap, unitMap);
    }

    return result;
  }

  // 百の位
  const hyakuFuzzy = findUnitFuzzy(text, { ひゃく: 100, 百: 100 });
  if (hyakuFuzzy?.match) {
    const beforeHyaku = hyakuFuzzy.match[1];
    const afterHyaku = hyakuFuzzy.match[3];

    if (beforeHyaku) {
      const num = getBasicNumber(beforeHyaku, kanjiMap);
      result += num * 100;
    } else {
      result += 100;
    }

    if (afterHyaku) {
      result += parseJapaneseNumberPart(afterHyaku, kanjiMap, unitMap);
    }

    return result;
  }

  // 十の位
  const juFuzzy = findUnitFuzzy(text, { じゅう: 10, 十: 10 });
  if (juFuzzy?.match) {
    const beforeJu = juFuzzy.match[1];
    const afterJu = juFuzzy.match[3];

    if (beforeJu) {
      const num = getBasicNumber(beforeJu, kanjiMap);
      result += num * 10;
    } else {
      result += 10;
    }

    if (afterJu) {
      result += getBasicNumber(afterJu, kanjiMap);
    }

    return result;
  }

  // 一桁の数字
  return getBasicNumber(text, kanjiMap);
}

/**
 * 日本語テキストを数値にパース（0-99999）
 *
 * 万の位を含む完全な数字パース処理
 * 例: "一万二千三百四十五" → 12345
 */
export function parseJapaneseNumber(text: string): number | null {
  // 万の位の処理
  const manFuzzy = findUnitFuzzy(text, { まん: 10000, 万: 10000 });
  if (manFuzzy?.match) {
    const beforeMan = manFuzzy.match[1];
    const afterMan = manFuzzy.match[3];

    let result = 0;

    if (beforeMan) {
      result += parseJapaneseNumberPart(beforeMan, kanjiToNum, unitToMultiplier) * 10000;
    } else {
      result += 10000;
    }

    if (afterMan) {
      result += parseJapaneseNumberPart(afterMan, kanjiToNum, unitToMultiplier);
    }

    return result;
  }

  // 万がない場合は通常の処理
  const parsed = parseJapaneseNumberPart(text, kanjiToNum, unitToMultiplier);
  return parsed > 0 ? parsed : null;
}

/**
 * 音声テキストから数字を抽出
 *
 * 日本語の音声入力テキストを数字（文字列形式）に変換
 */
export function extractNumber(text: string): string {
  // アラビア数字をそのまま抽出
  const numberMatch = text.match(/\d+/);
  if (numberMatch) {
    return numberMatch[0];
  }

  // カタカナをひらがなに変換して統一
  const processedText = convertKatakanaToHiragana(text.toLowerCase());

  // 日本語数字のパース
  const parsedNumber = parseJapaneseNumber(processedText);
  if (parsedNumber !== null) {
    return parsedNumber.toString();
  }

  // 単純なマッチング（後方互換）
  for (const [key, value] of Object.entries(kanjiToNum)) {
    if (processedText.includes(key.toLowerCase())) {
      return value.toString();
    }
  }

  return text;
}
