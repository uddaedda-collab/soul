import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isDevAuthEnabled } from '../../api/config';
import { AppBackground } from '../../components/AppBackground';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { useAuthStore } from '../../store/authStore';
import { colors, gradients } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

type AuthMode = 'email' | 'create' | 'dev';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('email');
  const [name, setName] = useState('Maya');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const signInDev = useAuthStore((state) => state.signInDev);
  const signInEmail = useAuthStore((state) => state.signInEmail);
  const registerEmail = useAuthStore((state) => state.registerEmail);

  async function submit() {
    setBusy(true);
    try {
      if (mode === 'dev') {
        await signInDev(name.trim() || 'SoulSync User');
      } else if (mode === 'create') {
        await registerEmail(name.trim() || 'SoulSync User', email.trim(), password);
      } else {
        await signInEmail(email.trim(), password);
      }
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Check your details and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <View style={styles.hero}>
            <LinearGradient colors={gradients.rose} style={styles.logo}>
              <Ionicons name="heart" color={colors.white} size={34} />
            </LinearGradient>
            <Text style={styles.brand}>SoulSync</Text>
            <Text style={styles.tagline}>Private synced movie nights with call, chat, and live reactions.</Text>
          </View>

          <GlassCard contentStyle={styles.card}>
            <Text style={styles.cardTitle}>{mode === 'create' ? 'Create your account' : 'Welcome back'}</Text>

            <View style={styles.segment}>
              <Segment label="Email" active={mode === 'email'} onPress={() => setMode('email')} />
              <Segment label="Create" active={mode === 'create'} onPress={() => setMode('create')} />
              {isDevAuthEnabled ? <Segment label="Dev" active={mode === 'dev'} onPress={() => setMode('dev')} /> : null}
            </View>

            {mode !== 'email' ? (
              <TextField icon="person" value={name} onChangeText={setName} placeholder="Display name" autoCapitalize="words" />
            ) : null}

            {mode !== 'dev' ? (
              <>
                <TextField icon="mail" value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
                <TextField icon="key" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
              </>
            ) : null}

            <PrimaryButton
              label={busy ? 'Please wait...' : mode === 'create' ? 'Create account' : 'Continue'}
              icon={mode === 'create' ? 'person-add' : 'sparkles'}
              onPress={submit}
              disabled={busy || (mode !== 'dev' && (!email.trim() || password.length < 6))}
            />

            <View style={styles.authRow}>
              <Pressable style={styles.authPill} disabled>
                <Ionicons name="logo-google" color={colors.textMuted} size={18} />
                <Text style={styles.authPillText}>Google ready</Text>
              </Pressable>
              <Pressable style={styles.authPill} disabled>
                <Ionicons name="call" color={colors.textMuted} size={18} />
                <Text style={styles.authPillText}>Phone OTP</Text>
              </Pressable>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
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
  safe: {
    flex: 1
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between'
  },
  hero: {
    paddingTop: 64,
    gap: spacing.md
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brand: {
    color: colors.text,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '900'
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 330
  },
  card: {
    marginBottom: spacing.lg
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900'
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  segmentItem: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  segmentActive: {
    backgroundColor: colors.rose
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800'
  },
  segmentTextActive: {
    color: colors.white
  },
  authRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  authPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.round,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  authPillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700'
  }
});
