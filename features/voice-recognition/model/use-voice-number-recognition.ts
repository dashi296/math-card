import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionOptions,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { extractNumber, scoreNumberCandidate } from '../lib/japanese-number';

interface VoiceNumberRecognitionState {
  isListening: boolean;
  recognizedNumber: string;
  recognizedText: string;
  interimText: string;
  error: string;
  autoRestart: boolean;
  allCandidateNumbers: number[]; // すべての候補から抽出した数字の配列
}

interface VoiceNumberRecognitionActions {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  clearResults: () => void;
  setAutoRestart: (value: boolean) => void;
}

type UseVoiceNumberRecognitionReturn = VoiceNumberRecognitionState & VoiceNumberRecognitionActions;

/**
 * Type definitions for speech recognition results
 */
interface SpeechRecognitionTranscript {
  transcript: string;
}

interface SpeechRecognitionResult {
  transcript: string;
  transcripts?: SpeechRecognitionTranscript[];
  isFinal?: boolean;
}

interface BestMatchCandidate {
  transcript: string;
  isFinal: boolean;
  score: number;
}

/**
 * 複数の認識候補から最も数字として妥当なものを選択
 */
function selectBestNumberMatch(results: SpeechRecognitionResult[]): BestMatchCandidate | null {
  if (!results || results.length === 0) return null;

  // すべての候補を収集してスコアリング
  const candidates: BestMatchCandidate[] = [];

  results.forEach((result) => {
    const transcripts = result.transcripts || [{ transcript: result.transcript }];
    const isFinal = result.isFinal || false;

    transcripts.forEach((t) => {
      const transcript = typeof t === 'string' ? t : t.transcript;
      if (transcript && typeof transcript === 'string') {
        const score = scoreNumberCandidate(transcript);
        candidates.push({ transcript, isFinal, score });
      }
    });
  });

  // スコアが最も高い候補を選択
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);

  // デバッグ: 上位3候補をログ出力
  console.log('[Voice Recognition] Top 3 candidates:');
  candidates.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i + 1}. "${c.transcript}" (score: ${c.score}, final: ${c.isFinal})`);
  });

  return candidates[0];
}

/**
 * 音声による数字認識のカスタムhook
 *
 * 日本語の音声入力から数字を認識し、抽出します。
 * 複数の認識候補から最適なものを自動選択し、
 * 短い発音や曖昧な発音でも高精度に認識できます。
 *
 * @example
 * ```tsx
 * const {
 *   isListening,
 *   recognizedNumber,
 *   startListening,
 *   stopListening
 * } = useVoiceNumberRecognition();
 * ```
 */
export function useVoiceNumberRecognition(): UseVoiceNumberRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [recognizedNumber, setRecognizedNumber] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');
  const [autoRestart, setAutoRestart] = useState(false);
  const [allCandidateNumbers, setAllCandidateNumbers] = useState<number[]>([]);

  // 音声認識開始イベント
  useSpeechRecognitionEvent('start', () => {
    console.log('[Voice Recognition] Start event - Recognition started');
    setIsListening(true);
    setError('');
  });

  // 音声認識終了イベント
  useSpeechRecognitionEvent('end', () => {
    console.log('[Voice Recognition] End event - Recognition stopped');
    setIsListening(false);
    // 自動再開モードの場合、すぐに次の認識を開始
    if (autoRestart) {
      console.log('[Voice Recognition] Auto-restart enabled, restarting...');
      setTimeout(() => {
        startListening();
      }, 200); // Reduced from 500ms to 200ms for faster response
    }
  });

  // 音声認識結果イベント
  useSpeechRecognitionEvent('result', (event) => {
    console.log('[Voice Recognition] Result event received');
    const results = event.results;
    console.log('[Voice Recognition] Results:', JSON.stringify(results, null, 2));

    if (results && results.length > 0) {
      // すべての候補から数字を抽出
      const candidateNumbers: number[] = [];
      const allTranscripts: string[] = [];

      results.forEach((result) => {
        const transcripts = result.transcripts || [{ transcript: result.transcript }];
        transcripts.forEach((t) => {
          const transcript = typeof t === 'string' ? t : t.transcript;
          if (transcript && typeof transcript === 'string') {
            allTranscripts.push(transcript);
            const numberStr = extractNumber(transcript);
            const num = Number.parseInt(numberStr, 10);
            if (!Number.isNaN(num) && !candidateNumbers.includes(num)) {
              candidateNumbers.push(num);
            }
          }
        });
      });

      console.log('[Voice Recognition] All transcripts:', allTranscripts);
      console.log('[Voice Recognition] All candidate numbers:', candidateNumbers);

      // すべての候補数字を保存
      setAllCandidateNumbers(candidateNumbers);

      // 複数の候補から最適なものを選択（表示用）
      const bestMatch = selectBestNumberMatch(results);
      console.log('[Voice Recognition] Best match:', bestMatch);

      if (bestMatch) {
        const { transcript, isFinal } = bestMatch;
        console.log('[Voice Recognition] Transcript:', transcript, 'isFinal:', isFinal);

        // 暫定結果（話している最中）でも即座に数字を抽出
        if (!isFinal) {
          setInterimText(transcript);
          // 暫定結果でも数字が抽出できれば表示
          const number = extractNumber(transcript);
          console.log('[Voice Recognition] Interim - Extracted number:', number);
          // 数字が抽出できたら常に設定（transcriptと同じでも）
          if (number) {
            console.log('[Voice Recognition] Setting recognizedNumber to:', number);
            setRecognizedNumber(number);
          }
        } else {
          // 確定結果
          setInterimText('');
          setRecognizedText(transcript);
          const number = extractNumber(transcript);
          console.log('[Voice Recognition] Final - Extracted number:', number);
          setRecognizedNumber(number);
        }
      }
    }
  });

  // 音声認識エラーイベント
  useSpeechRecognitionEvent('error', (event) => {
    console.log('[Voice Recognition] Error event:', event.error);
    setError(`エラー: ${event.error || '音声認識に失敗しました'}`);
    setIsListening(false);
  });

  /**
   * 音声認識を開始
   */
  const startListening = useCallback(async () => {
    try {
      setError('');
      setRecognizedNumber('');
      setRecognizedText('');
      setAllCandidateNumbers([]);

      // パーミッションチェック
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        console.warn('Permissions not granted', result);
        return;
      }

      const options: ExpoSpeechRecognitionOptions = {
        lang: 'ja-JP',
        interimResults: true,
        maxAlternatives: 5, // Reduced from 10 to 5 for faster processing while maintaining accuracy
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        // iOS用の最適化: 短い音声認識向け
        ...(Platform.OS === 'ios' && {
          iosTaskHint: 'dictation',
        }),
        contextualStrings: [
          // 0-9 アラビア数字（音声認識エンジンに数字文脈を示す）
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
          '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
          '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
          '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
          '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
          '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
          '60', '61', '62', '63', '64', '65', '66', '67', '68', '69',
          '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
          '80', '81', '82', '83', '84', '85', '86', '87', '88', '89',
          '90', '91', '92', '93', '94', '95', '96', '97', '98', '99',
          '100',
          // 0-9 ひらがな
          'ぜろ',
          'れい',
          'いち',
          'に',
          'さん',
          'し',
          'よん',
          'ご',
          'ろく',
          'しち',
          'なな',
          'はち',
          'きゅう',
          'く',
          // 0-9 カタカナ
          'ゼロ',
          'レイ',
          'イチ',
          'ニ',
          'サン',
          'シ',
          'ヨン',
          'ゴ',
          'ロク',
          'シチ',
          'ナナ',
          'ハチ',
          'キュウ',
          'ク',
          // 10-19
          'じゅう',
          '十',
          'じゅういち',
          '十一',
          'じゅうに',
          '十二',
          'じゅうさん',
          '十三',
          'じゅうし',
          'じゅうよん',
          '十四',
          'じゅうご',
          '十五',
          'じゅうろく',
          '十六',
          'じゅうしち',
          'じゅうなな',
          '十七',
          'じゅうはち',
          '十八',
          'じゅうきゅう',
          'じゅうく',
          '十九',
          // 20-29
          'にじゅう',
          '二十',
          'にじゅういち',
          '二十一',
          'にじゅうに',
          '二十二',
          'にじゅうさん',
          '二十三',
          'にじゅうよん',
          '二十四',
          'にじゅうご',
          '二十五',
          'にじゅうろく',
          '二十六',
          'にじゅうなな',
          '二十七',
          'にじゅうはち',
          '二十八',
          'にじゅうきゅう',
          '二十九',
          // 30-39
          'さんじゅう',
          '三十',
          'さんじゅういち',
          '三十一',
          'さんじゅうに',
          '三十二',
          'さんじゅうさん',
          '三十三',
          'さんじゅうよん',
          '三十四',
          'さんじゅうご',
          '三十五',
          'さんじゅうろく',
          '三十六',
          'さんじゅうなな',
          '三十七',
          'さんじゅうはち',
          '三十八',
          'さんじゅうきゅう',
          '三十九',
          // 40-49
          'よんじゅう',
          '四十',
          'よんじゅういち',
          '四十一',
          'よんじゅうに',
          '四十二',
          'よんじゅうさん',
          '四十三',
          'よんじゅうよん',
          '四十四',
          'よんじゅうご',
          '四十五',
          'よんじゅうろく',
          '四十六',
          'よんじゅうなな',
          '四十七',
          'よんじゅうはち',
          '四十八',
          'よんじゅうきゅう',
          '四十九',
          // 50-59
          'ごじゅう',
          '五十',
          'ごじゅういち',
          '五十一',
          'ごじゅうに',
          '五十二',
          'ごじゅうさん',
          '五十三',
          'ごじゅうよん',
          '五十四',
          'ごじゅうご',
          '五十五',
          'ごじゅうろく',
          '五十六',
          'ごじゅうなな',
          '五十七',
          'ごじゅうはち',
          '五十八',
          'ごじゅうきゅう',
          '五十九',
          // 60-69
          'ろくじゅう',
          '六十',
          'ろくじゅういち',
          '六十一',
          'ろくじゅうに',
          '六十二',
          'ろくじゅうさん',
          '六十三',
          'ろくじゅうよん',
          '六十四',
          'ろくじゅうご',
          '六十五',
          'ろくじゅうろく',
          '六十六',
          'ろくじゅうなな',
          '六十七',
          'ろくじゅうはち',
          '六十八',
          'ろくじゅうきゅう',
          '六十九',
          // 70-79
          'ななじゅう',
          'しちじゅう',
          '七十',
          'ななじゅういち',
          '七十一',
          'ななじゅうに',
          '七十二',
          'ななじゅうさん',
          '七十三',
          'ななじゅうよん',
          '七十四',
          'ななじゅうご',
          '七十五',
          'ななじゅうろく',
          '七十六',
          'ななじゅうなな',
          '七十七',
          'ななじゅうはち',
          '七十八',
          'ななじゅうきゅう',
          '七十九',
          // 80-89
          'はちじゅう',
          '八十',
          'はちじゅういち',
          '八十一',
          'はちじゅうに',
          '八十二',
          'はちじゅうさん',
          '八十三',
          'はちじゅうよん',
          '八十四',
          'はちじゅうご',
          '八十五',
          'はちじゅうろく',
          '八十六',
          'はちじゅうなな',
          '八十七',
          'はちじゅうはち',
          '八十八',
          'はちじゅうきゅう',
          '八十九',
          // 90-99
          'きゅうじゅう',
          '九十',
          'きゅうじゅういち',
          '九十一',
          'きゅうじゅうに',
          '九十二',
          'きゅうじゅうさん',
          '九十三',
          'きゅうじゅうよん',
          '九十四',
          'きゅうじゅうご',
          '九十五',
          'きゅうじゅうろく',
          '九十六',
          'きゅうじゅうなな',
          '九十七',
          'きゅうじゅうはち',
          '九十八',
          'きゅうじゅうきゅう',
          '九十九',
          // 100
          'ひゃく',
          '百',
        ],
        ...(Platform.OS === 'android' && {
          recordingOptions: {
            persist: false,
            outputDirectory: '',
            outputFileName: '',
          },
        }),
      };

      await ExpoSpeechRecognitionModule.start(options);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '音声認識の開始に失敗しました';
      setError(errorMessage);
      setIsListening(false);
      Alert.alert('エラー', errorMessage);
    }
  }, []);

  /**
   * 音声認識を停止
   */
  const stopListening = useCallback(async () => {
    try {
      setAutoRestart(false); // 停止時は自動再開もオフ
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '音声認識の停止に失敗しました';
      setError(errorMessage);
      Alert.alert('エラー', errorMessage);
    }
  }, []);

  /**
   * 認識結果をクリア
   */
  const clearResults = useCallback(() => {
    setRecognizedNumber('');
    setRecognizedText('');
    setInterimText('');
    setError('');
    setAllCandidateNumbers([]);
  }, []);

  return {
    // 状態
    isListening,
    recognizedNumber,
    recognizedText,
    interimText,
    error,
    autoRestart,
    allCandidateNumbers,
    // アクション
    startListening,
    stopListening,
    clearResults,
    setAutoRestart,
  };
}
