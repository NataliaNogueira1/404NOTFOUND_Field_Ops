import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';

import { Button, Card, TextInput } from '@/design-system';
import { useAuth } from '@/features/auth';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/config/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// ─── Password field with visibility toggle ────────────────────────────────────

/**
 * Renders a labelled password input whose border colour matches the design
 * system TextInput and has an Ionicons eye/eye-off toggle aligned to the
 * vertical centre of the input box.
 */
function PasswordInput({
  value,
  onChangeText,
  showPassword,
  onToggle,
}: {
  value: string;
  onChangeText: (v: string) => void;
  showPassword: boolean;
  onToggle: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const iconColor = focused ? Colors.primary : Colors.gray300;

  return (
    <View style={styles.passwordWrapper}>
      <Text style={styles.passwordLabel}>Senha</Text>
      {/* Row: native TextInput fills the space, icon sits at the right */}
      <View style={[styles.passwordRow, focused && styles.passwordRowFocused]}>
        <RNTextInput
          style={styles.passwordInput}
          placeholder="Senha"
          placeholderTextColor={Colors.gray400}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoComplete="password"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel="Senha"
        />
        <Pressable
          style={styles.eyeButton}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          hitSlop={8}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={iconColor}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function validate(): string | null {
    if (!email.trim() || !password) return 'Preencha e-mail e senha.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Formato de e-mail inválido.';
    if (password.length < MIN_PASSWORD_LENGTH) return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
    return null;
  }

  async function handleLogin() {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    try {
      await signIn(email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401')) {
        setError('E-mail ou senha incorretos.');
      } else if (message.includes('Network') || message.includes('fetch')) {
        setError('Sem conexão com o servidor. Verifique sua rede.');
      } else {
        setError('Erro ao realizar login. Tente novamente.');
      }
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>F</Text></View>
        <Text style={styles.title}>FieldOps</Text>
        <Text style={styles.subtitle}>Plataforma de Inspeção</Text>
        <Card style={styles.form} shadow="md">
          <TextInput
            label="E-mail"
            placeholder="tecnico@fieldops.local"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            showPassword={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button label="Entrar" onPress={handleLogin} loading={isLoading} fullWidth size="lg" />
          <Pressable><Text style={styles.link}>Esqueceu a senha?</Text></Pressable>
        </Card>
        <Text style={styles.version}>Versão 1.0.0</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  brandMark: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.primary, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  brandMarkText: { color: Colors.white, fontSize: 34, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  subtitle: { marginTop: Spacing.xs, fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  error: { fontSize: FontSize.sm, color: Colors.danger, textAlign: 'center' },
  link: { color: Colors.primary, fontWeight: FontWeight.semibold, textAlign: 'center', paddingVertical: Spacing.xs },
  version: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.xs },
  // ─── PasswordInput ─────────────────────────────────────────────────────────
  passwordWrapper: { gap: Spacing.xs },
  passwordLabel: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.gray700 },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',          // vertically centres input text and icon
    height: 44,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  passwordRowFocused: { borderColor: Colors.primary },
  passwordInput: {
    flex: 1,                        // fills available width, leaving room for icon
    height: '100%',
    fontSize: FontSize.md,
    color: Colors.gray900,
    paddingRight: Spacing.sm,      // keeps text from running under the icon
  },
  eyeButton: {
    padding: 4,                    // tap-friendly without pushing the icon off-centre
  },
});
