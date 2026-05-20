import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  name: string;
  uri?: string;
  size?: number;
}

export function Avatar({ name, uri, size = 42 }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || 'S';
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize: Math.max(14, size * 0.38) }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceElevated
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rose
  },
  initial: {
    color: colors.white,
    fontWeight: '900'
  }
});
