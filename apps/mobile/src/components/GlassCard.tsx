import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';

interface Props extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function GlassCard({ children, style, contentStyle, intensity = 24 }: Props) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.blur, style]}>
      <View style={[styles.overlay, contentStyle]}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.lg,
    gap: spacing.md
  }
});
