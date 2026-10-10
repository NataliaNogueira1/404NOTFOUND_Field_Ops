import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Card } from '@/design-system';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useThemeColors } from '@/features/theme';

export default function ScannerScreen() {
  const [found, setFound] = useState(false);
  const router = useRouter();
  const c = useThemeColors();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: c.text }]}>Scanner QR Code</Text>

        <Card style={styles.card}>
          {/* The scanner viewfinder stays a dark surface in both themes. */}
          <View style={styles.scanner}>
            <View style={styles.corner} />
            <Text style={styles.scanText}>
              {found ? 'Leitura simulada concluída' : 'Aponte para o QR Code do equipamento'}
            </Text>
          </View>
        </Card>

        {found ? (
          <Card style={styles.card}>
            <Text style={[styles.section, { color: c.text }]}>Equipamento encontrado</Text>
            <Text style={[styles.asset, { color: c.text }]}>Compressor XPTO 500</Text>
            <Text style={{ color: c.textSecondary }}>Patrimônio: COMP-004</Text>
            <Text style={{ color: c.textSecondary }}>Local: Unidade Sorocaba</Text>
            <Text style={{ color: c.textSecondary }}>Status: Ativo</Text>
            <Button label="Confirmar equipamento" onPress={() => router.push('/(protected)/inspections/ins-compressor')} fullWidth />
            <Button label="Escanear novamente" onPress={() => setFound(false)} variant="secondary" fullWidth />
          </Card>
        ) : (
          <Button label="Simular leitura" onPress={() => setFound(true)} fullWidth size="lg" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: Spacing.md, gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  card: { gap: Spacing.md },
  // Dark viewfinder in both themes.
  scanner: { height: 320, borderRadius: 12, backgroundColor: Colors.gray900, alignItems: 'center', justifyContent: 'center' },
  corner: { width: 190, height: 190, borderWidth: 3, borderColor: Colors.primaryLight, borderRadius: 20 },
  scanText: { color: Colors.white, position: 'absolute', bottom: Spacing.lg, fontWeight: FontWeight.semibold },
  section: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  asset: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
});
