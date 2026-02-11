import { type AppColorScheme, AppColors } from '@/shared/config/theme';
import { useColorScheme } from './use-color-scheme';

export function useAppColors(): AppColorScheme {
  const scheme = useColorScheme() ?? 'light';
  return AppColors[scheme];
}
