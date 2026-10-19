import { StyleSheet, Text, View } from 'react-native';

import { FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button } from '@/design-system';
import { useThemeColors } from '@/features/theme';
import { useAuth } from './AuthContext';

export function OfflineLimitedBanner() {
  const { isOfflineLimited, signOut } = useAuth();
  const c = useThemeColors();

  if (!isOfflineLimited) return null;

  return (
    <View style={[styles.banner, { backgroundColor: c.warningLight, borderBottomColor: c.warning }]}>
      <Text style={[styles.title, { color: c.warningDark }]}>Sessão expirada — modo offline</Text>
      <Text style={[styles.message, { color: c.textSecondary }]}>
        As inspeções salvas neste dispositivo continuam disponíveis para consulta.
        Entre novamente para sincronizar e enviar novos dados.
      </Text>
      <Button label="Entrar novamente" variant="secondary" onPress={() => void signOut()} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderBottomWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  message: {
    fontSize: FontSize.sm,
  },
});
