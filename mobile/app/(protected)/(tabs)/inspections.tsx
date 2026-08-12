import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, StatusBadge } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import type { Inspection } from '@/features/inspections';

const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: '1',
    title: 'Inspeção Elétrica — Bloco A',
    location: 'Pavilhão Industrial',
    status: 'pending',
    assignedTo: 'Field Agent',
    scheduledAt: '2026-08-12T09:00:00Z',
  },
  {
    id: '2',
    title: 'Vistoria Hidráulica',
    location: 'Torre Norte',
    status: 'in_progress',
    assignedTo: 'Field Agent',
    scheduledAt: '2026-08-12T11:00:00Z',
  },
];

export default function InspectionsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        {MOCK_INSPECTIONS.map((inspection) => (
          <Card key={inspection.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{inspection.title}</Text>
              <StatusBadge status={inspection.status} />
            </View>
            <Text style={styles.cardLocation}>{inspection.location}</Text>
          </Card>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  card: { gap: Spacing.xs },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.gray900,
    marginRight: Spacing.sm,
  },
  cardLocation: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
});
