import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useForceUpdate } from '@/features/force-update/model/use-force-update';
import { ForceUpdateModal } from '@/features/force-update/ui/force-update-modal';
import { useColorScheme } from '@/shared/lib/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isUpdateRequired, storeUrl } = useForceUpdate();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <ForceUpdateModal visible={isUpdateRequired} storeUrl={storeUrl} />
    </ThemeProvider>
  );
}
