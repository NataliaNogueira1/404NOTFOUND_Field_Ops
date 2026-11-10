import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button } from '@/design-system';
import { useThemeColors } from '@/features/theme';
import { useAuth } from './AuthContext';

/**
 * Banner shown when the user's session has expired but the app is offline,
 * allowing them to continue browsing locally-cached inspections.
 *
 * useSafeAreaInsets ensures the banner appears below the native status bar,
 * notch, or punch-hole camera on both iOS and Android (issue #332).
 */
export function OfflineLimitedBanner() {
  const { isOfflineLimited, signOut } = useAuth();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  if (!isOfflineLimited) return null;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: c.warningLight, borderBottomColor: c.warning, paddingTop: insets.top + Spacing.md },
      ]}
    >
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
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
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
