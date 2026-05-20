import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, gradients } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';

interface Props {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  variant?: 'primary' | 'quiet';
  style?: ViewStyle;
  disabled?: boolean;
}

export function PrimaryButton({ label, icon, onPress, variant = 'primary', style, disabled }: Props) {
  if (variant === 'quiet') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.quiet,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style
        ]}
      >
        {icon ? <Ionicons name={icon} color={colors.text} size={18} /> : null}
        <Text style={styles.quietText}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <LinearGradient colors={gradients.rose} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        {icon ? <Ionicons name={icon} color={colors.white} size={19} /> : null}
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 54,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800'
  },
  quiet: {
    minHeight: 50,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border
  },
  quietText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  },
  disabled: {
    opacity: 0.45
  }
});
