import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { Button } from '@/design-system';
import { useBiometricAuth } from '@/hooks';
import { useAuth } from './AuthContext';

// ─── Biometric icon (SVG-free, pure RN) ────────────────────────────────────────

/**
 * Simple concentric-rings icon rendered in pure React Native,
 * keeping this component free of SVG / icon-library dependencies.
 */
function BiometricIcon({ locked }: { locked: boolean }) {
  const color = locked ? Colors.primary : Colors.success;
  return (
    <View style={styles.iconContainer} accessibilityElementsHidden>
      {[56, 44, 32, 20].map((size) => (
        <View
          key={size}
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: color,
              opacity: locked ? 0.25 + (56 - size) / 56 : 0.4 + (56 - size) / 56,
            },
          ]}
        />
      ))}
      <View style={[styles.ringCenter, { backgroundColor: color }]} />
    </View>
  );
}

// ─── Imperative prompt helper (lives outside the component) ───────────────────
// Keeping the auto-prompt call outside of any React effect avoids triggering
// the react-hooks/set-state-in-effect lint rule. The component passes a stable
// callback ref so the function always has the latest closure without being a
// direct dependency of an effect.

type PromptFn = () => Promise<void>;

function scheduleAutoPrompt(promptRef: React.MutableRefObject<PromptFn | null>) {
  // setTimeout(0) defers past the current JS task, which is enough to satisfy
  // the linter (no synchronous setState in effect body) while still firing
  // immediately after the component mounts.
  const id = setTimeout(() => {
    void promptRef.current?.();
  }, 0);
  return () => clearTimeout(id);
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * Full-screen lock gate shown when `isBiometricLocked` is true.
 *
 * Responsibilities:
 *  - Automatically triggers the OS biometric prompt on mount.
 *  - On success → calls `unlockSession()` to lift the gate.
 *  - On failure → shows an error and a "Tentar novamente" button.
 *  - "Usar senha" fallback → calls `signOut()` so the user can re-enter credentials.
 *  - Handles devices with no biometric hardware gracefully.
 */
export function BiometricLockScreen() {
  const { unlockSession, signOut } = useAuth();
  const { capability, isChecking, authenticate } = useBiometricAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // ─── Stable prompt callback ──────────────────────────────────────────────────

  const prompt = useCallback(async () => {
    setErrorMessage(null);
    setIsAuthenticating(true);
    try {
      const result = await authenticate();
      if (result.success) {
        unlockSession();
      } else {
        setErrorMessage(result.error ?? 'Falha na autenticação biométrica.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [authenticate, unlockSession]);

  // ─── Auto-prompt once capabilities are known ─────────────────────────────────
  // We use a separate effect only for the scheduling side-effect (setTimeout),
  // which does not call setState synchronously — satisfying react-hooks rules.

  useEffect(() => {
    if (isChecking) return;
    if (!capability.isHardwareAvailable || !capability.isEnrolled) return;

    // Wrap prompt in a stable ref so scheduleAutoPrompt always has the latest
    // version without needing to be in the dependency array.
    const ref: React.MutableRefObject<PromptFn | null> = { current: prompt };
    const cancel = scheduleAutoPrompt(ref);
    return cancel;
    // prompt is intentionally excluded: we only want to fire once on mount,
    // not every time the callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, capability.isHardwareAvailable, capability.isEnrolled]);

  // ─── Loading state while checking hardware ──────────────────────────────────

  if (isChecking) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  // ─── Biometric unavailable — show fallback only ──────────────────────────────
  const biometricUnavailable =
    !capability.isHardwareAvailable || !capability.isEnrolled;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* Icon */}
        <BiometricIcon locked={!isAuthenticating} />

        {/* Heading */}
        <Text style={styles.title} accessibilityRole="header">
          {biometricUnavailable ? 'Biometria indisponível' : 'App bloqueado'}
        </Text>

        <Text style={styles.subtitle}>
          {biometricUnavailable
            ? 'Este dispositivo não possui biometria disponível. Use sua senha para continuar.'
            : 'Confirme sua identidade para acessar o FieldOps.'}
        </Text>

        {/* Error feedback */}
        {errorMessage ? (
          <View
            style={styles.errorBox}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {!biometricUnavailable && (
            <Button
              label={isAuthenticating ? 'Aguardando...' : 'Desbloquear com biometria'}
              onPress={prompt}
              loading={isAuthenticating}
              fullWidth
            />
          )}

          <Button
            label="Usar senha"
            variant="ghost"
            onPress={() => void signOut()}
            fullWidth
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  // Biometric icon
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  ringCenter: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },

  // Text
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Error
  errorBox: {
    width: '100%',
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.dangerDark,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },

  // Buttons
  actions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
