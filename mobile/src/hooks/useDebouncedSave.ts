import { useCallback, useEffect, useRef, useState } from 'react';

import { ResponseType, type ChecklistValue } from '@/features/fieldops/types';

export type SaveStatus = 'idle' | 'saving' | 'saved';

const DEBOUNCE_MS = 500;
const SAVED_DISPLAY_MS = 2000;

/**
 * Tipos que usam debounce (campos de digitação livre).
 */
const DEBOUNCED_TYPES = new Set<string>([
  ResponseType.TEXT_SHORT,
  ResponseType.TEXT_LONG,
  ResponseType.NUMBER,
]);

interface UseDebouncedSaveOptions {
  responseType: ResponseType;
  onSave: (value: ChecklistValue, observation?: string) => void;
}

/**
 * Hook que aplica debounce de 500ms para campos de texto/número
 * e salvamento imediato para seleções (BOOLEAN, CONFORMITY, SINGLE_CHOICE, DATE).
 *
 * Retorna o status do salvamento para feedback visual.
 */
export function useDebouncedSave({ responseType, onSave }: UseDebouncedSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldDebounce = DEBOUNCED_TYPES.has(responseType);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const showSaved = useCallback(() => {
    setStatus('saved');
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => {
      setStatus('idle');
    }, SAVED_DISPLAY_MS);
  }, []);

  /**
   * Call this whenever the user changes a value.
   * - For text/number: debounces 500ms, shows "Salvando..." during wait
   * - For selections: saves immediately
   */
  const save = useCallback(
    (value: ChecklistValue, observation?: string) => {
      if (shouldDebounce) {
        // Show "Salvando..." immediately
        setStatus('saving');

        // Clear previous timer
        if (timerRef.current) clearTimeout(timerRef.current);

        // Set new debounce timer
        timerRef.current = setTimeout(() => {
          onSave(value, observation);
          showSaved();
        }, DEBOUNCE_MS);
      } else {
        // Immediate save for selections
        setStatus('saving');
        onSave(value, observation);
        // Brief "saving" then "saved"
        requestAnimationFrame(() => {
          showSaved();
        });
      }
    },
    [onSave, shouldDebounce, showSaved],
  );

  /**
   * Force immediate save (useful for observations on blur).
   */
  const flush = useCallback(
    (value: ChecklistValue, observation?: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setStatus('saving');
      onSave(value, observation);
      showSaved();
    },
    [onSave, showSaved],
  );

  return { status, save, flush };
}
