import { Pressable, StyleSheet, Text } from 'react-native';
import { Fonts } from '@/shared/config/theme';
import { useAppColors } from '@/shared/lib/use-app-colors';

type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'ghost';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
}: AppButtonProps) {
  const c = useAppColors();

  const variantStyles = {
    primary: { bg: c.primary, text: c.primaryText, pressedBg: c.primary },
    success: { bg: c.success, text: '#FFFFFF', pressedBg: c.success },
    danger: { bg: c.error, text: '#FFFFFF', pressedBg: c.error },
    warning: { bg: c.warning, text: '#FFFFFF', pressedBg: c.warning },
    ghost: { bg: c.ghost, text: c.ghostText, pressedBg: c.surfaceSecondary },
  };

  const v = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? v.pressedBg : v.bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
      ]}
    >
      <Text style={[styles.text, { color: v.text, fontFamily: Fonts?.rounded }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
