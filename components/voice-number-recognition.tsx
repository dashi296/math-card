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
      const { transcript } = results[0];
      if (transcript) {
        setRecognizedText(transcript);
        const number = extractNumber(transcript);
        setRecognizedNumber(number);
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

    // 日本語の数字を変換（単一の数字）
    const japaneseNumbers: { [key: string]: string } = {
      零: "0",
      ゼロ: "0",
      れい: "0",
      一: "1",
      いち: "1",
      二: "2",
      に: "2",
      三: "3",
      さん: "3",
      四: "4",
      し: "4",
      よん: "4",
      五: "5",
      ご: "5",
      六: "6",
      ろく: "6",
      七: "7",
      しち: "7",
      なな: "7",
      八: "8",
      はち: "8",
      九: "9",
      きゅう: "9",
      く: "9",
      十: "10",
      じゅう: "10",
    };

    // テキストを小文字に変換して検索
    const lowerText = text.toLowerCase();

    for (const [key, value] of Object.entries(japaneseNumbers)) {
      if (lowerText.includes(key)) {
        return value;
      }
    }

    // 複数桁の日本語数字の処理（例：二十三 → 23）
    const tenMatch = lowerText.match(/(.*)(じゅう|十)(.*)/);
    if (tenMatch) {
      const tens = tenMatch[1] ? japaneseNumbers[tenMatch[1]] || "1" : "1";
      const ones = tenMatch[3] ? japaneseNumbers[tenMatch[3]] || "0" : "0";
      return (parseInt(tens) * 10 + parseInt(ones)).toString();
    }

    return text;
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
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        contextualStrings: [
          "いち",
          "に",
          "さん",
          "し",
          "ご",
          "ろく",
          "しち",
          "はち",
          "きゅう",
          "じゅう",
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
    setError("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>数字を話してください</Text>

      <View style={styles.statusContainer}>
        {isListening && (
          <Text style={styles.listeningText}>🎤 聞き取り中...</Text>
        )}
      </View>

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
          例: 「いち」「に」「さん」{"\n"}
          「10」「じゅう」「20」など
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
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "600",
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
    textAlign: "center",
    lineHeight: 18,
  },
});
