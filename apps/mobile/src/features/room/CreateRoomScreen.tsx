import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createRoom } from '../../api/rooms';
import { AppBackground } from '../../components/AppBackground';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import type { RootStackParamList, RoomMode, RoomVisibility } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRoom'>;

export function CreateRoomScreen({ navigation }: Props) {
  const [title, setTitle] = useState('Friday movie night');
  const [mode, setMode] = useState<RoomMode>('host');
  const [visibility, setVisibility] = useState<RoomVisibility>('private');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setBusy(true);
    try {
      const room = await createRoom({
        title: title.trim() || 'SoulSync room',
        mode,
        visibility,
        password: password.trim() || undefined
      });
      navigation.replace('SourcePicker', { roomId: room.id });
    } catch (error) {
      Alert.alert('Could not create room', error instanceof Error ? error.message : 'Try again.');
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
          <Text style={styles.title}>Create room</Text>
          <Text style={styles.copy}>Choose how playback controls work before selecting a movie source.</Text>

          <GlassCard contentStyle={styles.card}>
            <TextField icon="film" value={title} onChangeText={setTitle} placeholder="Room title" />
            <TextField icon="key" value={password} onChangeText={setPassword} placeholder="Optional password" secureTextEntry />

            <Text style={styles.label}>Control mode</Text>
            <View style={styles.segment}>
              <Segment label="Host" active={mode === 'host'} onPress={() => setMode('host')} />
              <Segment label="Shared" active={mode === 'shared'} onPress={() => setMode('shared')} />
            </View>

            <Text style={styles.label}>Visibility</Text>
            <View style={styles.segment}>
              <Segment label="Private" active={visibility === 'private'} onPress={() => setVisibility('private')} />
              <Segment label="Public" active={visibility === 'public'} onPress={() => setVisibility('public')} />
            </View>
          </GlassCard>

          <PrimaryButton label={busy ? 'Creating...' : 'Choose movie source'} icon="arrow-forward" onPress={onCreate} disabled={busy} />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentItem, active && styles.segmentActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
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
    paddingBottom: spacing.md
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    padding: 4,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  segmentItem: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  segmentActive: {
    backgroundColor: colors.rose
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800'
  },
  segmentTextActive: {
    color: colors.white
  }
});
