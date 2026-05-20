import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PUBLIC_APP_URL } from '../../api/config';
import { reportSafetyIssue } from '../../api/users';
import { AppBackground } from '../../components/AppBackground';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ChatPanel } from '../chat/ChatPanel';
import { CallBubble } from '../call/CallBubble';
import { usePlaybackSync } from '../sync/usePlaybackSync';
import { useRoomStore } from '../../store/roomStore';
import { colors, gradients } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { formatDuration, projectedPositionMs } from '../../utils/time';
import type { RootStackParamList } from '../../types';
import { ReactionsOverlay } from './ReactionsOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'WatchRoom'>;

const quickReactions = ['❤️', '😂', '🥹', '😮', '🔥'];

export function WatchRoomScreen({ navigation, route }: Props) {
  const videoRef = useRef<Video>(null);
  const room = useRoomStore((state) => state.room);
  const playback = useRoomStore((state) => state.playback);
  const reactions = useRoomStore((state) => state.reactions);
  const connectRoom = useRoomStore((state) => state.connectRoom);
  const leaveRoom = useRoomStore((state) => state.leaveRoom);
  const sendReaction = useRoomStore((state) => state.sendReaction);
  const serverOffsetMs = useRoomStore((state) => state.serverOffsetMs);
  const { onPlaybackStatusUpdate, publish } = usePlaybackSync(videoRef);
  const [loading, setLoading] = useState(!room);
  const [chatOpen, setChatOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [localPosition, setLocalPosition] = useState(0);

  useEffect(() => {
    let mounted = true;
    const target = route.params.roomId;
    if (!room || (room.id !== target && room.code !== target)) {
      connectRoom(route.params.roomId)
        .catch((error) => {
          Alert.alert('Room unavailable', error instanceof Error ? error.message : 'Try another invite.');
          navigation.replace('Main');
        })
        .finally(() => mounted && setLoading(false));
    } else {
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [connectRoom, navigation, room, route.params.roomId]);

  const participants = useMemo(() => Object.values(room?.participants ?? {}), [room?.participants]);
  const expected = playback ? projectedPositionMs(playback, serverOffsetMs) : 0;

  async function togglePlayback() {
    const status = await videoRef.current?.getStatusAsync();
    if (!status?.isLoaded) {
      return;
    }
    const next = status.isPlaying ? 'paused' : 'playing';
    await publish(next, status.positionMillis, status.rate || 1);
    await Haptics.selectionAsync();
  }

  async function seekBy(deltaMs: number) {
    const status = await videoRef.current?.getStatusAsync();
    if (!status?.isLoaded) {
      return;
    }
    const nextPosition = Math.max(0, status.positionMillis + deltaMs);
    await videoRef.current?.setPositionAsync(nextPosition);
    await publish(status.isPlaying ? 'playing' : 'paused', nextPosition, status.rate || 1);
  }

  async function copyInvite() {
    if (!room) {
      return;
    }
    await Clipboard.setStringAsync(`${PUBLIC_APP_URL}/join/${room.code}`);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function reportRoom() {
    if (!room) {
      return;
    }
    Alert.alert('Report this room?', 'A safety report will be sent to admins for review.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () => {
          void reportSafetyIssue({
            roomId: room.id,
            reason: 'User reported this watch room from the Android app.'
          }).then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
        }
      }
    ]);
  }

  if (loading || !room) {
    return (
      <AppBackground>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.rose} />
          <Text style={styles.loadingText}>Opening private room...</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Pressable style={styles.playerWrap} onPress={() => setControlsVisible((value) => !value)}>
            {playback?.media?.uri ? (
              <Video
                ref={videoRef}
                source={{ uri: playback.media.uri }}
                resizeMode={ResizeMode.CONTAIN}
                style={styles.video}
                shouldPlay={playback.status === 'playing'}
                rate={playback.speed}
                isLooping={false}
                progressUpdateIntervalMillis={300}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    setLocalPosition(status.positionMillis);
                    onPlaybackStatusUpdate(status);
                  }
                }}
              />
            ) : (
              <View style={styles.noSource}>
                <Ionicons name="film" color={colors.textMuted} size={34} />
                <Text style={styles.noSourceTitle}>No movie selected</Text>
                <PrimaryButton label="Choose source" icon="add" onPress={() => navigation.navigate('SourcePicker', { roomId: room.id })} />
              </View>
            )}

            <LinearGradient colors={['rgba(0,0,0,0.58)', 'rgba(0,0,0,0)']} style={styles.topShade} pointerEvents="none" />
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} style={styles.bottomShade} pointerEvents="none" />

            {controlsVisible ? (
              <>
                <View style={styles.topBar}>
                  <Pressable onPress={() => {
                    leaveRoom();
                    navigation.replace('Main');
                  }} style={styles.iconButton}>
                    <Ionicons name="chevron-down" color={colors.white} size={22} />
                  </Pressable>
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomTitle} numberOfLines={1}>{room.title}</Text>
                    <Text style={styles.roomSubtitle}>{room.code} - {room.mode === 'host' ? 'Host controls' : 'Shared controls'}</Text>
                  </View>
                  <Pressable onPress={copyInvite} style={styles.iconButton}>
                    <Ionicons name="share-social" color={colors.white} size={20} />
                  </Pressable>
                  <Pressable onPress={reportRoom} style={styles.iconButton}>
                    <Ionicons name="shield" color={colors.white} size={19} />
                  </Pressable>
                </View>

                <View style={styles.centerControls}>
                  <Pressable style={styles.roundControl} onPress={() => void seekBy(-10_000)}>
                    <Ionicons name="play-back" color={colors.white} size={22} />
                  </Pressable>
                  <Pressable style={styles.playControl} onPress={() => void togglePlayback()}>
                    <Ionicons name={playback?.status === 'playing' ? 'pause' : 'play'} color={colors.white} size={34} />
                  </Pressable>
                  <Pressable style={styles.roundControl} onPress={() => void seekBy(10_000)}>
                    <Ionicons name="play-forward" color={colors.white} size={22} />
                  </Pressable>
                </View>

                <View style={styles.bottomControls}>
                  <View style={styles.progressText}>
                    <Text style={styles.time}>{formatDuration(localPosition || expected)}</Text>
                    <Text style={styles.time}>{formatDuration(playback?.media?.durationMs)}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, ((localPosition || expected) / Math.max(playback?.media?.durationMs ?? 1, 1)) * 100)}%` }]} />
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable style={styles.pill} onPress={() => setChatOpen(true)}>
                      <Ionicons name="chatbubble-ellipses" color={colors.white} size={18} />
                      <Text style={styles.pillText}>Chat</Text>
                    </Pressable>
                    <Pressable style={styles.pill} onPress={() => navigation.navigate('SourcePicker', { roomId: room.id })}>
                      <Ionicons name="albums" color={colors.white} size={18} />
                      <Text style={styles.pillText}>Source</Text>
                    </Pressable>
                    <Pressable style={styles.pill}>
                      <Ionicons name="speedometer" color={colors.white} size={18} />
                      <Text style={styles.pillText}>{playback?.speed ?? 1}x</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : null}

            <ReactionsOverlay reactions={reactions} />
            <CallBubble roomId={room.id} />
          </Pressable>

          <View style={styles.partnerStrip}>
            {participants.map((participant) => (
              <View key={participant.userId} style={styles.partner}>
                <Avatar name={participant.displayName} uri={participant.avatarUrl} size={34} />
                <View>
                  <Text style={styles.partnerName}>{participant.displayName}</Text>
                  <Text style={styles.partnerMeta}>{participant.online ? 'Online' : 'Away'}{participant.muted ? ' - muted' : ''}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.reactionDock}>
            {quickReactions.map((emoji) => (
              <Pressable key={emoji} style={styles.reactionButton} onPress={() => sendReaction(emoji, localPosition || expected)}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Modal visible={chatOpen} animationType="slide" transparent onRequestClose={() => setChatOpen(false)}>
          <Pressable style={styles.modalScrim} onPress={() => setChatOpen(false)} />
          <View style={styles.chatModal}>
            <ChatPanel room={room} />
          </View>
        </Modal>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md
  },
  loadingText: {
    color: colors.textMuted
  },
  playerWrap: {
    flex: 1,
    backgroundColor: colors.black
  },
  video: {
    width: '100%',
    height: '100%'
  },
  noSource: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl
  },
  noSourceTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150
  },
  bottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220
  },
  topBar: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 10
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)'
  },
  roomInfo: {
    flex: 1
  },
  roomTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900'
  },
  roomSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 2
  },
  centerControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '42%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    zIndex: 9
  },
  roundControl: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  playControl: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rose
  },
  bottomControls: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    zIndex: 10,
    gap: spacing.md
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  time: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800'
  },
  progressTrack: {
    height: 5,
    borderRadius: radii.round,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.rose
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  pill: {
    minHeight: 42,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  pillText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800'
  },
  partnerStrip: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: spacing.xl + 58,
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 12
  },
  partner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.round,
    backgroundColor: 'rgba(0,0,0,0.38)'
  },
  partnerName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900'
  },
  partnerMeta: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 10
  },
  reactionDock: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 30,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.round,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  reactionEmoji: {
    fontSize: 22
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)'
  },
  chatModal: {
    height: '62%'
  }
});
