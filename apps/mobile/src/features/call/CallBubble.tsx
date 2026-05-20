import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { getSocket } from '../../api/socket';
import { AGORA_APP_ID } from '../../api/config';
import { joinAgoraRoom, leaveAgoraRoom, setAgoraCameraEnabled, setAgoraMuted } from './agoraService';
import { useAuthStore } from '../../store/authStore';
import { colors, gradients } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

interface Props {
  roomId: string;
}

export function CallBubble({ roomId }: Props) {
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(width - 156);
  const translateY = useSharedValue(92);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (!user) {
      return undefined;
    }
    void joinAgoraRoom(roomId, stableAgoraUid(user.id));
    return () => {
      leaveAgoraRoom();
    };
  }, [roomId, user]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = Math.max(12, Math.min(width - (minimized ? 76 : 152), startX.value + event.translationX));
      translateY.value = Math.max(72, startY.value + event.translationY);
    })
    .onEnd(() => {
      const snapLeft = translateX.value < width / 2;
      translateX.value = withSpring(snapLeft ? 12 : width - (minimized ? 76 : 152));
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }]
  }));

  function updateCallState(next: { muted?: boolean; cameraEnabled?: boolean }) {
    getSocket().emit('call:state', { roomId, ...next });
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.bubble, minimized ? styles.minimized : styles.expanded, style]}>
        <LinearGradient colors={gradients.calm} style={styles.videoMock}>
          <Ionicons name={cameraEnabled ? 'person' : 'videocam-off'} color={colors.white} size={minimized ? 20 : 30} />
          {!minimized ? <Text style={styles.videoText}>{AGORA_APP_ID ? 'Live call' : 'Call ready'}</Text> : null}
        </LinearGradient>
        {!minimized ? (
          <View style={styles.controls}>
            <Pressable
              style={[styles.control, muted && styles.controlActive]}
              onPress={() => {
                const next = !muted;
                setMuted(next);
                setAgoraMuted(next);
                updateCallState({ muted: next });
              }}
            >
              <Ionicons name={muted ? 'mic-off' : 'mic'} color={colors.white} size={15} />
            </Pressable>
            <Pressable
              style={[styles.control, !cameraEnabled && styles.controlActive]}
              onPress={() => {
                const next = !cameraEnabled;
                setCameraEnabled(next);
                setAgoraCameraEnabled(next);
                updateCallState({ cameraEnabled: next });
              }}
            >
              <Ionicons name={cameraEnabled ? 'videocam' : 'videocam-off'} color={colors.white} size={15} />
            </Pressable>
            <Pressable style={styles.control} onPress={() => setMinimized(true)}>
              <Ionicons name="contract" color={colors.white} size={15} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.expand} onPress={() => setMinimized(false)}>
            <Ionicons name="expand" color={colors.white} size={14} />
          </Pressable>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    zIndex: 20,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: colors.surface
  },
  expanded: {
    width: 140,
    height: 184
  },
  minimized: {
    width: 64,
    height: 64,
    borderRadius: 32
  },
  videoMock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  videoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900'
  },
  controls: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  control: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)'
  },
  controlActive: {
    backgroundColor: colors.danger
  },
  expand: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)'
  }
});

function stableAgoraUid(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return Math.max(1, hash % 2_000_000_000);
}
