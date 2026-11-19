/**
 * Issue #342 — Testes para o CancellationBanner.
 *
 * Verifica que o banner de cancelamento exibe o motivo, quem cancelou e a data
 * quando o status é CANCELED, e que o fallback "Motivo não informado" aparece
 * quando o motivo está ausente ou é uma string vazia/whitespace (alinhado com
 * o tratamento do web, que usa .trim()).
 */

import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/features/theme';
import { CancellationBanner } from '../Badges';

// Evita I/O do SecureStore quando ThemeProvider carrega a preferência salva.
jest.mock('@/infrastructure/storage/themeStorage', () => ({
  themeStorage: {
    getPreference: jest.fn().mockResolvedValue(null),
    savePreference: jest.fn().mockResolvedValue(undefined),
  },
}));

function renderBanner(props: {
  reason?: string;
  canceledBy?: string;
  canceledAt?: string;
}): ReturnType<typeof render> {
  const ui: ReactElement = (
    <ThemeProvider>
      <CancellationBanner {...props} />
    </ThemeProvider>
  );
  return render(ui);
}

describe('CancellationBanner', () => {
  it('exibe o título "Inspeção cancelada"', () => {
    const { getByText } = renderBanner({ reason: 'Equipamento inativo' });
    expect(getByText(/Inspeção cancelada/i)).toBeTruthy();
  });

  it('exibe o motivo quando fornecido', () => {
    const { getByText } = renderBanner({ reason: 'Equipamento inativo' });
    expect(getByText('Equipamento inativo')).toBeTruthy();
  });

  it('exibe "Motivo não informado" quando reason é undefined', () => {
    const { getByText } = renderBanner({});
    expect(getByText('Motivo não informado')).toBeTruthy();
  });

  it('exibe "Motivo não informado" quando reason é string vazia', () => {
    const { getByText } = renderBanner({ reason: '' });
    expect(getByText('Motivo não informado')).toBeTruthy();
  });

  it('exibe "Motivo não informado" quando reason é só whitespace (alinhamento com web)', () => {
    const { getByText } = renderBanner({ reason: '   ' });
    expect(getByText('Motivo não informado')).toBeTruthy();
  });

  it('exibe quem cancelou quando canceledBy é fornecido', () => {
    const { getByText } = renderBanner({ canceledBy: 'Marina Supervisora' });
    expect(getByText(/Cancelada por: Marina Supervisora/i)).toBeTruthy();
  });

  it('não exibe a linha "Cancelada por" quando canceledBy está ausente', () => {
    const { queryByText } = renderBanner({ reason: 'Motivo X' });
    expect(queryByText(/Cancelada por:/i)).toBeNull();
  });

  it('exibe a data quando canceledAt é fornecido', () => {
    const { getByText } = renderBanner({ canceledAt: '2026-10-10T14:00:00Z' });
    expect(getByText(/Data: 2026-10-10T14:00:00Z/i)).toBeTruthy();
  });

  it('não exibe a linha "Data" quando canceledAt está ausente', () => {
    const { queryByText } = renderBanner({ reason: 'Motivo X' });
    expect(queryByText(/^Data:/i)).toBeNull();
  });

  it('exibe todos os campos quando todos estão presentes', () => {
    const { getByText } = renderBanner({
      reason: 'Projeto encerrado',
      canceledBy: 'Admin Sistema',
      canceledAt: '2026-11-01T09:30:00Z',
    });
    expect(getByText('Projeto encerrado')).toBeTruthy();
    expect(getByText(/Cancelada por: Admin Sistema/i)).toBeTruthy();
    expect(getByText(/Data: 2026-11-01T09:30:00Z/i)).toBeTruthy();
  });
});
