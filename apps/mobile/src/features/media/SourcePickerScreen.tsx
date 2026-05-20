import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../../components/AppBackground';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { useRoomStore } from '../../store/roomStore';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import type { MediaProvider, MediaSource, RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SourcePicker'>;

const sourceOptions: Array<{ provider: MediaProvider; title: string; icon: keyof typeof Ionicons.glyphMap; copy: string }> = [
  { provider: 'youtube', title: 'YouTube', icon: 'logo-youtube', copy: 'Videos and playlists with shared controls.' },
  { provider: 'netflix', title: 'Netflix', icon: 'tv', copy: 'Open content and keep the room controls synced.' },
  { provider: 'drive', title: 'Google Drive', icon: 'cloud', copy: 'Paste a shared Drive video link.' },
  { provider: 'external', title: 'External link', icon: 'link', copy: 'MP4, HLS M3U8, or DASH streaming URL.' },
  { provider: 'local', title: 'Phone storage', icon: 'phone-portrait', copy: 'Pick a local video for playback.' },
  { provider: 'upload', title: 'Upload media', icon: 'cloud-upload', copy: 'Temporary room hosting via Firebase Storage.' }
];

export function SourcePickerScreen({ navigation, route }: Props) {
  const roomId = route.params?.roomId;
  const room = useRoomStore((state) => state.room);
  const connectRoom = useRoomStore((state) => state.connectRoom);
  const sendSource = useRoomStore((state) => state.sendSource);
  const [selected, setSelected] = useState<MediaProvider>('external');
  const [title, setTitle] = useState('Movie night stream');
  const [uri, setUri] = useState('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [busy, setBusy] = useState(false);

  async function pickLocalVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1
    });
    if (!result.canceled) {
      setSelected('local');
      setUri(result.assets[0]?.uri ?? '');
      setTitle(result.assets[0]?.fileName ?? 'Local video');
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/*', 'application/octet-stream'],
      copyToCacheDirectory: true
    });
    if (!result.canceled) {
      setSelected('upload');
      setUri(result.assets[0]?.uri ?? '');
      setTitle(result.assets[0]?.name ?? 'Uploaded video');
    }
  }

  async function startRoom() {
    setBusy(true);
    try {
      const activeRoom = room ?? (roomId ? await connectRoom(roomId) : undefined);
      if (!activeRoom) {
        throw new Error('Room not ready');
      }
      const media: MediaSource = {
        id: `${selected}-${Date.now()}`,
        provider: selected,
        title: title.trim() || 'SoulSync video',
        uri: uri.trim(),
        mimeType: uri.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
      };
      await sendSource(media);
      navigation.replace('WatchRoom', { roomId: activeRoom.id });
    } catch (error) {
      Alert.alert('Could not set source', error instanceof Error ? error.message : 'Try another source.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Select source</Text>
          <Text style={styles.copy}>SoulSync supports direct streams now and keeps provider-specific integrations isolated for Play Store review.</Text>

          <View style={styles.grid}>
            {sourceOptions.map((option) => (
              <Pressable key={option.provider} onPress={() => setSelected(option.provider)} style={styles.sourcePressable}>
                <GlassCard style={selected === option.provider ? styles.sourceActive : undefined} contentStyle={styles.source}>
                  <Ionicons name={option.icon} color={selected === option.provider ? colors.rose : colors.textMuted} size={24} />
                  <Text style={styles.sourceTitle}>{option.title}</Text>
                  <Text style={styles.sourceCopy}>{option.copy}</Text>
                </GlassCard>
              </Pressable>
            ))}
          </View>

          <GlassCard contentStyle={styles.card}>
            <TextField icon="film" value={title} onChangeText={setTitle} placeholder="Display title" />
            <TextField icon="link" value={uri} onChangeText={setUri} placeholder="Video URL or picked file URI" autoCapitalize="none" />
            <View style={styles.pickRow}>
              <PrimaryButton label="Pick video" icon="images" variant="quiet" onPress={pickLocalVideo} style={styles.pickButton} />
              <PrimaryButton label="Pick file" icon="folder" variant="quiet" onPress={pickDocument} style={styles.pickButton} />
            </View>
          </GlassCard>

          <PrimaryButton label={busy ? 'Starting...' : 'Start watch party'} icon="play" onPress={startRoom} disabled={busy || !uri.trim()} />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  sourcePressable: {
    width: '48%'
  },
  source: {
    minHeight: 150,
    padding: spacing.lg
  },
  sourceActive: {
    borderColor: colors.rose,
    backgroundColor: 'rgba(255,79,139,0.08)'
  },
  sourceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: spacing.md
  },
  sourceCopy: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs
  },
  card: {
    paddingBottom: spacing.lg
  },
  pickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg
  },
  pickButton: {
    flex: 1,
    borderRadius: radii.lg
  }
});
