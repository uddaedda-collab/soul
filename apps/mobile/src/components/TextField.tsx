import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';

interface Props extends TextInputProps {
  icon?: ComponentProps<typeof Ionicons>['name'];
}

export function TextField({ icon, style, placeholderTextColor = colors.textDim, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {icon ? <Ionicons name={icon} color={colors.textMuted} size={19} /> : null}
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor}
        selectionColor={colors.rose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: spacing.md
  }
});
