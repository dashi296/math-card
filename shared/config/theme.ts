import { Platform } from 'react-native';

const tintColorLight = '#6C5CE7';
const tintColorDark = '#A29BFE';

export const Colors = {
  light: {
    text: '#1E1B4B',
    background: '#FFF8F0',
    tint: tintColorLight,
    icon: '#8B8FA3',
    tabIconDefault: '#8B8FA3',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F1F0FF',
    background: '#0F0D23',
    tint: tintColorDark,
    icon: '#6B6F8A',
    tabIconDefault: '#6B6F8A',
    tabIconSelected: tintColorDark,
  },
};

export const AppColors = {
  light: {
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F0EB',
    cardShadow: 'rgba(106, 92, 231, 0.08)',

    primary: '#6C5CE7',
    primaryText: '#FFFFFF',

    problemText: '#4A3AFF',

    success: '#10B981',
    successBg: '#ECFDF5',
    successBorder: '#6EE7B7',
    successText: '#065F46',

    error: '#EF4444',
    errorBg: '#FEF2F2',
    errorBorder: '#FCA5A5',
    errorText: '#991B1B',

    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    warningBorder: '#FCD34D',
    warningText: '#92400E',

    accent: '#F59E0B',

    textPrimary: '#1E1B4B',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    infoBg: '#EEF2FF',
    infoBorder: '#C7D2FE',
    infoText: '#4338CA',

    border: '#E5E7EB',

    statCorrect: '#10B981',
    statIncorrect: '#EF4444',
    statDefault: '#1E1B4B',

    tabBarBg: '#FFFFFF',
    tabBarBorder: '#F0EBE5',

    ghost: 'transparent',
    ghostText: '#6B7280',
  },
  dark: {
    surface: '#1A1840',
    surfaceSecondary: '#13112E',
    cardShadow: 'rgba(0, 0, 0, 0.3)',

    primary: '#A29BFE',
    primaryText: '#0F0D23',

    problemText: '#A78BFA',

    success: '#34D399',
    successBg: '#064E3B',
    successBorder: '#059669',
    successText: '#A7F3D0',

    error: '#FB7185',
    errorBg: '#4C0519',
    errorBorder: '#BE123C',
    errorText: '#FECDD3',

    warning: '#FBBF24',
    warningBg: '#451A03',
    warningBorder: '#D97706',
    warningText: '#FDE68A',

    accent: '#FBBF24',

    textPrimary: '#F1F0FF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',

    infoBg: '#1E1B4B',
    infoBorder: '#312E81',
    infoText: '#C7D2FE',

    border: '#2D2A5E',

    statCorrect: '#34D399',
    statIncorrect: '#FB7185',
    statDefault: '#F1F0FF',

    tabBarBg: '#13112E',
    tabBarBorder: '#1A1840',

    ghost: 'transparent',
    ghostText: '#9CA3AF',
  },
};

export type AppColorScheme = typeof AppColors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
