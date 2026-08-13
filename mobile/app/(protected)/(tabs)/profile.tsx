import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useAuth } from '@/features/auth';
import { useFieldOps } from '@/features/fieldops';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { inspections, syncNow } = useFieldOps();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const pending = inspections.reduce((sum, item) => sum + item.pendingSyncCount, 0);
  function logout() { signOut(); router.replace('/(public)/login'); }
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatar}><Text style={styles.avatarText}>CH</Text></View>
        <Text style={styles.name}>Carlos Henrique Silva</Text><Text style={styles.role}>Técnico</Text><Text style={styles.email}>{user?.email ?? 'tecnico@fieldops.local'}</Text>
        <Card style={styles.card}><Row label="Versão" value="1.0.0" /><Row label="Dispositivo" value="Expo Android" /><Row label="Último login" value="13/08/2026 08:45" /></Card>
        <Button label="Forçar sincronização" onPress={syncNow} variant="secondary" fullWidth />
        <Button label="Sair da conta" onPress={() => pending > 0 ? setConfirm(true) : logout()} variant="danger" fullWidth />
      </ScrollView>
      <Modal visible={confirm} transparent animationType="fade"><View style={styles.modalBackdrop}><Card style={styles.modal}><Text style={styles.modalTitle}>Operações pendentes</Text><Text style={styles.email}>Existem {pending} operações aguardando sincronização.</Text><Button label="Sair mesmo assim" onPress={logout} variant="danger" fullWidth /><Button label="Cancelar" onPress={() => setConfirm(false)} variant="ghost" fullWidth /></Card></View></Modal>
    </SafeAreaView>
  );
}
function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.email}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.background }, container: { padding: Spacing.md, alignItems: 'center', gap: Spacing.md, paddingBottom: 100 }, avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md }, avatarText: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.bold }, name: { fontSize: FontSize.xl, color: Colors.text, fontWeight: FontWeight.bold, textAlign: 'center' }, role: { color: Colors.primary, fontWeight: FontWeight.semibold }, email: { color: Colors.textSecondary, fontSize: FontSize.sm }, card: { width: '100%', gap: Spacing.sm }, row: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm }, rowValue: { color: Colors.text, fontWeight: FontWeight.semibold }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.30)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }, modal: { width: '100%', gap: Spacing.md }, modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text } });

