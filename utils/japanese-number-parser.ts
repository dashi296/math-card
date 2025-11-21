/**
 * 日本語の音声テキストから数字を抽出するユーティリティ
 */

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
 * 基本的な数字（0-9）の取得
 */
function getBasicNumber(
  text: string,
  kanjiMap: { [key: string]: number }
): number {
  const lowerText = text.toLowerCase().trim();

  for (const [key, value] of Object.entries(kanjiMap)) {
    if (lowerText.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 0;
}

/**
 * 日本語数字の部分的なパース（千、百、十の位まで）
 */
function parseJapaneseNumberPart(
  text: string,
  kanjiMap: { [key: string]: number },
  unitMap: { [key: string]: number }
): number {
  let result = 0;

  // 千の位
  const senMatch = text.match(/(.+)?(せん|千)(.*)$/);
  if (senMatch) {
    const beforeSen = senMatch[1];
    const afterSen = senMatch[3];

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
  const hyakuMatch = text.match(/(.+)?(ひゃく|百)(.*)$/);
  if (hyakuMatch) {
    const beforeHyaku = hyakuMatch[1];
    const afterHyaku = hyakuMatch[3];

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
  const juMatch = text.match(/(.+)?(じゅう|十)(.*)$/);
  if (juMatch) {
    const beforeJu = juMatch[1];
    const afterJu = juMatch[3];

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

  // 万の位の処理
  const manMatch = processedText.match(/(.+)(まん|万)(.*)$/);
  if (manMatch) {
    const beforeMan = manMatch[1];
    const afterMan = manMatch[3];

    // 万の前の部分を処理
    result +=
      parseJapaneseNumberPart(beforeMan, kanjiToNum, unitToMultiplier) * 10000;

    // 万の後の部分を処理
    if (afterMan) {
      result += parseJapaneseNumberPart(
        afterMan,
        kanjiToNum,
        unitToMultiplier
      );
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
 */
export function scoreNumberCandidate(text: string): number {
  let score = 0;
  const lowerText = text.toLowerCase();

  // 数字キーワードが含まれているかチェック
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

  // 数字キーワードの出現回数をスコアに加算
  numberKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 10;
    }
  });

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
