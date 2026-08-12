import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextInput } from '@/design-system';
import { useAuth } from '@/features/auth';
import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    try {
      await signIn(email, password);
      // Navigation is handled automatically by AuthGate in _layout.tsx
      // when isAuthenticated flips to true
    } catch {
      setError('Credenciais inválidas. Tente novamente.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>404 Field Ops</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="E-mail"
            placeholder="agente@empresa.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {!!error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}

          <Button
            label="Entrar"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontSize: FontSize.md,
    color: Colors.gray500,
  },
  form: { gap: Spacing.md },
  error: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    textAlign: 'center',
  },
});
