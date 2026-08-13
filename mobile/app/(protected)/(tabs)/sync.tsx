import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button, Card } from '@/design-system';
import { SyncBadge } from '@/components/fieldops';
import { useFieldOps } from '@/features/fieldops';

export default function SyncScreen() {
  const { syncOperations, syncNow } = useFieldOps();
  const [syncing, setSyncing] = useState(false);
  const hasPending = syncOperations.some((operation) => operation.status === 'Pendente' || operation.status === 'Erro');
  async function handleSync() { setSyncing(true); await new Promise((resolve) => setTimeout(resolve, 700)); syncNow(); setSyncing(false); }
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sincronização</Text>
        <Card style={styles.card}><Text style={styles.label}>Status</Text><Text style={styles.value}>{hasPending ? 'Pendências locais' : 'Sincronizado'}</Text><Text style={styles.muted}>Última sync</Text><Text style={styles.date}>03/08/2026 11:20</Text><Button label="Sincronizar agora" onPress={handleSync} loading={syncing} fullWidth /></Card>
        <Text style={styles.section}>Operações</Text>
        {syncOperations.map((operation) => <Card key={operation.id} style={styles.operation}><View><Text style={styles.operationTitle}>{operation.title}</Text><Text style={styles.muted}>{operation.status}</Text></View><SyncBadge status={operation.status === 'Erro' ? 'error' : operation.status === 'Pendente' ? 'pending' : 'synced'} /></Card>)}
        <Button label="Tentar novamente" onPress={handleSync} variant="secondary" fullWidth />
        <Card style={styles.card}><Text style={styles.section}>Download</Text><Text style={styles.valueSmall}>Inspeções atualizadas: 3</Text></Card>
        <Card style={styles.card}><Text style={styles.section}>Dispositivo</Text><Row label="Espaço usado" value="128 MB" /><Row label="Fotos pendentes" value="5" /><Row label="Modo" value="Online" /></Card>
      </ScrollView>
    </SafeAreaView>
  );
}
function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.muted}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.background }, container: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md }, title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text }, card: { gap: Spacing.sm }, label: { color: Colors.textSecondary, fontWeight: FontWeight.semibold }, value: { fontSize: FontSize.xxl, color: Colors.text, fontWeight: FontWeight.bold }, valueSmall: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold }, muted: { color: Colors.textSecondary, fontSize: FontSize.sm }, date: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.semibold }, section: { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.semibold }, operation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm }, operationTitle: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold }, row: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm }, rowValue: { color: Colors.text, fontWeight: FontWeight.semibold } });
