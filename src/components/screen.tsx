import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';

export const palette = {
  light: {
    bg: '#F3EFE6',
    card: '#FFFCF7',
    ink: '#1C1915',
    muted: '#6F675C',
    line: '#E4DCCF',
    accent: '#1F4D3A',
    accentText: '#F6F3EC',
    danger: '#8C3A32',
    highlight: '#E7F0EA',
  },
  dark: {
    bg: '#141311',
    card: '#221F1B',
    ink: '#F6F1E7',
    muted: '#B3AA9E',
    line: '#3A342C',
    accent: '#8FCBAA',
    accentText: '#10241A',
    danger: '#F0A8A2',
    highlight: '#1C2E26',
  },
} as const;

export type Palette = {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentText: string;
  danger: string;
  highlight: string;
};

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palette.dark : palette.light;
}

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'web' ? 84 : insets.top;
  const tabInset = Platform.OS === 'web' ? 16 : BottomTabInset + insets.bottom;
  return { top, bottom: tabInset, horizontal: 20 };
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = 'accent',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'danger' | 'ghost';
  style?: ViewStyle;
}) {
  const colors = usePalette();
  const background =
    tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : 'transparent';
  const textColor =
    tone === 'ghost' ? colors.ink : tone === 'accent' ? colors.accentText : '#FFFCF7';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor: tone === 'ghost' ? colors.line : background,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Text style={[styles.buttonLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, style }: { children: string; style?: TextStyle }) {
  const colors = usePalette();
  return <Text style={[styles.sectionTitle, { color: colors.ink }, style]}>{children}</Text>;
}

export function Muted({ children }: { children: string }) {
  const colors = usePalette();
  return <Text style={[styles.muted, { color: colors.muted }]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const colors = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  muted: {
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
});
