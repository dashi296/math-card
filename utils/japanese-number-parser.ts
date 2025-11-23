/**
 * 日本語の音声テキストから数字を抽出するユーティリティ
 *
 * 主な機能:
 * - 日本語音声入力（ひらがな、カタカナ、漢字）を数値に変換
 * - ファジーマッチングによる不正確な発声への対応
 * - 音韻類似度を考慮した柔軟な認識
 * - 0から99999までの数字に対応
 *
 * 使用例:
 * - extractNumber("にじゅうさん") → "23"
 * - extractNumber("千二百三十四") → "1234"
 * - scoreNumberCandidate("にじゅう") → 高スコア（数字候補として妥当）
 */

// ========================================
// 型定義
// ========================================

type NumberMap = Record<string, number>;
type PhoneticMap = Record<string, string[]>;

// ========================================
// 定数定義
// ========================================

/** ファジーマッチングの類似度閾値 */
const FUZZY_MATCH_THRESHOLD = 0.6;
const UNIT_FUZZY_MATCH_THRESHOLD = 0.5;
const PARTIAL_MATCH_SIMILARITY = 0.7;

/** スコアリング定数 */
const SCORE = {
  KEYWORD_MATCH: 10,
  FUZZY_MATCH_BASE: 5,
  NUMBER_CONVERSION: 50,
  ARABIC_NUMERAL: 30,
  SINGLE_CHAR_PENALTY: -20,
  NOISE_WORD_PENALTY: -15,
} as const;

/** ノイズワード */
const NOISE_WORDS = ['です', 'ます', 'でした', 'ました', 'は', 'が', 'を', 'の', 'と'] as const;

// ========================================
// 変換マッピング
// ========================================

/** カタカナ→ひらがな変換マッピング（数字関連のみ） */
const katakanaToHiragana: Record<string, string> = {
  ゼロ: 'ぜろ',
  イチ: 'いち',
  ニ: 'に',
  サン: 'さん',
  シ: 'し',
  ヨン: 'よん',
  ゴ: 'ご',
  ロク: 'ろく',
  シチ: 'しち',
  ナナ: 'なな',
  ハチ: 'はち',
  キュウ: 'きゅう',
  ク: 'く',
  ジュウ: 'じゅう',
  ヒャク: 'ひゃく',
  セン: 'せん',
  マン: 'まん',
};

/**
 * 音韻類似度マッピング
 *
 * 不正確な発声や音声認識エラーに対応するため、
 * 各数字の似た音のバリエーションを定義
 *
 * 例: "いち" → ["いっ", "い", "いち", "いっち"]
 */
const phoneticSimilarity: PhoneticMap = {
  // いち系
  いち: ['いっ', 'い', 'いち', 'いっち'],
  イチ: ['イッ', 'イ', 'イチ', 'イッチ'],
  // に系
  に: ['に', 'にい', 'にー'],
  ニ: ['ニ', 'ニー'],
  // さん系
  さん: ['さん', 'さ', 'さーん', 'さあん'],
  サン: ['サン', 'サ', 'サーン'],
  // し/よん系
  し: ['し', 'しー', 'しぃ'],
  よん: ['よん', 'よ', 'よーん', 'よおん'],
  ヨン: ['ヨン', 'ヨ', 'ヨーン'],
  // ご系
  ご: ['ご', 'ごー', 'ごお'],
  ゴ: ['ゴ', 'ゴー'],
  // ろく系
  ろく: ['ろく', 'ろ', 'ろっ', 'ろーく'],
  ロク: ['ロク', 'ロ', 'ロッ', 'ローク'],
  // しち/なな系
  しち: ['しち', 'し', 'しっち', 'しーち'],
  なな: ['なな', 'な', 'なーな', 'なあな'],
  ナナ: ['ナナ', 'ナ', 'ナーナ'],
  // はち系
  はち: ['はち', 'は', 'はっ', 'はーち', 'はっち'],
  ハチ: ['ハチ', 'ハ', 'ハッ', 'ハーチ'],
  // きゅう/く系
  きゅう: ['きゅう', 'きゅ', 'きゅー', 'きゅうう'],
  く: ['く', 'くー', 'くう'],
  キュウ: ['キュウ', 'キュ', 'キュー'],
  ク: ['ク', 'クー'],
  // じゅう系
  じゅう: ['じゅう', 'じゅ', 'じゅー', 'じゅうう', 'じゅーう'],
  ジュウ: ['ジュウ', 'ジュ', 'ジュー'],
  // ひゃく系
  ひゃく: ['ひゃく', 'ひゃ', 'ひゃーく', 'ひゃっ', 'ひゃくく'],
  ヒャク: ['ヒャク', 'ヒャ', 'ヒャーク'],
  // せん系
  せん: ['せん', 'せ', 'せーん', 'せえん', 'せんん'],
  セン: ['セン', 'セ', 'セーン'],
  // まん系
  まん: ['まん', 'ま', 'まーん', 'まあん'],
  マン: ['マン', 'マ', 'マーン'],
};

/**
 * 基本数字マッピング（0-9）
 *
 * ひらがな、カタカナ、漢字、正字体（壱・弐・参）を含む
 * すべての基本的な数字表記を数値に変換
 */
const kanjiToNum: NumberMap = {
  零: 0,
  ゼロ: 0,
  れい: 0,
  レイ: 0,
  一: 1,
  いち: 1,
  イチ: 1,
  壱: 1,
  二: 2,
  に: 2,
  ニ: 2,
  弐: 2,
  三: 3,
  さん: 3,
  サン: 3,
  参: 3,
  四: 4,
  し: 4,
  よん: 4,
  シ: 4,
  ヨン: 4,
  五: 5,
  ご: 5,
  ゴ: 5,
  六: 6,
  ろく: 6,
  ロク: 6,
  七: 7,
  しち: 7,
  なな: 7,
  シチ: 7,
  ナナ: 7,
  八: 8,
  はち: 8,
  ハチ: 8,
  九: 9,
  きゅう: 9,
  く: 9,
  キュウ: 9,
  ク: 9,
};

/**
 * 位取り単位マッピング
 *
 * 十、百、千、万の各位の表記（ひらがな、カタカナ、漢字）を
 * 対応する倍数に変換
 */
const unitToMultiplier: NumberMap = {
  十: 10,
  じゅう: 10,
  ジュウ: 10,
  百: 100,
  ひゃく: 100,
  ヒャク: 100,
  千: 1000,
  せん: 1000,
  セン: 1000,
  万: 10000,
  まん: 10000,
  マン: 10000,
};

// ========================================
// ヘルパー関数
// ========================================

/**
 * カタカナをひらがなに変換（数字関連の文字のみ）
 *
 * @param text - 変換対象のテキスト
 * @returns ひらがなに変換されたテキスト
 */
function convertKatakanaToHiragana(text: string): string {
  let result = text;
  for (const [katakana, hiragana] of Object.entries(katakanaToHiragana)) {
    result = result.replace(new RegExp(katakana, 'g'), hiragana);
  }
  return result;
}

/**
 * 文字列の類似度を計算（レーベンシュタイン距離ベース）
 *
 * @param str1 - 比較文字列1
 * @param str2 - 比較文字列2
 * @returns 類似度（0.0〜1.0、1.0が完全一致）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * レーベンシュタイン距離を計算（動的計画法）
 *
 * 2つの文字列間の編集距離（挿入、削除、置換の最小回数）を計算
 *
 * @param str1 - 比較文字列1
 * @param str2 - 比較文字列2
 * @returns 編集距離
 */
function levenshteinDistance(str1: string, str2: string): number {
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

// ========================================
// 数字パース処理
// ========================================

/**
 * ファジーマッチングで基本数字を取得（0-9）
 *
 * 音韻類似度と部分一致を考慮して、不正確な発声から数字を認識
 *
 * @param text - 検索対象のテキスト
 * @param kanjiMap - 数字マッピング
 * @returns 認識された数値、または null
 */
function getBasicNumberFuzzy(text: string, kanjiMap: NumberMap): number | null {
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
    // 部分一致チェック
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
 *
 * getBasicNumberFuzzyのラッパー関数。nullの場合は0を返す
 *
 * @param text - 検索対象のテキスト
 * @param kanjiMap - 数字マッピング
 * @returns 認識された数値（見つからない場合は0）
 */
function getBasicNumber(text: string, kanjiMap: NumberMap): number {
  const fuzzyResult = getBasicNumberFuzzy(text, kanjiMap);
  return fuzzyResult !== null ? fuzzyResult : 0;
}

/**
 * ファジーマッチングで位取り単位を検索
 *
 * テキスト内から十、百、千、万などの単位を検索し、
 * 前後のテキストと共に返す
 *
 * @param text - 検索対象のテキスト
 * @param unitMap - 単位マッピング
 * @returns 単位情報（単位、倍数、マッチ結果）、または null
 */
function findUnitFuzzy(
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

    // 部分一致チェック（「じゅう」が「じゅ」と認識された場合など）
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

/**
 * 日本語数字の部分的なパース（千の位まで）
 *
 * 千、百、十の位を持つ数字をパースする（万の位は含まない）
 * 再帰的に処理することで複雑な数字表現に対応
 *
 * 例: "二千三百四十五" → 2345
 *
 * @param text - パース対象のテキスト
 * @param kanjiMap - 基本数字マッピング
 * @param unitMap - 位取り単位マッピング
 * @returns パースされた数値
 */
function parseJapaneseNumberPart(text: string, kanjiMap: NumberMap, unitMap: NumberMap): number {
  let result = 0;

  // 千の位（ファジーマッチング対応）
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

  // 百の位（ファジーマッチング対応）
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

  // 十の位（ファジーマッチング対応）
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
 * parseJapaneseNumberPartを使用して各位を処理
 *
 * 例: "一万二千三百四十五" → 12345
 *
 * @param text - パース対象のテキスト
 * @returns パースされた数値、または null（パース失敗時）
 */
function parseJapaneseNumber(text: string): number | null {
  // 万の位の処理（ファジーマッチング対応）
  const manFuzzy = findUnitFuzzy(text, { まん: 10000, 万: 10000 });
  if (manFuzzy?.match) {
    const beforeMan = manFuzzy.match[1];
    const afterMan = manFuzzy.match[3];

    let result = 0;

    // 万の前の部分を処理
    if (beforeMan) {
      result += parseJapaneseNumberPart(beforeMan, kanjiToNum, unitToMultiplier) * 10000;
    } else {
      result += 10000;
    }

    // 万の後の部分を処理
    if (afterMan) {
      result += parseJapaneseNumberPart(afterMan, kanjiToNum, unitToMultiplier);
    }

    return result;
  }

  // 万がない場合は通常の処理
  const parsed = parseJapaneseNumberPart(text, kanjiToNum, unitToMultiplier);
  return parsed > 0 ? parsed : null;
}

// ========================================
// 公開API
// ========================================

/**
 * 音声テキストから数字を抽出
 *
 * 日本語の音声入力テキストを数字（文字列形式）に変換します。
 * アラビア数字、ひらがな、カタカナ、漢字のすべてに対応。
 *
 * 処理手順:
 * 1. アラビア数字が含まれていればそのまま返す
 * 2. カタカナをひらがなに変換
 * 3. 日本語数字表現をパース
 * 4. パース失敗時は簡易マッチングを試行
 *
 * @param text - 音声認識結果のテキスト
 * @returns 抽出された数字（文字列）。抽出できない場合は元のテキストを返す
 *
 * @example
 * extractNumber("にじゅうさん") // "23"
 * extractNumber("千二百三十四") // "1234"
 * extractNumber("一万") // "10000"
 * extractNumber("123") // "123"
 */
export function extractNumber(text: string): string {
  // まず、アラビア数字をそのまま抽出
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

/**
 * 数字キーワードを生成
 *
 * kanjiToNumとunitToMultiplierから自動的に
 * 数字関連キーワードのリストを生成
 *
 * @returns 数字キーワードの配列
 */
function generateNumberKeywords(): string[] {
  const keywords = new Set<string>();

  // kanjiToNumのキーを追加
  for (const key of Object.keys(kanjiToNum)) {
    keywords.add(key);
  }

  // unitToMultiplierのキーを追加
  for (const key of Object.keys(unitToMultiplier)) {
    keywords.add(key);
  }

  // アラビア数字を追加
  for (let i = 0; i <= 9; i++) {
    keywords.add(i.toString());
  }

  return Array.from(keywords);
}

/** 数字キーワードのキャッシュ */
const NUMBER_KEYWORDS = generateNumberKeywords();

/**
 * 候補テキストが数字としてどれだけ妥当かをスコアリング
 *
 * 音声認識結果の複数の候補から、最も数字らしい候補を選択するために使用。
 * 様々な要素を考慮してスコアを計算します。
 *
 * スコアリング要素:
 * - 数字キーワードの含有 (+10点/キーワード)
 * - ファジーマッチング (+5点 × 類似度)
 * - 数字への変換可能性 (+50点)
 * - アラビア数字の含有 (+30点)
 * - 単一文字ペナルティ (-20点)
 * - ノイズワードペナルティ (-15点/単語)
 *
 * @param text - スコアリング対象のテキスト
 * @returns スコア（高いほど数字として妥当）
 *
 * @example
 * scoreNumberCandidate("にじゅう") // 高スコア
 * scoreNumberCandidate("こんにちは") // 低スコア
 */
export function scoreNumberCandidate(text: string): number {
  let score = 0;
  const lowerText = text.toLowerCase();

  // 数字キーワードの出現回数をスコアに加算（完全一致）
  NUMBER_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += SCORE.KEYWORD_MATCH;
    }
  });

  // ファジーマッチングで数字キーワードを検出
  for (const variants of Object.values(phoneticSimilarity)) {
    for (const variant of variants) {
      const similarity = calculateSimilarity(lowerText, variant);
      if (similarity >= FUZZY_MATCH_THRESHOLD) {
        score += SCORE.FUZZY_MATCH_BASE * similarity; // 類似度に応じてスコアを加算
      }
    }
  }

  // 数字に変換できるかチェック
  const extractedNumber = extractNumber(text);
  if (extractedNumber !== text && extractedNumber.match(/^\d+$/)) {
    score += SCORE.NUMBER_CONVERSION; // 数字に変換できた場合は高スコア
  }

  // アラビア数字が含まれている場合はさらに加点
  if (/\d/.test(text)) {
    score += SCORE.ARABIC_NUMERAL;
  }

  // テキストが短すぎる場合は減点（1文字の場合）
  if (text.length === 1 && !text.match(/\d/)) {
    score += SCORE.SINGLE_CHAR_PENALTY;
  }

  // 余計な単語が含まれている場合は減点
  NOISE_WORDS.forEach((word) => {
    if (lowerText.includes(word)) {
      score += SCORE.NOISE_WORD_PENALTY;
    }
  });

  return score;
}
