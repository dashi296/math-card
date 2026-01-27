import { AudioModule, useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

// 音声ファイルのソース
const correctSoundSource = require('@/assets/sounds/correct.mp3');
const incorrectSoundSource = require('@/assets/sounds/incorrect.mp3');

/**
 * 効果音を再生するカスタムhook
 */
export function useSoundEffect() {
  const correctPlayer = useAudioPlayer(correctSoundSource);
  const incorrectPlayer = useAudioPlayer(incorrectSoundSource);

  // オーディオモードを設定（音声認識と併用するため）
  useEffect(() => {
    AudioModule.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpiece: false,
    });
  }, []);

  /**
   * 正解音を再生
   */
  const playCorrectSound = async () => {
    try {
      correctPlayer.seekTo(0);
      correctPlayer.play();
    } catch (error) {
      console.error('[Sound] Failed to play correct sound:', error);
    }
  };

  /**
   * 不正解音を再生
   */
  const playIncorrectSound = async () => {
    try {
      incorrectPlayer.seekTo(0);
      incorrectPlayer.play();
    } catch (error) {
      console.error('[Sound] Failed to play incorrect sound:', error);
    }
  };

  return {
    playCorrectSound,
    playIncorrectSound,
  };
}
