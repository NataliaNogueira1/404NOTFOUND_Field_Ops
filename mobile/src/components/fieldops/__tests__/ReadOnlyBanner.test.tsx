/**
 * Issue #273 — Testes para o ReadOnlyBanner.
 *
 * Verifica que o banner de somente-leitura exibe a mensagem correta
 * para cada estado de inspeção (SUBMITTED, UNDER_REVIEW e APPROVED),
 * e que não renderiza nada para estados que não exigem o banner.
 */

import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/features/theme';
import { InspectionStatus } from '@/features/fieldops';
import { ReadOnlyBanner } from '../Badges';

// Evita I/O do SecureStore quando ThemeProvider carrega a preferência salva.
jest.mock('@/infrastructure/storage/themeStorage', () => ({
  themeStorage: {
    getPreference: jest.fn().mockResolvedValue(null),
    savePreference: jest.fn().mockResolvedValue(undefined),
  },
}));

function renderBanner(status: InspectionStatus): Promise<ReturnType<typeof render>> {
  const ui: ReactElement = (
    <ThemeProvider>
      <ReadOnlyBanner status={status} />
    </ThemeProvider>
  );
  return render(ui);
}

describe('ReadOnlyBanner', () => {
  it('exibe banner de "Inspeção enviada" para o estado SUBMITTED', async () => {
    const { getByText } = await renderBanner(InspectionStatus.SUBMITTED);
    expect(getByText(/Inspeção enviada/i)).toBeTruthy();
    expect(getByText(/aguarda revisão do supervisor/i)).toBeTruthy();
  });

  it('exibe banner de "Em revisão" para o estado UNDER_REVIEW', async () => {
    const { getByText } = await renderBanner(InspectionStatus.UNDER_REVIEW);
    expect(getByText(/Em revisão/i)).toBeTruthy();
    expect(getByText(/sendo revisada pelo supervisor/i)).toBeTruthy();
  });

  it('exibe banner de "Inspeção aprovada" para o estado APPROVED', async () => {
    const { getByText } = await renderBanner(InspectionStatus.APPROVED);
    expect(getByText(/Inspeção aprovada/i)).toBeTruthy();
    expect(getByText(/protegidos contra alterações/i)).toBeTruthy();
  });

  it('não renderiza nada para estados sem banner (IN_PROGRESS)', async () => {
    const { toJSON } = await renderBanner(InspectionStatus.IN_PROGRESS);
    expect(toJSON()).toBeNull();
  });

  it('não renderiza nada para o estado REJECTED', async () => {
    const { toJSON } = await renderBanner(InspectionStatus.REJECTED);
    expect(toJSON()).toBeNull();
  });
});
