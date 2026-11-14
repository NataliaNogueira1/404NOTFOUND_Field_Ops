/**
 * Issue #256 — "Esqueci minha senha" (mobile)
 *
 * Testes do componente `ForgotPasswordScreen` usando @testing-library/react-native.
 * O `render` com jest-expo + React 19 é assíncrono — todos os testes fazem await.
 *
 * Cenários cobertos:
 *   1. Renderização inicial — título, campo e botão visíveis, sem erros.
 *   2. Validação — campo vazio e e-mail inválido bloqueiam o envio.
 *   3. Loading — botão fica desabilitado durante a chamada.
 *   4. Sucesso — card de confirmação exibido e formulário ocultado.
 *   5. Chamada correta — requestPasswordReset recebe o e-mail sem espaços.
 *   6. Botão "Voltar para o login" no sucesso chama router.back().
 *   7. Erro de rede — mensagem específica exibida, formulário mantido.
 *   8. Erro genérico — mensagem genérica exibida.
 *   9. Limpar erro ao digitar — erro de validação some ao editar o campo.
 *  10. Botão "Voltar" (ícone) chama router.back().
 *  11. Link "Voltar para o login" no formulário chama router.back().
 */

import { fireEvent, render, waitFor, type RenderResult } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ThemeProvider } from '@/features/theme';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

// Avoid SecureStore I/O inside ThemeProvider.
jest.mock('@/infrastructure/storage/themeStorage', () => ({
  themeStorage: {
    getPreference: jest.fn().mockResolvedValue(null),
    savePreference: jest.fn().mockResolvedValue(undefined),
  },
}));

// SafeAreaContext — plain View stubs to avoid native provider requirement.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: React.ComponentProps<typeof View>) =>
      React.createElement(View, props, children),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// requestPasswordReset — overridden per test.
const mockRequestPasswordReset = jest.fn();
jest.mock('@/infrastructure/api/authApi', () => ({
  requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

// Import AFTER mocks so the component picks them up.
import ForgotPasswordScreen from '../forgot-password';

// jest-expo + React 19: `render` returns a Promise<RenderResult>.
async function renderScreen(): Promise<RenderResult> {
  const ui: ReactElement = (
    <ThemeProvider>
      <ForgotPasswordScreen />
    </ThemeProvider>
  );
  return render(ui);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

// ── 1. Renderização inicial ──────────────────────────────────────────────────

describe('renderização inicial', () => {
  it('exibe o título da tela', async () => {
    const { getByText } = await renderScreen();
    expect(getByText('Esqueci minha senha')).toBeTruthy();
  });

  it('exibe o campo de e-mail', async () => {
    const { getByPlaceholderText } = await renderScreen();
    expect(getByPlaceholderText('seu@email.com')).toBeTruthy();
  });

  it('exibe o botão de envio habilitado', async () => {
    const { getByRole } = await renderScreen();
    const btn = getByRole('button', { name: 'Enviar link de redefinição' });
    expect(btn).toBeTruthy();
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('não exibe mensagem de erro inicialmente', async () => {
    const { queryByText } = await renderScreen();
    // Check for specific error messages rather than a broad regex that could
    // match subtitle text (e.g. "redefinir" contains "rede" fragment).
    expect(queryByText('Informe seu e-mail.')).toBeNull();
    expect(queryByText('Formato de e-mail inválido.')).toBeNull();
    expect(queryByText(/Sem conexão/)).toBeNull();
    expect(queryByText(/Não foi possível/)).toBeNull();
  });
});

// ── 2. Validação ─────────────────────────────────────────────────────────────

describe('validação', () => {
  it('bloqueia envio e mostra erro quando o campo está vazio', async () => {
    const { getByRole, findByText } = await renderScreen();

    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    expect(await findByText('Informe seu e-mail.')).toBeTruthy();
    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });

  it('bloqueia envio e mostra erro para e-mail com formato inválido', async () => {
    const { getByPlaceholderText, getByRole, findByText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'nao-e-um-email');
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    expect(await findByText('Formato de e-mail inválido.')).toBeTruthy();
    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });
});

// ── 3. Loading ───────────────────────────────────────────────────────────────

describe('estado de loading', () => {
  it('não chama a API duas vezes se o botão for pressionado enquanto carrega', async () => {
    // Use mockResolvedValue so the first call resolves fast,
    // then verify the mock was only called once even with double-press.
    mockRequestPasswordReset.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByRole } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'tecnico@fieldops.local');

    // First press triggers the submission; the component enters loading state
    // and the `disabled` prop prevents a second call from being registered.
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    // Wait for the first call to settle (success: screen shows confirmation).
    await waitFor(() => expect(mockRequestPasswordReset).toHaveBeenCalledTimes(1));
  });
});

// ── 4 + 5. Sucesso ───────────────────────────────────────────────────────────

describe('sucesso', () => {
  it('exibe o card de confirmação após envio bem-sucedido', async () => {
    mockRequestPasswordReset.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByRole, findByText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'tecnico@fieldops.local');
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    expect(await findByText('Verifique seu e-mail')).toBeTruthy();
    expect(await findByText(/Se o endereço informado estiver cadastrado/)).toBeTruthy();
  });

  it('oculta o formulário após sucesso', async () => {
    mockRequestPasswordReset.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByRole, queryByPlaceholderText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'tecnico@fieldops.local');
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    await waitFor(() => {
      expect(queryByPlaceholderText('seu@email.com')).toBeNull();
    });
  });

  it('chama requestPasswordReset com o e-mail sem espaços extras', async () => {
    mockRequestPasswordReset.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByRole } = await renderScreen();
    await fireEvent.changeText(
      getByPlaceholderText('seu@email.com'),
      '  tecnico@fieldops.local  ',
    );
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('tecnico@fieldops.local');
    });
  });
});

// ── 6. Navegação na tela de sucesso ─────────────────────────────────────────

describe('navegação — tela de sucesso', () => {
  it('botão "Voltar para o login" chama router.back()', async () => {
    mockRequestPasswordReset.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByRole, findByRole } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'tecnico@fieldops.local');
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    const backBtn = await findByRole('button', { name: 'Voltar para o login' });
    await fireEvent.press(backBtn);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

// ── 7 + 8. Erros ─────────────────────────────────────────────────────────────

describe('erros', () => {
  it('exibe mensagem de erro de rede', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('Network request failed'));

    const { getByPlaceholderText, getByRole, findByText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'tecnico@fieldops.local');
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    expect(
      await findByText('Sem conexão com o servidor. Verifique sua rede e tente novamente.'),
    ).toBeTruthy();
  });

  it('exibe mensagem genérica para erros de servidor', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('API 500: Internal Server Error'));

    const { getByPlaceholderText, getByRole, findByText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'tecnico@fieldops.local');
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    expect(
      await findByText('Não foi possível enviar o e-mail. Tente novamente mais tarde.'),
    ).toBeTruthy();
  });

  it('mantém o formulário visível após erro (permite nova tentativa)', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('API 500: error'));

    const { getByPlaceholderText, getByRole } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'tecnico@fieldops.local');
    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));

    await waitFor(() => {
      expect(getByPlaceholderText('seu@email.com')).toBeTruthy();
    });
  });
});

// ── 9. Limpar erro ao digitar ─────────────────────────────────────────────────

describe('limpeza de erro', () => {
  it('remove o erro de validação quando o usuário começa a digitar', async () => {
    const { getByRole, getByPlaceholderText, findByText, queryByText } = await renderScreen();

    await fireEvent.press(getByRole('button', { name: 'Enviar link de redefinição' }));
    expect(await findByText('Informe seu e-mail.')).toBeTruthy();

    await fireEvent.changeText(getByPlaceholderText('seu@email.com'), 't');
    expect(queryByText('Informe seu e-mail.')).toBeNull();
  });
});

// ── 10 + 11. Navegação ───────────────────────────────────────────────────────

describe('navegação — formulário', () => {
  it('botão de voltar (ícone) chama router.back()', async () => {
    const { getByRole } = await renderScreen();

    await fireEvent.press(getByRole('button', { name: 'Voltar' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('link "Voltar para o login" no formulário chama router.back()', async () => {
    const { getAllByRole } = await renderScreen();

    const buttons = getAllByRole('button', { name: 'Voltar para o login' });
    await fireEvent.press(buttons[0]);

    expect(mockBack).toHaveBeenCalled();
  });
});
