import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listPublicRooms } from '../../api/rooms';
import { AppBackground } from '../../components/AppBackground';
import { Avatar } from '../../components/Avatar';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuthStore } from '../../store/authStore';
import { colors, gradients } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import type { RootStackParamList, WatchRoom } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

const recommendations = [
  { title: 'Before Sunrise', meta: 'Quiet romance - 101 min', mood: 'Deep talk' },
  { title: 'La La Land', meta: 'Musical drama - 128 min', mood: 'Dreamy' },
  { title: 'Your Name', meta: 'Anime romance - 106 min', mood: 'Long distance' }
];

export function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const [rooms, setRooms] = useState<WatchRoom[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listPublicRooms()
        .then((next) => {
          if (!cancelled) {
            setRooms(next);
          }
        })
        .catch(() => setRooms([]));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Tonight feels cinematic</Text>
              <Text style={styles.title}>Watch together</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Profile')}>
              <Avatar name={user?.displayName ?? 'SoulSync'} uri={user?.avatarUrl} />
            </Pressable>
          </View>

          <LinearGradient colors={gradients.rose} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Private room for two</Text>
              <Text style={styles.heroCopy}>Synchronized movie, call bubble, encrypted chat, and reactions that land on the same scene.</Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="videocam" color={colors.white} size={30} />
            </View>
          </LinearGradient>

          <View style={styles.actions}>
            <PrimaryButton label="Create room" icon="add" onPress={() => navigation.navigate('CreateRoom')} style={styles.actionButton} />
            <PrimaryButton label="Join code" icon="enter" variant="quiet" onPress={() => navigation.navigate('JoinRoom')} style={styles.actionButton} />
          </View>

          <SectionHeader title="Continue Watching" action="Synced" />
          <GlassCard contentStyle={styles.continueCard}>
            <View style={styles.poster}>
              <Ionicons name="play" color={colors.white} size={28} />
            </View>
            <View style={styles.continueText}>
              <Text style={styles.movieTitle}>Interstellar</Text>
              <Text style={styles.movieMeta}>1:04:22 left - partner online</Text>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </GlassCard>

          <SectionHeader title="Couple Picks" action="Refresh" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationRow}>
            {recommendations.map((item) => (
              <GlassCard key={item.title} contentStyle={styles.recommendation}>
                <View style={styles.moodBadge}>
                  <Text style={styles.moodText}>{item.mood}</Text>
                </View>
                <Text style={styles.recTitle}>{item.title}</Text>
                <Text style={styles.recMeta}>{item.meta}</Text>
              </GlassCard>
            ))}
          </ScrollView>

          <SectionHeader title="Trending Rooms" action={rooms.length ? `${rooms.length} live` : 'No public rooms'} />
          {rooms.length === 0 ? (
            <GlassCard contentStyle={styles.empty}>
              <Ionicons name="lock-closed" color={colors.textMuted} size={22} />
              <Text style={styles.emptyTitle}>Most couples are watching privately</Text>
              <Text style={styles.emptyCopy}>Create a room and share the invite link with your partner.</Text>
            </GlassCard>
          ) : (
            rooms.map((room) => (
              <Pressable key={room.id} onPress={() => navigation.navigate('WatchRoom', { roomId: room.code })}>
                <GlassCard contentStyle={styles.roomCard}>
                  <View>
                    <Text style={styles.roomTitle}>{room.title}</Text>
                    <Text style={styles.roomMeta}>{Object.values(room.participants).filter((p) => p.online).length} watching - {room.mode}</Text>
                  </View>
                  <Ionicons name="chevron-forward" color={colors.textMuted} size={22} />
                </GlassCard>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.lg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  eyebrow: {
    color: colors.rose,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  hero: {
    minHeight: 166,
    borderRadius: radii.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  heroText: {
    flex: 1,
    justifyContent: 'space-between'
  },
  heroTitle: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900'
  },
  heroCopy: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 270
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md
  },
  actionButton: {
    flex: 1
  },
  continueCard: {
    flexDirection: 'row',
    padding: 0,
    gap: 0
  },
  poster: {
    width: 92,
    height: 116,
    borderRadius: radii.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.md
  },
  continueText: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
    justifyContent: 'center',
    gap: spacing.sm
  },
  movieTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  movieMeta: {
    color: colors.textMuted,
    fontSize: 13
  },
  progressTrack: {
    height: 5,
    borderRadius: radii.round,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: spacing.sm
  },
  progressFill: {
    width: '46%',
    height: '100%',
    backgroundColor: colors.rose
  },
  recommendationRow: {
    gap: spacing.md,
    paddingRight: spacing.xl
  },
  recommendation: {
    width: 186,
    minHeight: 132
  },
  moodBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.round,
    backgroundColor: 'rgba(255,79,139,0.16)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  moodText: {
    color: colors.rose,
    fontSize: 11,
    fontWeight: '800'
  },
  recTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900'
  },
  recMeta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.md
  },
  emptyCopy: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  roomCard: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  roomTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  roomMeta: {
    color: colors.textMuted,
    marginTop: spacing.xs
  }
});
