import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useAuth } from '@/features/auth';
import { useFieldOps } from '@/features/fieldops';

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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Usuário'}</Text>
        <Text style={styles.role}>{user?.role ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>

        <Card style={styles.card}>
          <Row label="Versão" value="1.0.0" />
          <Row label="Dispositivo" value="Expo Android" />
        </Card>

        <Button label="Forçar sincronização" onPress={syncNow} variant="secondary" fullWidth />
        <Button
          label="Sair da conta"
          onPress={() => (pending > 0 ? setConfirm(true) : logout())}
          variant="danger"
          fullWidth
          loading={loggingOut}
        />
      </ScrollView>

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
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  avatarText: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.xl, color: Colors.text, fontWeight: FontWeight.bold, textAlign: 'center' },
  role: { color: Colors.primary, fontWeight: FontWeight.semibold },
  email: { color: Colors.textSecondary, fontSize: FontSize.sm },
  card: { width: '100%', gap: Spacing.sm },
  row: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm },
  rowLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  rowValue: { color: Colors.text, fontWeight: FontWeight.semibold },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.30)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  modal: { width: '100%', gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  modalDesc: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
