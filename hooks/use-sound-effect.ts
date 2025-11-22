import { Audio } from 'expo-av';
import { useEffect, useRef } from 'react';

/**
 * 効果音を再生するカスタムhook
 */
export function useSoundEffect() {
  const correctSoundRef = useRef<Audio.Sound | null>(null);
  const incorrectSoundRef = useRef<Audio.Sound | null>(null);

  // 音声ファイルをロード
  useEffect(() => {
    let isMounted = true;

    async function loadSounds() {
      try {
        // オーディオモードを設定（音声認識と併用するため）
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // 正解音をロード
        const { sound: correctSound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/correct.mp3')
        );
        if (isMounted) {
          correctSoundRef.current = correctSound;
        }

        // 不正解音をロード
        const { sound: incorrectSound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/incorrect.mp3')
        );
        if (isMounted) {
          incorrectSoundRef.current = incorrectSound;
        }
      } catch (error) {
        console.error('[Sound] Failed to load sound effects:', error);
      }
    }

    loadSounds();

    // クリーンアップ
    return () => {
      isMounted = false;
      correctSoundRef.current?.unloadAsync();
      incorrectSoundRef.current?.unloadAsync();
    };
  }, []);

  /**
   * 正解音を再生
   */
  const playCorrectSound = async () => {
    try {
      if (correctSoundRef.current) {
        await correctSoundRef.current.replayAsync();
      }
    } catch (error) {
      console.error('[Sound] Failed to play correct sound:', error);
    }
  };

  /**
   * 不正解音を再生
   */
  const playIncorrectSound = async () => {
    try {
      if (incorrectSoundRef.current) {
        await incorrectSoundRef.current.replayAsync();
      }
    } catch (error) {
      console.error('[Sound] Failed to play incorrect sound:', error);
    }
  };

  return {
    playCorrectSound,
    playIncorrectSound,
  };
}
