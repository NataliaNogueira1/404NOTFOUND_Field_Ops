import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useAuth } from '@/features/auth';
import { useFieldOps } from '@/features/fieldops';
import { useBiometricAuth } from '@/hooks';
import { biometricStorage } from '@/infrastructure/storage/tokenStorage';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { inspections, syncNow } = useFieldOps();
  const router = useRouter();
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

  const biometricLabel =
    capability.biometricType === 'facial'
      ? 'Desbloquear com Face ID'
      : capability.biometricType === 'fingerprint'
        ? 'Desbloquear com digital'
        : 'Desbloqueio biométrico';

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
    try {
      await signOut();
      router.replace('/(public)/login');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Usuário'}</Text>
        <Text style={styles.role}>{user?.role ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>

        {/* App info */}
        <Card style={styles.card}>
          <Row label="Versão" value="1.0.0" />
          <Row label="Dispositivo" value="Expo Android" />
        </Card>

        {/* Security settings */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Segurança</Text>

          <View
            style={[styles.biometricRow, !biometricAvailable && styles.biometricRowDisabled]}
            accessible
            accessibilityRole="none"
          >
            <View style={styles.biometricText}>
              <Text
                style={[styles.biometricLabel, !biometricAvailable && styles.textMuted]}
              >
                {biometricLabel}
              </Text>
              {biometricUnavailableHint ? (
                <Text style={styles.biometricHint}>{biometricUnavailableHint}</Text>
              ) : (
                <Text style={styles.biometricHint}>
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
              trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
              thumbColor={biometricEnabled ? Colors.primary : Colors.gray400}
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
            <Text style={styles.modalTitle}>Operações pendentes</Text>
            <Text style={styles.modalDesc}>
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
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.md, alignItems: 'center', gap: Spacing.md, paddingBottom: 100 },

  // Avatar / user info
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  avatarText: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.xl, color: Colors.text, fontWeight: FontWeight.bold, textAlign: 'center' },
  role: { color: Colors.primary, fontWeight: FontWeight.semibold },
  email: { color: Colors.textSecondary, fontSize: FontSize.sm },

  // Cards
  card: { width: '100%', gap: Spacing.sm },

  // App info rows
  row: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm },
  rowLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  rowValue: { color: Colors.text, fontWeight: FontWeight.semibold },

  // Security section
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  biometricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  biometricRowDisabled: { opacity: 0.5 },
  biometricText: { flex: 1, gap: 2 },
  biometricLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  biometricHint: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  textMuted: { color: Colors.textSecondary },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.30)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modal: { width: '100%', gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  modalDesc: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
