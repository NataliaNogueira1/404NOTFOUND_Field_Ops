/**
 * Issue #256 — Testes unitários de `requestPasswordReset` (authApi)
 *
 * Cenários:
 *   1. Chamada POST com o endpoint e payload corretos.
 *   2. Resolve (sem erro) quando a API retorna 204 (sucesso).
 *   3. Resolve quando a API retorna 404 (e-mail não encontrado — server silencioso).
 *   4. Rejeita em erros de rede / 5xx.
 *   5. Rejeita em erros de validação (422).
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPost = jest.fn();
jest.mock('@/infrastructure/api/client', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import { requestPasswordReset } from '../authApi';

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requestPasswordReset', () => {
  it('chama POST /api/v1/auth/forgot-password com o e-mail informado', async () => {
    mockPost.mockResolvedValue(undefined);

    await requestPasswordReset('tecnico@fieldops.local');

    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/auth/forgot-password',
      { email: 'tecnico@fieldops.local' },
    );
  });

  it('resolve sem valor quando a API responde com sucesso (204)', async () => {
    mockPost.mockResolvedValue(undefined);

    await expect(requestPasswordReset('tecnico@fieldops.local')).resolves.toBeUndefined();
  });

  it('resolve sem erro quando a API retorna 404 (servidor silencioso)', async () => {
    mockPost.mockRejectedValue(new Error('API 404: Not Found'));

    await expect(requestPasswordReset('desconhecido@example.com')).resolves.toBeUndefined();
  });

  it('rejeita quando ocorre erro de rede', async () => {
    mockPost.mockRejectedValue(new Error('Network request failed'));

    await expect(requestPasswordReset('tecnico@fieldops.local')).rejects.toThrow(
      'Network request failed',
    );
  });

  it('rejeita quando a API retorna 500', async () => {
    mockPost.mockRejectedValue(new Error('API 500: Internal Server Error'));

    await expect(requestPasswordReset('tecnico@fieldops.local')).rejects.toThrow(
      'API 500',
    );
  });

  it('rejeita quando a API retorna 422 (validação)', async () => {
    mockPost.mockRejectedValue(new Error('API 422: Unprocessable Entity'));

    await expect(requestPasswordReset('invalid')).rejects.toThrow('API 422');
  });
});
