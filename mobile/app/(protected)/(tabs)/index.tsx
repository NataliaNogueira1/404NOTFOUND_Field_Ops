import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, StatusBadge, StatusCard } from '@/design-system';
import { useAuth } from '@/features/auth';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';

// ─── Mock data ────────────────────────────────────────────────────────────────

const RECENT_INSPECTIONS = [
  {
    id: '1',
    title: 'Inspeção Predial — Bloco A',
    description: 'Verificação de estrutura, instalações elétricas e hidráulicas.',
    timestamp: 'Hoje, 09:45',
    status: 'in_progress' as const,
  },
  {
    id: '2',
    title: 'Vistoria de Equipamentos — Sala 12',
    description: 'Checklist de manutenção preventiva dos equipamentos de refrigeração.',
    timestamp: 'Hoje, 08:00',
    status: 'pending' as const,
  },
  {
    id: '3',
    title: 'Auditoria de Segurança — Portaria',
    description: 'Revisão dos protocolos de acesso e câmeras de monitoramento.',
    timestamp: 'Ontem, 16:30',
    status: 'completed' as const,
  },
  {
    id: '4',
    title: 'Inspeção de Incêndio — Subsolo',
    description: 'Verificação dos extintores e rotas de fuga.',
    timestamp: 'Ontem, 14:00',
    status: 'failed' as const,
  },
] as const;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Text style={styles.greeting}>Olá, {user?.name ?? 'Agente'} 👋</Text>
        <Text style={styles.subtitle}>Resumo de hoje</Text>

        {/* Stats row */}
        <View style={styles.stats}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
            <StatusBadge status="pending" />
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Em andamento</Text>
            <StatusBadge status="in_progress" />
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Concluídas</Text>
            <StatusBadge status="completed" />
          </Card>
        </View>

        {/* Recent inspections */}
        <Text style={styles.sectionTitle}>Inspeções recentes</Text>

        <View style={styles.list}>
          {RECENT_INSPECTIONS.map((item) => (
            <StatusCard
              key={item.id}
              title={item.title}
              description={item.description}
              timestamp={item.timestamp}
              status={item.status}
              onPress={() => {
                // navegação futura: router.push(`/inspections/${item.id}`)
              }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.gray500,
    marginBottom: Spacing.lg,
  },
  // Stats
  stats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.gray900,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
    textAlign: 'center',
  },
  // List
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.gray800,
    marginBottom: Spacing.sm,
  },
  list: {
    gap: Spacing.sm,
  },
});
