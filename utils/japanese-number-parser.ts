/**
 * 日本語の音声テキストから数字を抽出するユーティリティ
 * 不正確な発声にも対応するためのファジーマッチング機能を含む
 */

// 音韻類似度マッピング（似た音のグループ）
const phoneticSimilarity: { [key: string]: string[] } = {
  // いち系
  いち: ["いっ", "い", "いち", "いっち"],
  イチ: ["イッ", "イ", "イチ", "イッチ"],
  // に系
  に: ["に", "にい", "にー"],
  ニ: ["ニ", "ニー"],
  // さん系
  さん: ["さん", "さ", "さーん", "さあん"],
  サン: ["サン", "サ", "サーン"],
  // し/よん系
  し: ["し", "しー", "しぃ"],
  よん: ["よん", "よ", "よーん", "よおん"],
  ヨン: ["ヨン", "ヨ", "ヨーン"],
  // ご系
  ご: ["ご", "ごー", "ごお"],
  ゴ: ["ゴ", "ゴー"],
  // ろく系
  ろく: ["ろく", "ろ", "ろっ", "ろーく"],
  ロク: ["ロク", "ロ", "ロッ", "ローク"],
  // しち/なな系
  しち: ["しち", "し", "しっち", "しーち"],
  なな: ["なな", "な", "なーな", "なあな"],
  ナナ: ["ナナ", "ナ", "ナーナ"],
  // はち系
  はち: ["はち", "は", "はっ", "はーち", "はっち"],
  ハチ: ["ハチ", "ハ", "ハッ", "ハーチ"],
  // きゅう/く系
  きゅう: ["きゅう", "きゅ", "きゅー", "きゅうう"],
  く: ["く", "くー", "くう"],
  キュウ: ["キュウ", "キュ", "キュー"],
  ク: ["ク", "クー"],
  // じゅう系
  じゅう: ["じゅう", "じゅ", "じゅー", "じゅうう", "じゅーう"],
  ジュウ: ["ジュウ", "ジュ", "ジュー"],
  // ひゃく系
  ひゃく: ["ひゃく", "ひゃ", "ひゃーく", "ひゃっ", "ひゃくく"],
  ヒャク: ["ヒャク", "ヒャ", "ヒャーク"],
  // せん系
  せん: ["せん", "せ", "せーん", "せえん", "せんん"],
  セン: ["セン", "セ", "セーン"],
  // まん系
  まん: ["まん", "ま", "まーん", "まあん"],
  マン: ["マン", "マ", "マーン"],
};

// 日本語の基本数字マッピング（0-9）
const kanjiToNum: { [key: string]: number } = {
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

// 位取りマッピング
const unitToMultiplier: { [key: string]: number } = {
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

/**
 * 文字列の類似度を計算（レーベンシュタイン距離ベースの簡易版）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * レーベンシュタイン距離を計算
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

/**
 * ファジーマッチングで数字を取得（似た音も認識）
 */
function getBasicNumberFuzzy(
  text: string,
  kanjiMap: { [key: string]: number }
): number | null {
  const lowerText = text.toLowerCase().trim();
  const threshold = 0.6; // 類似度の閾値

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
      if (similarity >= threshold) {
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
  let bestMatch: { key: string; value: number; similarity: number } | null =
    null;
  for (const [key, value] of Object.entries(kanjiMap)) {
    const keyLower = key.toLowerCase();
    // 部分一致チェック
    if (lowerText.includes(keyLower) || keyLower.includes(lowerText)) {
      const similarity = calculateSimilarity(lowerText, keyLower);
      if (similarity >= threshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { key, value, similarity };
        }
      }
    }
  }

  return bestMatch ? bestMatch.value : null;
}

/**
 * 基本的な数字（0-9）の取得（後方互換性のため残す）
 */
function getBasicNumber(
  text: string,
  kanjiMap: { [key: string]: number }
): number {
  const fuzzyResult = getBasicNumberFuzzy(text, kanjiMap);
  return fuzzyResult !== null ? fuzzyResult : 0;
}

/**
 * ファジーマッチングで単位を検索
 */
function findUnitFuzzy(
  text: string,
  unitMap: { [key: string]: number }
): {
  unit: string;
  multiplier: number;
  match: RegExpMatchArray | null;
} | null {
  // 完全一致を優先
  for (const [unit, multiplier] of Object.entries(unitMap)) {
    const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(.+)?(${escapedUnit})(.*)$`);
    const match = text.match(regex);
    if (match) {
      return { unit, multiplier, match };
    }
  }

  // ファジーマッチング（部分一致）
  const threshold = 0.5;
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
      if (similarity >= threshold) {
        const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
      const escapedPartial = partialUnit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(.+)?(${escapedPartial})(.*)$`);
      const match = text.match(regex);
      if (match && (!bestMatch || 0.7 > (bestMatch.similarity || 0))) {
        bestMatch = { unit, multiplier, match, similarity: 0.7 };
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
 * 日本語数字の部分的なパース（千、百、十の位まで）
 * ファジーマッチング対応版
 */
function parseJapaneseNumberPart(
  text: string,
  kanjiMap: { [key: string]: number },
  unitMap: { [key: string]: number }
): number {
  let result = 0;

  // 千の位（ファジーマッチング対応）
  const senFuzzy = findUnitFuzzy(text, { せん: 1000, 千: 1000 });
  if (senFuzzy && senFuzzy.match) {
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
  if (hyakuFuzzy && hyakuFuzzy.match) {
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
  if (juFuzzy && juFuzzy.match) {
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
 * 音声テキストから数字を抽出
 */
export function extractNumber(text: string): string {
  // まず、アラビア数字をそのまま抽出
  const numberMatch = text.match(/\d+/);
  if (numberMatch) {
    return numberMatch[0];
  }

  let processedText = text.toLowerCase();

  // カタカナをひらがなに変換して統一
  processedText = processedText
    .replace(/ゼロ/g, "ぜろ")
    .replace(/イチ/g, "いち")
    .replace(/ニ/g, "に")
    .replace(/サン/g, "さん")
    .replace(/シ/g, "し")
    .replace(/ヨン/g, "よん")
    .replace(/ゴ/g, "ご")
    .replace(/ロク/g, "ろく")
    .replace(/シチ/g, "しち")
    .replace(/ナナ/g, "なな")
    .replace(/ハチ/g, "はち")
    .replace(/キュウ/g, "きゅう")
    .replace(/ク/g, "く")
    .replace(/ジュウ/g, "じゅう")
    .replace(/ヒャク/g, "ひゃく")
    .replace(/セン/g, "せん")
    .replace(/マン/g, "まん");

  // 複雑な数字の変換（例：二十三、百五、千二百三十四）
  let result = 0;

  // 万の位の処理（ファジーマッチング対応）
  const manFuzzy = findUnitFuzzy(processedText, { まん: 10000, 万: 10000 });
  if (manFuzzy && manFuzzy.match) {
    const beforeMan = manFuzzy.match[1];
    const afterMan = manFuzzy.match[3];

    // 万の前の部分を処理
    result +=
      parseJapaneseNumberPart(beforeMan, kanjiToNum, unitToMultiplier) * 10000;

    // 万の後の部分を処理
    if (afterMan) {
      result += parseJapaneseNumberPart(afterMan, kanjiToNum, unitToMultiplier);
    }

    return result.toString();
  }

  // 万がない場合は通常の処理
  const parsed = parseJapaneseNumberPart(
    processedText,
    kanjiToNum,
    unitToMultiplier
  );
  if (parsed > 0) {
    return parsed.toString();
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
 * 候補が数字としてどれだけ妥当かをスコアリング
 * ファジーマッチングも考慮
 */
export function scoreNumberCandidate(text: string): number {
  let score = 0;
  const lowerText = text.toLowerCase();

  // 数字キーワードが含まれているかチェック（ファジーマッチングも考慮）
  const numberKeywords = [
    "ぜろ",
    "れい",
    "いち",
    "に",
    "さん",
    "し",
    "よん",
    "ご",
    "ろく",
    "しち",
    "なな",
    "はち",
    "きゅう",
    "く",
    "じゅう",
    "ひゃく",
    "せん",
    "まん",
    "ゼロ",
    "レイ",
    "イチ",
    "ニ",
    "サン",
    "シ",
    "ヨン",
    "ゴ",
    "ロク",
    "シチ",
    "ナナ",
    "ハチ",
    "キュウ",
    "ク",
    "ジュウ",
    "ヒャク",
    "セン",
    "マン",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
    "百",
    "千",
    "万",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];

  // 数字キーワードの出現回数をスコアに加算（完全一致）
  numberKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 10;
    }
  });

  // ファジーマッチングで数字キーワードを検出
  for (const [base, variants] of Object.entries(phoneticSimilarity)) {
    for (const variant of variants) {
      const similarity = calculateSimilarity(lowerText, variant);
      if (similarity >= 0.6) {
        score += 5 * similarity; // 類似度に応じてスコアを加算
      }
    }
  }

  // 数字に変換できるかチェック
  const extractedNumber = extractNumber(text);
  if (extractedNumber !== text && extractedNumber.match(/^\d+$/)) {
    score += 50; // 数字に変換できた場合は高スコア
  }

  // アラビア数字が含まれている場合はさらに加点
  if (/\d/.test(text)) {
    score += 30;
  }

  // テキストが短すぎる場合は減点（1文字の場合）
  if (text.length === 1 && !text.match(/\d/)) {
    score -= 20;
  }

  // 余計な単語が含まれている場合は減点
  const noiseWords = [
    "です",
    "ます",
    "でした",
    "ました",
    "は",
    "が",
    "を",
    "の",
    "と",
  ];
  noiseWords.forEach((word) => {
    if (lowerText.includes(word)) {
      score -= 15;
    }
  });

  return score;
}
