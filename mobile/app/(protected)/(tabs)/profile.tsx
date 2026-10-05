import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useAuth } from '@/features/auth';
import { useFieldOps } from '@/features/fieldops';
import { ThemeSelector, useThemeColors } from '@/features/theme';
import { useBiometricAuth } from '@/hooks';
import { biometricStorage } from '@/infrastructure/storage/tokenStorage';

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { inspections, syncNow } = useFieldOps();
  const router = useRouter();
  const c = useThemeColors();
  const [confirm, setConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Biometric toggle state ────────────────────────────────────────────────
  const { capability, isChecking: isCheckingBiometric } = useBiometricAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isTogglingBiometric, setIsTogglingBiometric] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    void biometricStorage.isEnabled().then(setBiometricEnabled);
  }, []);

  async function handleBiometricToggle(value: boolean) {
    setIsTogglingBiometric(true);
    try {
      if (value) {
        await biometricStorage.enable();
      } else {
        await biometricStorage.disable();
      }
      setBiometricEnabled(value);
    } finally {
      setIsTogglingBiometric(false);
    }
  }

  // Whether the biometric row should be interactive
  const biometricAvailable =
    !isCheckingBiometric &&
    capability.isHardwareAvailable &&
    capability.isEnrolled;

  const biometricLabel = 'Desbloquear com biometria';

  const biometricUnavailableHint = isCheckingBiometric
    ? 'Verificando sensor...'
    : !capability.isHardwareAvailable
      ? 'Hardware biométrico não disponível neste dispositivo.'
      : !capability.isEnrolled
        ? 'Nenhuma biometria cadastrada nas configurações do sistema.'
        : null;

  // ─── Logout helpers ────────────────────────────────────────────────────────
  const pending = inspections.reduce((sum, item) => sum + item.pendingSyncCount, 0);
  const initials = user?.name ? getInitials(user.name) : '??';

  async function logout() {
    setLoggingOut(true);
    try { await signOut(); router.replace('/(public)/login'); }
    finally { setLoggingOut(false); }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: c.text }]}>{user?.name ?? 'Usuário'}</Text>
        <Text style={[styles.role, { color: c.primary }]}>{user?.role ?? '—'}</Text>
        <Text style={[styles.email, { color: c.textSecondary }]}>{user?.email ?? '—'}</Text>

        {/* App info */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Aparência</Text>
          <ThemeSelector />
        </Card>

        <Card style={styles.card}>
          <Row label="Versão" value="1.0.0" />
          <Row label="Dispositivo" value="Expo Android" />
        </Card>

        {/* Security settings */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Segurança</Text>

          <View
            style={[styles.biometricRow, !biometricAvailable && styles.biometricRowDisabled]}
            accessible
            accessibilityRole="none"
          >
            <View style={styles.biometricText}>
              <Text
                style={[styles.biometricLabel, { color: biometricAvailable ? c.text : c.textSecondary }]}
              >
                {biometricLabel}
              </Text>
              {biometricUnavailableHint ? (
                <Text style={[styles.biometricHint, { color: c.textSecondary }]}>{biometricUnavailableHint}</Text>
              ) : (
                <Text style={[styles.biometricHint, { color: c.textSecondary }]}>
                  {biometricEnabled
                    ? 'Ativado — o app pedirá biometria ao ser reaberto.'
                    : 'Desativado — use sua senha ao reabrir o app.'}
                </Text>
              )}
            </View>

            <Switch
              value={biometricEnabled}
              onValueChange={(v) => void handleBiometricToggle(v)}
              disabled={!biometricAvailable || isTogglingBiometric}
              trackColor={{ false: c.gray200, true: Colors.primaryLight }}
              thumbColor={biometricEnabled ? Colors.primary : c.gray400}
              accessibilityLabel={biometricLabel}
              accessibilityRole="switch"
              accessibilityState={{
                checked: biometricEnabled,
                disabled: !biometricAvailable || isTogglingBiometric,
              }}
            />
          </View>
        </Card>

        {/* Actions */}
        <Button label="Forçar sincronização" onPress={syncNow} variant="secondary" fullWidth />
        <Button
          label="Sair da conta"
          onPress={() => (pending > 0 ? setConfirm(true) : logout())}
          variant="danger"
          fullWidth
          loading={loggingOut}
        />
      </ScrollView>

      {/* Logout confirmation modal */}
      <Modal visible={confirm} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Card style={styles.modal}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Operações pendentes</Text>
            <Text style={[styles.modalDesc, { color: c.textSecondary }]}>
              Existem {pending} operações aguardando sincronização. Se sair agora, elas serão enviadas no próximo login.
            </Text>
            <Button label="Sair mesmo assim" onPress={logout} variant="danger" fullWidth loading={loggingOut} />
            <Button label="Cancelar" onPress={() => setConfirm(false)} variant="ghost" fullWidth />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={[styles.row, { borderBottomColor: c.border }]}>
      <Text style={[styles.rowLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: Spacing.md, alignItems: 'center', gap: Spacing.md, paddingBottom: 100 },

  // Avatar / user info
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  avatarText: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  role: { fontWeight: FontWeight.semibold },
  email: { fontSize: FontSize.sm },

  // Cards
  card: { width: '100%', gap: Spacing.sm },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },

  // App info rows
  row: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: Spacing.sm },
  rowLabel: { fontSize: FontSize.sm },
  rowValue: { fontWeight: FontWeight.semibold },

  // Security section
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  biometricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  biometricRowDisabled: { opacity: 0.5 },
  biometricText: { flex: 1, gap: 2 },
  biometricLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  biometricHint: { fontSize: FontSize.xs, lineHeight: 16 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.30)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modal: { width: '100%', gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  modalDesc: { fontSize: FontSize.sm },
});
