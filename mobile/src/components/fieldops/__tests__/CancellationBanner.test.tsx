/**
 * Issue #342 — Testes para o CancellationBanner.
 *
 * Verifica que o banner de cancelamento exibe o motivo, quem cancelou e a data
 * quando o status é CANCELED, e que o fallback "Motivo não informado" aparece
 * quando o motivo está ausente ou é uma string vazia/whitespace (alinhado com
 * o tratamento do web, que usa .trim()).
 */

import { render, type RenderResult } from '@testing-library/react-native';
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

// RNTL v14 renderiza de forma assíncrona sob React 19: `render` resolve para as queries.
function renderBanner(props: {
  reason?: string;
  canceledBy?: string;
  canceledAt?: string;
}): Promise<RenderResult> {
  const ui: ReactElement = (
    <ThemeProvider>
      <CancellationBanner {...props} />
    </ThemeProvider>
  );
  return render(ui);
}

describe('CancellationBanner', () => {
  it('exibe o título "Inspeção cancelada"', async () => {
    const { getByText } = await renderBanner({ reason: 'Equipamento inativo' });
    expect(getByText(/Inspeção cancelada/i)).toBeTruthy();
  });

  it('exibe o motivo quando fornecido', async () => {
    const { getByText } = await renderBanner({ reason: 'Equipamento inativo' });
    expect(getByText('Equipamento inativo')).toBeTruthy();
  });

  it('exibe "Motivo não informado" quando reason é undefined', async () => {
    const { getByText } = await renderBanner({});
    expect(getByText('Motivo não informado')).toBeTruthy();
  });

  it('exibe "Motivo não informado" quando reason é string vazia', async () => {
    const { getByText } = await renderBanner({ reason: '' });
    expect(getByText('Motivo não informado')).toBeTruthy();
  });

  it('exibe "Motivo não informado" quando reason é só whitespace (alinhamento com web)', async () => {
    const { getByText } = await renderBanner({ reason: '   ' });
    expect(getByText('Motivo não informado')).toBeTruthy();
  });

  it('exibe quem cancelou quando canceledBy é fornecido', async () => {
    const { getByText } = await renderBanner({ canceledBy: 'Marina Supervisora' });
    expect(getByText(/Cancelada por: Marina Supervisora/i)).toBeTruthy();
  });

  it('não exibe a linha "Cancelada por" quando canceledBy está ausente', async () => {
    const { queryByText } = await renderBanner({ reason: 'Motivo X' });
    expect(queryByText(/Cancelada por:/i)).toBeNull();
  });

  it('exibe a data quando canceledAt é fornecido', async () => {
    const { getByText } = await renderBanner({ canceledAt: '2026-10-10T14:00:00Z' });
    expect(getByText(/Data: 2026-10-10T14:00:00Z/i)).toBeTruthy();
  });

  it('não exibe a linha "Data" quando canceledAt está ausente', async () => {
    const { queryByText } = await renderBanner({ reason: 'Motivo X' });
    expect(queryByText(/^Data:/i)).toBeNull();
  });

  it('exibe todos os campos quando todos estão presentes', async () => {
    const { getByText } = await renderBanner({
      reason: 'Projeto encerrado',
      canceledBy: 'Admin Sistema',
      canceledAt: '2026-11-01T09:30:00Z',
    });
    expect(getByText('Projeto encerrado')).toBeTruthy();
    expect(getByText(/Cancelada por: Admin Sistema/i)).toBeTruthy();
    expect(getByText(/Data: 2026-11-01T09:30:00Z/i)).toBeTruthy();
  });
});
