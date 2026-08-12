import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { useAuth } from '@/features/auth';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.replace('/(public)/login');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name ?? '—'}</Text>
        <Text style={styles.role}>{user?.role ?? '—'}</Text>

        <Card style={styles.infoCard}>
          <Row label="E-mail" value={user?.email ?? '—'} />
          <Row label="Cargo" value={user?.role ?? '—'} />
        </Card>

        <Button
          label="Sair"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.gray900,
  },
  role: {
    fontSize: FontSize.md,
    color: Colors.gray500,
    textTransform: 'capitalize',
  },
  infoCard: {
    width: '100%',
    gap: Spacing.sm,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  value: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray800,
  },
});
