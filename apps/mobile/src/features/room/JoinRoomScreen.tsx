import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { joinRoom } from '../../api/rooms';
import { AppBackground } from '../../components/AppBackground';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinRoom'>;

export function JoinRoomScreen({ navigation, route }: Props) {
  const [code, setCode] = useState(route.params?.code ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (route.params?.code) {
      setCode(route.params.code.toUpperCase());
    }
  }, [route.params?.code]);

  async function onJoin() {
    if (!code.trim()) {
      return;
    }
    setBusy(true);
    try {
      const room = await joinRoom(code.trim(), password.trim() || undefined);
      navigation.replace('WatchRoom', { roomId: room.id });
    } catch (error) {
      Alert.alert('Could not join', error instanceof Error ? error.message : 'Check the code and password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Join room</Text>
          <Text style={styles.copy}>Enter the six-character code or paste a room id from an invite link.</Text>
          <GlassCard contentStyle={styles.card}>
            <TextField
              icon="ticket"
              value={code}
              onChangeText={(value) => setCode(value.toUpperCase())}
              placeholder="Room code"
              autoCapitalize="characters"
              maxLength={32}
            />
            <TextField icon="lock-closed" value={password} onChangeText={setPassword} placeholder="Password if required" secureTextEntry />
          </GlassCard>
          <PrimaryButton label={busy ? 'Joining...' : 'Enter watch room'} icon="enter" onPress={onJoin} disabled={busy || !code.trim()} />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm
  },
  backText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700'
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900'
  },
  copy: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23
  },
  card: {
    paddingBottom: spacing.lg
  }
});
