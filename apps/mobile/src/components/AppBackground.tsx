import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { colors, gradients } from '../theme/colors';

export function AppBackground({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={gradients.app} style={styles.container}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  }
});
