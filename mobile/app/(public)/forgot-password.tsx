/**
 * Forgot-password screen — issue #256
 *
 * The user informs their e-mail; the app sends a reset request to the API.
 * For security the screen shows the same success message whether or not the
 * address exists in the system (the API is intentionally silent on this).
 *
 * States:
 *   idle      — empty form, button enabled
 *   loading   — spinner on button, inputs disabled
 *   success   — confirmation card, no way to re-submit accidentally
 *   error     — inline message, user can retry
 */

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

import { Button, Card, TextInput } from '@/design-system';
import { ThemeToggle, useThemeColors } from '@/features/theme';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { requestPasswordReset } from '@/infrastructure/api/authApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Success card ─────────────────────────────────────────────────────────────

function SuccessView({ onBack }: { onBack: () => void }) {
  const c = useThemeColors();
  return (
    <Card style={styles.form} shadow="md">
      <View style={styles.successIcon}>
        <Ionicons name="mail-outline" size={40} color={Colors.success} />
      </View>
      <Text style={[styles.successTitle, { color: c.text }]}>Verifique seu e-mail</Text>
      <Text style={[styles.successBody, { color: c.textSecondary }]}>
        Se o endereço informado estiver cadastrado, você receberá um link para
        redefinir sua senha em breve.
      </Text>
      <Text style={[styles.successHint, { color: c.textSecondary }]}>
        Não esqueça de verificar a caixa de spam.
      </Text>
      <Button
        label="Voltar para o login"
        onPress={onBack}
        variant="primary"
        fullWidth
        size="lg"
      />
    </Card>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const c = useThemeColors();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return 'Informe seu e-mail.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Formato de e-mail inválido.';
    return null;
  }

  async function handleSubmit() {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('Network') || message.includes('fetch')) {
        setError('Sem conexão com o servidor. Verifique sua rede e tente novamente.');
      } else {
        setError('Não foi possível enviar o e-mail. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleBack() {
    router.back();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.themeToggleRow}>
        <ThemeToggle />
      </View>

      {/* Back button */}
      <Pressable
        style={styles.backButton}
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
      >
        <Ionicons name="arrow-back-outline" size={24} color={c.text} />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Esqueci minha senha</Text>
          {!submitted && (
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
            </Text>
          )}
        </View>

        {submitted ? (
          <SuccessView onBack={handleBack} />
        ) : (
          <Card style={styles.form} shadow="md">
            <TextInput
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              editable={!isLoading}
              error={error || undefined}
            />

            <Button
              label="Enviar link de redefinição"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              size="lg"
            />

            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Voltar para o login"
            >
              <Text style={[styles.link, { color: Colors.primary }]}>
                Voltar para o login
              </Text>
            </Pressable>
          </Card>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  themeToggleRow: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: Spacing.md,
  },
  link: {
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    paddingVertical: Spacing.xs,
    fontSize: FontSize.md,
  },
  // ─── Success state ──────────────────────────────────────────────────────────
  successIcon: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  successBody: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  successHint: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
  },
});
