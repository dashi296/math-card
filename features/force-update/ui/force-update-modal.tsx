import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppColors } from '@/shared/config/theme';
import { useColorScheme } from '@/shared/lib/use-color-scheme';
import { ThemedText } from '@/shared/ui/themed-text';

type Props = {
  visible: boolean;
  storeUrl: string;
};

export function ForceUpdateModal({ visible, storeUrl }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = AppColors[colorScheme];

  const handleUpdate = () => {
    Linking.openURL(storeUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <ThemedText type="title" style={styles.title}>
            アップデートが必要です
          </ThemedText>
          <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
            このバージョンはサポートが終了しました。{'\n'}
            最新バージョンをインストールしてください。
          </ThemedText>
          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleUpdate}
          >
            <ThemedText style={[styles.buttonText, { color: colors.primaryText }]}>
              アップデートする
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
