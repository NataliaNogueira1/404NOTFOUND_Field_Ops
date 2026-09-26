import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricCapability {
  /** Whether the device hardware supports biometrics at all. */
  isHardwareAvailable: boolean;
  /** Whether the user has enrolled at least one biometric credential. */
  isEnrolled: boolean;
  /** The strongest available biometric type. */
  biometricType: BiometricType;
}

export interface BiometricAuthResult {
  success: boolean;
  /** Human-readable reason for failure, suitable for display. */
  error?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapAuthenticationType(
  types: LocalAuthentication.AuthenticationType[],
): BiometricType {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'none';
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Provides biometric capability info and an `authenticate()` function.
 *
 * Usage:
 *   const { capability, authenticate } = useBiometricAuth();
 *   if (!capability.isEnrolled) { ... show fallback ... }
 *   const result = await authenticate();
 */
export function useBiometricAuth() {
  const [capability, setCapability] = useState<BiometricCapability>({
    isHardwareAvailable: false,
    isEnrolled: false,
    biometricType: 'none',
  });
  const [isChecking, setIsChecking] = useState(true);

  // ─── Check device capabilities on mount ──────────────────────────────────────
  useEffect(() => {
    async function checkCapability() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = hasHardware
          ? await LocalAuthentication.isEnrolledAsync()
          : false;
        const supportedTypes = hasHardware
          ? await LocalAuthentication.supportedAuthenticationTypesAsync()
          : [];

        setCapability({
          isHardwareAvailable: hasHardware,
          isEnrolled,
          biometricType: mapAuthenticationType(supportedTypes),
        });
      } finally {
        setIsChecking(false);
      }
    }

    void checkCapability();
  }, []);

  // ─── Prompt biometric authentication ─────────────────────────────────────────

  const authenticate = useCallback(async (): Promise<BiometricAuthResult> => {
    // Guard: hardware or enrollment unavailable
    if (!capability.isHardwareAvailable || !capability.isEnrolled) {
      return {
        success: false,
        error: 'Biometria não disponível neste dispositivo.',
      };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade para acessar o FieldOps',
        cancelLabel: 'Usar senha',
        fallbackLabel: 'Usar senha',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      // Map known error codes to user-friendly messages
      switch (result.error) {
        case 'user_cancel':
          return { success: false, error: 'Autenticação cancelada.' };
        case 'system_cancel':
          return { success: false, error: 'Autenticação interrompida pelo sistema.' };
        case 'lockout':
        case 'lockout_permanent':
          return {
            success: false,
            error: 'Muitas tentativas. Use sua senha para desbloquear.',
          };
        default:
          return { success: false, error: 'Falha na autenticação biométrica.' };
      }
    } catch {
      return { success: false, error: 'Erro ao acessar o sensor biométrico.' };
    }
  }, [capability.isHardwareAvailable, capability.isEnrolled]);

  return { capability, isChecking, authenticate };
}
