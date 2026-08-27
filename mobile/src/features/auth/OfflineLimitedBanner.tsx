import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button } from '@/design-system';
import { useAuth } from './AuthContext';

/**
 * Shown while the app is in limited offline mode: the session expired and could
 * not be renewed, but locally cached inspections remain readable. Signing back
 * in is the only way out — server calls stay unavailable until then.
 */
export function OfflineLimitedBanner() {
  const { isOfflineLimited, signOut } = useAuth();

  if (!isOfflineLimited) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Sessão expirada — modo offline</Text>
      <Text style={styles.message}>
        As inspeções salvas neste dispositivo continuam disponíveis para consulta.
        Entre novamente para sincronizar e enviar novos dados.
      </Text>
      <Button label="Entrar novamente" variant="secondary" onPress={() => void signOut()} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.warningLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.warningDark,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
