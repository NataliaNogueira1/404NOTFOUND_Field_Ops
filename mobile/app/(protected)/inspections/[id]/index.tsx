import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { InspectionStatusBadge, PriorityBadge, ProgressBar } from '@/components/fieldops';
import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { byId, clients, compressorTemplate, equipment, InspectionStatus, sites, supervisor, technician, useFieldOps } from '@/features/fieldops';

export default function InspectionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { inspections, evidences, nonConformities } = useFieldOps();
  const inspection = inspections.find((item) => item.id === id) ?? inspections[0];
  const client = byId(clients, inspection.clientId); const site = byId(sites, inspection.siteId); const asset = byId(equipment, inspection.equipmentId);
  const action = inspection.status === InspectionStatus.IN_PROGRESS ? 'Continuar inspeção' : inspection.status === InspectionStatus.REJECTED ? 'Corrigir inspeção' : 'Iniciar inspeção';
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.container}><Text style={styles.title}>{inspection.title}</Text><View style={styles.badges}><PriorityBadge priority={inspection.priority} /><InspectionStatusBadge status={inspection.status} /></View><Card style={styles.card}><Row label="Equipamento" value={asset?.name} /><Row label="Cliente" value={client?.name} /><Row label="Local" value={site?.name} /><Row label="Técnico" value={technician.name} /><Row label="Supervisora" value={supervisor.name} /><Row label="Data prevista" value={`${inspection.dueDate} ${inspection.dueTime}`} /><Row label="Criação" value={inspection.createdAt} /></Card><Card style={styles.card}><Text style={styles.section}>Instruções do supervisor</Text><Text style={styles.body}>{inspection.supervisorInstructions}</Text></Card><Card style={styles.card}><Text style={styles.section}>Progresso</Text><ProgressBar value={inspection.progress} /><Text style={styles.body}>{inspection.progress}% concluído</Text><Row label="Itens" value={`${compressorTemplate.sections.flatMap((section) => section.items).length}`} /><Row label="Não conformidades" value={`${nonConformities.filter((nc) => nc.inspectionId === inspection.id).length}`} /><Row label="Evidências" value={`${evidences.filter((evidence) => evidence.inspectionId === inspection.id).length}`} /></Card><Button label={action} onPress={() => router.push(`/(protected)/inspections/${inspection.id}/start`)} fullWidth size="lg" /><Button label="Escanear QR Code" onPress={() => router.push('/(protected)/scanner')} variant="secondary" fullWidth /><Button label="Não conformidades" onPress={() => router.push(`/(protected)/inspections/${inspection.id}/non-conformities`)} variant="ghost" fullWidth /></ScrollView></SafeAreaView>;
}
function Row({ label, value }: { label: string; value?: string }) { return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value ?? '-'}</Text></View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.background }, container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl }, title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text }, badges: { flexDirection: 'row', gap: Spacing.sm }, card: { gap: Spacing.sm }, section: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text }, body: { color: Colors.textSecondary, lineHeight: 21 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border }, label: { color: Colors.textSecondary, flex: 1 }, value: { color: Colors.text, fontWeight: FontWeight.semibold, flex: 1, textAlign: 'right' } });
