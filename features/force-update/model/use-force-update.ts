import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// TODO: GitHub GistのRaw URLに変更してください
// 例: https://gist.githubusercontent.com/YOUR_USERNAME/YOUR_GIST_ID/raw/version-config.json
//
// version-config.json の形式:
// {
//   "minimumVersion": "1.0.0",
//   "iosStoreUrl": "https://apps.apple.com/app/id000000000",
//   "androidStoreUrl": "https://play.google.com/store/apps/details?id=com.dashi296.mathcard"
// }
const VERSION_CONFIG_URL =
  'https://gist.githubusercontent.com/YOUR_USERNAME/YOUR_GIST_ID/raw/version-config.json';

type VersionConfig = {
  minimumVersion: string;
  iosStoreUrl: string;
  androidStoreUrl: string;
};

type UseForceUpdateResult = {
  isUpdateRequired: boolean;
  isLoading: boolean;
  storeUrl: string;
};

function compareVersions(current: string, minimum: string): number {
  const currentParts = current.split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const c = currentParts[i] ?? 0;
    const m = minimumParts[i] ?? 0;
    if (c < m) return -1;
    if (c > m) return 1;
  }
  return 0;
}

export function useForceUpdate(): UseForceUpdateResult {
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storeUrl, setStoreUrl] = useState('');

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const response = await fetch(VERSION_CONFIG_URL);
        const config: VersionConfig = await response.json();

        const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
        const url = Platform.OS === 'ios' ? config.iosStoreUrl : config.androidStoreUrl;

        setStoreUrl(url);
        setIsUpdateRequired(compareVersions(currentVersion, config.minimumVersion) < 0);
      } catch (error) {
        // ネットワークエラー等の場合はアップデートを強制しない
        console.warn('Force update check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForUpdate();
  }, []);

  return { isUpdateRequired, isLoading, storeUrl };
}
