import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateMyProfile } from '../../api/users';
import { AppBackground } from '../../components/AppBackground';
import { Avatar } from '../../components/Avatar';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { RootStackParamList, UserProfile } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const defaultGenres = ['Romance', 'Sci-fi', 'Anime', 'Comedy', 'Thriller'];

export function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState((user as UserProfile | undefined)?.bio ?? 'Long-distance cinema partner');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  async function saveProfile() {
    setBusy(true);
    try {
      await updateMyProfile({
        displayName: displayName.trim() || user?.displayName,
        bio: bio.trim(),
        favoriteGenres: (user as UserProfile | undefined)?.favoriteGenres?.length
          ? (user as UserProfile).favoriteGenres
          : defaultGenres.slice(0, 3)
      });
      await refreshProfile();
      Alert.alert('Saved', 'Your SoulSync profile is updated.');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  const profile = user as UserProfile | undefined;
  const stats = [
    ['Hours watched', String(Math.round((profile?.watchStats.totalMinutes ?? 0) / 60))],
    ['Streak', `${profile?.watchStats.currentStreakDays ?? 0} days`],
    ['Reactions', String(profile?.watchStats.reactionsSent ?? 0)]
  ];

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <View style={styles.header}>
            <Avatar name={user?.displayName ?? 'SoulSync'} uri={user?.avatarUrl} size={82} />
            <Text style={styles.name}>{user?.displayName ?? 'SoulSync User'}</Text>
            <Text style={styles.bio}>{profile?.bio ?? 'Long-distance cinema partner'}</Text>
          </View>

          <GlassCard contentStyle={styles.editor}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <TextField icon="person" value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
            <TextField icon="heart" value={bio} onChangeText={setBio} placeholder="Bio" />
            <PrimaryButton label={busy ? 'Saving...' : 'Save profile'} icon="save" onPress={saveProfile} disabled={busy} />
          </GlassCard>

          <View style={styles.stats}>
            {stats.map(([label, value]) => (
              <GlassCard key={label} contentStyle={styles.statCard}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </GlassCard>
            ))}
          </View>

          <GlassCard contentStyle={styles.timeline}>
            <View style={styles.timelineHeader}>
              <Ionicons name="heart" color={colors.rose} size={20} />
              <Text style={styles.timelineTitle}>Memory timeline</Text>
            </View>
            {(profile?.reminders.length ? profile.reminders.map((item) => item.title) : ['First synced watch', 'Shared favorite list created', 'Anniversary reminder set']).map((item) => (
              <View key={item} style={styles.timelineItem}>
                <View style={styles.dot} />
                <Text style={styles.timelineText}>{item}</Text>
              </View>
            ))}
          </GlassCard>

          <PrimaryButton label="Sign out" icon="log-out" variant="quiet" onPress={() => void signOut()} />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
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
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg
  },
  name: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  bio: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center'
  },
  editor: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center'
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xs
  },
  timeline: {
    padding: spacing.lg
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  timelineTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 42
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.rose
  },
  timelineText: {
    color: colors.textMuted,
    fontSize: 14
  }
});
