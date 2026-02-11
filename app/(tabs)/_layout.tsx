import { Tabs } from 'expo-router';
import { AppColors, Colors } from '@/shared/config/theme';
import { useColorScheme } from '@/shared/lib/use-color-scheme';
import { HapticTab } from '@/shared/ui/haptic-tab';
import { IconSymbol } from '@/shared/ui/icon-symbol';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const appColors = AppColors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '探索',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
