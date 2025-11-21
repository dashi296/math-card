import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionOptions,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { extractNumber, scoreNumberCandidate } from '@/utils/japanese-number-parser';

interface VoiceNumberRecognitionState {
  isListening: boolean;
  recognizedNumber: string;
  recognizedText: string;
  interimText: string;
  error: string;
  autoRestart: boolean;
}

interface VoiceNumberRecognitionActions {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  clearResults: () => void;
  setAutoRestart: (value: boolean) => void;
}

type UseVoiceNumberRecognitionReturn = VoiceNumberRecognitionState & VoiceNumberRecognitionActions;

/**
 * 複数の認識候補から最も数字として妥当なものを選択
 */
function selectBestNumberMatch(results: any[]): any | null {
  if (!results || results.length === 0) return null;

  // すべての候補を収集してスコアリング
  const candidates: {
    transcript: string;
    isFinal: boolean;
    score: number;
  }[] = [];

  results.forEach((result) => {
    const transcripts = result.transcripts || [{ transcript: result.transcript }];
    const isFinal = result.isFinal || false;

    transcripts.forEach((t: any) => {
      const transcript = t.transcript || t;
      if (transcript && typeof transcript === 'string') {
        const score = scoreNumberCandidate(transcript);
        candidates.push({ transcript, isFinal, score });
      }
    });
  });

  // スコアが最も高い候補を選択
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
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

  // 音声認識開始イベント
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setError('');
  });

  // 音声認識終了イベント
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    // 自動再開モードの場合、すぐに次の認識を開始
    if (autoRestart) {
      setTimeout(() => {
        startListening();
      }, 500);
    }
  });

  // 音声認識結果イベント
  useSpeechRecognitionEvent('result', (event) => {
    const results = event.results;
    if (results && results.length > 0) {
      // 複数の候補から最適なものを選択
      const bestMatch = selectBestNumberMatch(results);

      if (bestMatch) {
        const { transcript, isFinal } = bestMatch;

        // 暫定結果（話している最中）でも即座に数字を抽出
        if (!isFinal) {
          setInterimText(transcript);
          // 暫定結果でも数字が抽出できれば表示
          const number = extractNumber(transcript);
          if (number && number !== transcript) {
            setRecognizedNumber(number);
          }
        } else {
          // 確定結果
          setInterimText('');
          setRecognizedText(transcript);
          const number = extractNumber(transcript);
          setRecognizedNumber(number);
        }
      }
    }
  });

  // 音声認識エラーイベント
  useSpeechRecognitionEvent('error', (event) => {
    setError(`エラー: ${event.error || '音声認識に失敗しました'}`);
    setIsListening(false);
  });

  /**
   * 音声認識を開始
   */
  const startListening = async () => {
    try {
      setError('');
      setRecognizedNumber('');
      setRecognizedText('');

      // パーミッションチェック
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        console.warn('Permissions not granted', result);
        return;
      }

      const options: ExpoSpeechRecognitionOptions = {
        lang: 'ja-JP',
        interimResults: true,
        maxAlternatives: 5,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        // iOS用の最適化: 短い音声認識向け
        ...(Platform.OS === 'ios' && {
          iosTaskHint: 'dictation',
        }),
        contextualStrings: [
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
          // 20-90 (10の倍数)
          'にじゅう',
          '二十',
          'さんじゅう',
          '三十',
          'よんじゅう',
          '四十',
          'ごじゅう',
          '五十',
          'ろくじゅう',
          '六十',
          'ななじゅう',
          'しちじゅう',
          '七十',
          'はちじゅう',
          '八十',
          'きゅうじゅう',
          '九十',
          // 100-900 (100の倍数)
          'ひゃく',
          '百',
          'にひゃく',
          '二百',
          'さんびゃく',
          '三百',
          'よんひゃく',
          '四百',
          'ごひゃく',
          '五百',
          'ろっぴゃく',
          '六百',
          'ななひゃく',
          '七百',
          'はっぴゃく',
          '八百',
          'きゅうひゃく',
          '九百',
          // 1000-9000 (1000の倍数)
          'せん',
          '千',
          'にせん',
          '二千',
          'さんぜん',
          '三千',
          'よんせん',
          '四千',
          'ごせん',
          '五千',
          'ろくせん',
          '六千',
          'ななせん',
          '七千',
          'はっせん',
          '八千',
          'きゅうせん',
          '九千',
          // 万
          'まん',
          '万',
          'いちまん',
          '一万',
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
  };

  /**
   * 音声認識を停止
   */
  const stopListening = async () => {
    try {
      setAutoRestart(false); // 停止時は自動再開もオフ
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '音声認識の停止に失敗しました';
      setError(errorMessage);
      Alert.alert('エラー', errorMessage);
    }
  };

  /**
   * 認識結果をクリア
   */
  const clearResults = () => {
    setRecognizedNumber('');
    setRecognizedText('');
    setInterimText('');
    setError('');
  };

  return {
    // 状態
    isListening,
    recognizedNumber,
    recognizedText,
    interimText,
    error,
    autoRestart,
    // アクション
    startListening,
    stopListening,
    clearResults,
    setAutoRestart,
  };
}
