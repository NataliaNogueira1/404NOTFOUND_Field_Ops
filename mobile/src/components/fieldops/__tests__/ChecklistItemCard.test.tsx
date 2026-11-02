/**
 * PBI-065 (#85) — Component tests for the dynamic checklist card (flow C).
 *
 * These exercise the REAL `ChecklistItemCard` through @testing-library/react-native,
 * asserting visible behavior (rendered controls, placeholders, the `onAnswer`
 * callback and the observation field) for several response types. Internals such
 * as the debounce hook are not asserted directly — only what the technician sees
 * and the value handed back to the screen.
 */

import { fireEvent, render, type RenderResult } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/features/theme';
import {
  ResponseType,
  type ChecklistAnswer,
  type ChecklistValue,
  type TemplateItem,
} from '@/features/fieldops';

// expo-router: only used by the "Adicionar foto" button on failures — keep deterministic.
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Avoid native SecureStore I/O when ThemeProvider loads the saved preference.
jest.mock('@/infrastructure/storage/themeStorage', () => ({
  themeStorage: {
    getPreference: jest.fn().mockResolvedValue(null),
    savePreference: jest.fn().mockResolvedValue(undefined),
  },
}));

const INSPECTION_ID = 'insp-1';

function makeItem(overrides: Partial<TemplateItem> = {}): TemplateItem {
  return {
    id: 'item-1',
    question: 'O equipamento está em boas condições?',
    responseType: ResponseType.CONFORMITY,
    required: true,
    requireObservationOnFailure: false,
    requireEvidenceOnFailure: false,
    ...overrides,
  };
}

// RNTL v14 renders asynchronously under React 19, so `render` resolves to the queries.
function renderCard(
  item: TemplateItem,
  onAnswer: (value: ChecklistValue, observation?: string) => void,
  answer?: ChecklistAnswer,
  readOnly?: boolean,
): Promise<RenderResult> {
  const ui: ReactElement = (
    <ThemeProvider>
      <ChecklistItemCardWithProps item={item} onAnswer={onAnswer} answer={answer} readOnly={readOnly} />
    </ThemeProvider>
  );
  return render(ui);
}

// Thin wrapper so each test only passes what it cares about.
function ChecklistItemCardWithProps({
  item,
  onAnswer,
  answer,
  readOnly,
}: {
  item: TemplateItem;
  onAnswer: (value: ChecklistValue, observation?: string) => void;
  answer?: ChecklistAnswer;
  readOnly?: boolean;
}): ReactElement {
  return (
    <ChecklistItemCard
      item={item}
      index={1}
      inspectionId={INSPECTION_ID}
      answer={answer}
      evidences={[]}
      onAnswer={onAnswer}
      readOnly={readOnly}
    />
  );
}

// Imported after the mocks above so the component picks them up.
import { ChecklistItemCard } from '../ChecklistItemCard';

describe('ChecklistItemCard', () => {
  it('shows the numbered question with a required marker', async () => {
    const { getByText } = await renderCard(makeItem(), jest.fn());

    expect(getByText('1. O equipamento está em boas condições? *')).toBeTruthy();
  });

  describe('CONFORMITY', () => {
    it('renders the three conformity options', async () => {
      const { getByText } = await renderCard(
        makeItem({ responseType: ResponseType.CONFORMITY }),
        jest.fn(),
      );

      expect(getByText('Conforme')).toBeTruthy();
      expect(getByText('Não conforme')).toBeTruthy();
      expect(getByText('N/A')).toBeTruthy();
    });

    it('calls onAnswer with CONFORME when "Conforme" is tapped', async () => {
      const onAnswer = jest.fn();
      const { getByText } = await renderCard(
        makeItem({ responseType: ResponseType.CONFORMITY }),
        onAnswer,
      );

      await fireEvent.press(getByText('Conforme'));

      expect(onAnswer).toHaveBeenCalledWith('CONFORME', undefined);
    });
  });

  describe('BOOLEAN', () => {
    it('renders the "Sim"/"Não" options', async () => {
      const { getByText } = await renderCard(
        makeItem({ responseType: ResponseType.BOOLEAN }),
        jest.fn(),
      );

      expect(getByText('Sim')).toBeTruthy();
      expect(getByText('Não')).toBeTruthy();
    });

    it('calls onAnswer with true when "Sim" is tapped', async () => {
      const onAnswer = jest.fn();
      const { getByText } = await renderCard(
        makeItem({ responseType: ResponseType.BOOLEAN }),
        onAnswer,
      );

      await fireEvent.press(getByText('Sim'));

      expect(onAnswer).toHaveBeenCalledWith(true, undefined);
    });
  });

  describe('NUMBER', () => {
    it('renders the numeric input with its placeholder', async () => {
      const { getByPlaceholderText } = await renderCard(
        makeItem({ responseType: ResponseType.NUMBER }),
        jest.fn(),
      );

      expect(getByPlaceholderText('Informe o valor')).toBeTruthy();
    });

    it('flushes the parsed number to onAnswer on blur', async () => {
      const onAnswer = jest.fn();
      const { getByPlaceholderText } = await renderCard(
        makeItem({ responseType: ResponseType.NUMBER }),
        onAnswer,
      );

      const input = getByPlaceholderText('Informe o valor');
      await fireEvent.changeText(input, '42');
      await fireEvent(input, 'blur');

      expect(onAnswer).toHaveBeenCalledWith(42, undefined);
    });
  });

  describe('observation field', () => {
    it('is hidden while the item has no answer', async () => {
      const { queryByPlaceholderText } = await renderCard(
        makeItem({ responseType: ResponseType.CONFORMITY }),
        jest.fn(),
      );

      expect(
        queryByPlaceholderText('Adicione uma observação sobre este item'),
      ).toBeNull();
    });

    it('appears once the item is answered and forwards the observation on blur', async () => {
      const onAnswer = jest.fn();
      const answer: ChecklistAnswer = {
        itemId: 'item-1',
        value: 'CONFORME',
        savedAt: '2026-01-01T00:00:00Z',
      };
      const { getByPlaceholderText } = await renderCard(
        makeItem({ responseType: ResponseType.CONFORMITY }),
        onAnswer,
        answer,
      );

      const observation = getByPlaceholderText(
        'Adicione uma observação sobre este item',
      );
      await fireEvent.changeText(observation, 'Pequeno desgaste na pintura');
      await fireEvent(observation, 'blur');

      expect(onAnswer).toHaveBeenCalledWith('CONFORME', 'Pequeno desgaste na pintura');
    });
  });

  // #273/#277: the technician can open the filled checklist for SUBMITTED/UNDER_REVIEW/APPROVED
  // inspections in read-only mode — the saved answer and observation are visible, but nothing is
  // editable and no save is ever triggered.
  describe('read-only (#273/#277)', () => {
    const answeredConformity: ChecklistAnswer = {
      itemId: 'item-1',
      value: 'CONFORME',
      observation: 'Tudo certo na vistoria',
      savedAt: '2026-01-01T00:00:00Z',
    };

    it('shows the saved answer and hides the non-selected options', async () => {
      const { getByText, queryByText } = await renderCard(
        makeItem({ responseType: ResponseType.CONFORMITY }),
        jest.fn(),
        answeredConformity,
        true,
      );

      // Only the chosen option remains visible; the alternatives are not rendered.
      expect(getByText('Conforme')).toBeTruthy();
      expect(queryByText('Não conforme')).toBeNull();
      expect(queryByText('N/A')).toBeNull();
    });

    it('does not call onAnswer when a locked option is tapped', async () => {
      const onAnswer = jest.fn();
      const { getByText } = await renderCard(
        makeItem({ responseType: ResponseType.CONFORMITY }),
        onAnswer,
        answeredConformity,
        true,
      );

      await fireEvent.press(getByText('Conforme'));

      expect(onAnswer).not.toHaveBeenCalled();
    });

    it('shows the saved observation but keeps the field non-editable', async () => {
      const { getByDisplayValue } = await renderCard(
        makeItem({ responseType: ResponseType.CONFORMITY }),
        jest.fn(),
        answeredConformity,
        true,
      );

      const observation = getByDisplayValue('Tudo certo na vistoria');
      expect(observation.props.editable).toBe(false);
    });

    it('hides the "Adicionar foto" button on a non-conformity in read-only mode', async () => {
      const failureAnswer: ChecklistAnswer = {
        itemId: 'item-1',
        value: 'NAO_CONFORME',
        observation: 'Vazamento identificado',
        savedAt: '2026-01-01T00:00:00Z',
      };
      const { queryByText } = await renderCard(
        makeItem({ responseType: ResponseType.CONFORMITY, requireEvidenceOnFailure: true }),
        jest.fn(),
        failureAnswer,
        true,
      );

      expect(queryByText('Adicionar foto')).toBeNull();
    });

    it('keeps the number input non-editable while showing its saved value', async () => {
      const numberAnswer: ChecklistAnswer = {
        itemId: 'item-1',
        value: 42,
        savedAt: '2026-01-01T00:00:00Z',
      };
      const { getByDisplayValue } = await renderCard(
        makeItem({ responseType: ResponseType.NUMBER }),
        jest.fn(),
        numberAnswer,
        true,
      );

      const input = getByDisplayValue('42');
      expect(input.props.editable).toBe(false);
    });
  });
});
