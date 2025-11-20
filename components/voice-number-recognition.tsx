import {
  AudioEncodingAndroid,
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useState } from "react";
import { Alert, Button, Platform, StyleSheet, Text, View } from "react-native";

export default function VoiceNumberRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [recognizedNumber, setRecognizedNumber] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [error, setError] = useState("");
  const [interimText, setInterimText] = useState("");

  // 音声認識開始イベント
  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
    setError("");
  });

  // 音声認識終了イベント
  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  // 音声認識結果イベント
  useSpeechRecognitionEvent("result", (event) => {
    const results = event.results;
    if (results && results.length > 0) {
      const result = results[0];
      const { transcript } = result;

      if (transcript) {
        // 暫定結果（話している最中）
        if (!result.isFinal) {
          setInterimText(transcript);
        } else {
          // 確定結果
          setInterimText("");
          setRecognizedText(transcript);
          const number = extractNumber(transcript);
          setRecognizedNumber(number);
        }
      }
    }
  });

  // 音声認識エラーイベント
  useSpeechRecognitionEvent("error", (event) => {
    setError(`エラー: ${event.error || "音声認識に失敗しました"}`);
    setIsListening(false);
  });

  // 音声テキストから数字を抽出
  const extractNumber = (text: string): string => {
    // まず、アラビア数字をそのまま抽出
    const numberMatch = text.match(/\d+/);
    if (numberMatch) {
      return numberMatch[0];
    }

    // 日本語の基本数字マッピング（0-9）
    const kanjiToNum: { [key: string]: number } = {
      零: 0, ゼロ: 0, れい: 0, レイ: 0,
      一: 1, いち: 1, イチ: 1, 壱: 1,
      二: 2, に: 2, ニ: 2, 弐: 2,
      三: 3, さん: 3, サン: 3, 参: 3,
      四: 4, し: 4, よん: 4, シ: 4, ヨン: 4,
      五: 5, ご: 5, ゴ: 5,
      六: 6, ろく: 6, ロク: 6,
      七: 7, しち: 7, なな: 7, シチ: 7, ナナ: 7,
      八: 8, はち: 8, ハチ: 8,
      九: 9, きゅう: 9, く: 9, キュウ: 9, ク: 9,
    };

    // 位取りマッピング
    const unitToMultiplier: { [key: string]: number } = {
      十: 10, じゅう: 10, ジュウ: 10,
      百: 100, ひゃく: 100, ヒャク: 100,
      千: 1000, せん: 1000, セン: 1000,
      万: 10000, まん: 10000, マン: 10000,
    };

    let processedText = text.toLowerCase();

    // カタカナをひらがなに変換して統一
    processedText = processedText
      .replace(/ゼロ/g, 'ぜろ')
      .replace(/イチ/g, 'いち')
      .replace(/ニ/g, 'に')
      .replace(/サン/g, 'さん')
      .replace(/シ/g, 'し')
      .replace(/ヨン/g, 'よん')
      .replace(/ゴ/g, 'ご')
      .replace(/ロク/g, 'ろく')
      .replace(/シチ/g, 'しち')
      .replace(/ナナ/g, 'なな')
      .replace(/ハチ/g, 'はち')
      .replace(/キュウ/g, 'きゅう')
      .replace(/ク/g, 'く')
      .replace(/ジュウ/g, 'じゅう')
      .replace(/ヒャク/g, 'ひゃく')
      .replace(/セン/g, 'せん')
      .replace(/マン/g, 'まん');

    // 複雑な数字の変換（例：二十三、百五、千二百三十四）
    let result = 0;

    // 万の位の処理
    const manMatch = processedText.match(/(.+)(まん|万)(.*)$/);
    if (manMatch) {
      const beforeMan = manMatch[1];
      const afterMan = manMatch[3];

      // 万の前の部分を処理
      result += parseJapaneseNumberPart(beforeMan, kanjiToNum, unitToMultiplier) * 10000;

      // 万の後の部分を処理
      if (afterMan) {
        result += parseJapaneseNumberPart(afterMan, kanjiToNum, unitToMultiplier);
      }

      return result.toString();
    }

    // 万がない場合は通常の処理
    const parsed = parseJapaneseNumberPart(processedText, kanjiToNum, unitToMultiplier);
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
  };

  // 日本語数字の部分的なパース（千、百、十の位まで）
  const parseJapaneseNumberPart = (
    text: string,
    kanjiToNum: { [key: string]: number },
    unitToMultiplier: { [key: string]: number }
  ): number => {
    let result = 0;

    // 千の位
    const senMatch = text.match(/(.+)?(せん|千)(.*)$/);
    if (senMatch) {
      const beforeSen = senMatch[1];
      const afterSen = senMatch[3];

      if (beforeSen) {
        const num = getBasicNumber(beforeSen, kanjiToNum);
        result += num * 1000;
      } else {
        result += 1000;
      }

      if (afterSen) {
        result += parseJapaneseNumberPart(afterSen, kanjiToNum, unitToMultiplier);
      }

      return result;
    }

    // 百の位
    const hyakuMatch = text.match(/(.+)?(ひゃく|百)(.*)$/);
    if (hyakuMatch) {
      const beforeHyaku = hyakuMatch[1];
      const afterHyaku = hyakuMatch[3];

      if (beforeHyaku) {
        const num = getBasicNumber(beforeHyaku, kanjiToNum);
        result += num * 100;
      } else {
        result += 100;
      }

      if (afterHyaku) {
        result += parseJapaneseNumberPart(afterHyaku, kanjiToNum, unitToMultiplier);
      }

      return result;
    }

    // 十の位
    const juMatch = text.match(/(.+)?(じゅう|十)(.*)$/);
    if (juMatch) {
      const beforeJu = juMatch[1];
      const afterJu = juMatch[3];

      if (beforeJu) {
        const num = getBasicNumber(beforeJu, kanjiToNum);
        result += num * 10;
      } else {
        result += 10;
      }

      if (afterJu) {
        result += getBasicNumber(afterJu, kanjiToNum);
      }

      return result;
    }

    // 一桁の数字
    return getBasicNumber(text, kanjiToNum);
  };

  // 基本的な数字（0-9）の取得
  const getBasicNumber = (text: string, kanjiToNum: { [key: string]: number }): number => {
    const lowerText = text.toLowerCase().trim();

    for (const [key, value] of Object.entries(kanjiToNum)) {
      if (lowerText.includes(key.toLowerCase())) {
        return value;
      }
    }

    return 0;
  };

  const startListening = async () => {
    try {
      setError("");
      setRecognizedNumber("");
      setRecognizedText("");

      // パーミッションチェック
      const result =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        console.warn("Permissions not granted", result);
        return;
      }

      const options = {
        lang: "ja-JP",
        interimResults: true,
        maxAlternatives: 5,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        contextualStrings: [
          // 0-9 ひらがな
          "ぜろ", "れい",
          "いち",
          "に",
          "さん",
          "し", "よん",
          "ご",
          "ろく",
          "しち", "なな",
          "はち",
          "きゅう", "く",
          // 0-9 カタカナ
          "ゼロ", "レイ",
          "イチ",
          "ニ",
          "サン",
          "シ", "ヨン",
          "ゴ",
          "ロク",
          "シチ", "ナナ",
          "ハチ",
          "キュウ", "ク",
          // 10-19
          "じゅう", "十",
          "じゅういち", "十一",
          "じゅうに", "十二",
          "じゅうさん", "十三",
          "じゅうし", "じゅうよん", "十四",
          "じゅうご", "十五",
          "じゅうろく", "十六",
          "じゅうしち", "じゅうなな", "十七",
          "じゅうはち", "十八",
          "じゅうきゅう", "じゅうく", "十九",
          // 20-90 (10の倍数)
          "にじゅう", "二十",
          "さんじゅう", "三十",
          "よんじゅう", "四十",
          "ごじゅう", "五十",
          "ろくじゅう", "六十",
          "ななじゅう", "しちじゅう", "七十",
          "はちじゅう", "八十",
          "きゅうじゅう", "九十",
          // 100-900 (100の倍数)
          "ひゃく", "百",
          "にひゃく", "二百",
          "さんびゃく", "三百",
          "よんひゃく", "四百",
          "ごひゃく", "五百",
          "ろっぴゃく", "六百",
          "ななひゃく", "七百",
          "はっぴゃく", "八百",
          "きゅうひゃく", "九百",
          // 1000-9000 (1000の倍数)
          "せん", "千",
          "にせん", "二千",
          "さんぜん", "三千",
          "よんせん", "四千",
          "ごせん", "五千",
          "ろくせん", "六千",
          "ななせん", "七千",
          "はっせん", "八千",
          "きゅうせん", "九千",
          // 万
          "まん", "万",
          "いちまん", "一万",
        ],
        ...(Platform.OS === "android" && {
          recordingOptions: {
            persist: false,
            audioEncoding: AudioEncodingAndroid.ENCODING_MP3,
            outputDirectory: "",
            outputFileName: "",
          },
        }),
      };

      await ExpoSpeechRecognitionModule.start(options);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "音声認識の開始に失敗しました";
      setError(errorMessage);
      setIsListening(false);
      Alert.alert("エラー", errorMessage);
    }
  };

  const stopListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "音声認識の停止に失敗しました";
      setError(errorMessage);
      Alert.alert("エラー", errorMessage);
    }
  };

  const clearResults = () => {
    setRecognizedNumber("");
    setRecognizedText("");
    setInterimText("");
    setError("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>数字を話してください</Text>

      <View style={styles.statusContainer}>
        {isListening && (
          <>
            <Text style={styles.listeningText}>🎤 聞き取り中...</Text>
            <Text style={styles.hintText}>
              ゆっくり、はっきりと発音してください
            </Text>
          </>
        )}
      </View>

      {interimText && (
        <View style={styles.interimContainer}>
          <Text style={styles.interimLabel}>認識中:</Text>
          <Text style={styles.interimText}>{interimText}</Text>
        </View>
      )}

      {recognizedText && (
        <View style={styles.resultContainer}>
          <Text style={styles.label}>認識されたテキスト:</Text>
          <Text style={styles.text}>{recognizedText}</Text>
        </View>
      )}

      {recognizedNumber && (
        <View style={styles.resultContainer}>
          <Text style={styles.label}>抽出された数字:</Text>
          <Text style={styles.number}>{recognizedNumber}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <Button
            title={isListening ? "停止" : "音声認識開始"}
            onPress={isListening ? stopListening : startListening}
            color={isListening ? "#f44336" : "#4CAF50"}
          />
        </View>

        {(recognizedNumber || recognizedText) && (
          <View style={styles.button}>
            <Button title="クリア" onPress={clearResults} color="#9E9E9E" />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💡 認識のコツ:{"\n"}
          • ゆっくり、はっきりと発音する{"\n"}
          • 1文字（に、し、く等）は認識されにくいため、{"\n"}
          　「いち」「さん」「ろく」など長い読み方を推奨{"\n"}
          • 複数桁も可: 「にじゅうさん」「ひゃくごじゅう」{"\n"}
          {"\n"}
          対応範囲: 0〜99999
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  statusContainer: {
    minHeight: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "600",
  },
  hintText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  interimContainer: {
    backgroundColor: "#fff3e0",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffb74d",
  },
  interimLabel: {
    fontSize: 12,
    color: "#f57c00",
    marginBottom: 5,
  },
  interimText: {
    fontSize: 16,
    color: "#e65100",
    fontStyle: "italic",
  },
  resultContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  text: {
    fontSize: 18,
    color: "#333",
  },
  number: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2196F3",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: "100%",
  },
  error: {
    color: "#c62828",
    textAlign: "center",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    gap: 10,
  },
  button: {
    minWidth: 140,
  },
  infoContainer: {
    marginTop: 40,
    padding: 15,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#1976d2",
    textAlign: "left",
    lineHeight: 20,
  },
});
