import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, TextInput } from '@/design-system';
import { useAuth } from '@/features/auth';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (validationError) {
      setError(validationError);
      return;
    }

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
          <TextInput
            label="Senha"
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
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
});
