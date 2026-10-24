/**
 * Motivational phrases rotated on the login screen (PBI-274).
 *
 * Centralized next to the LoginPage so the list is easy to edit without
 * touching the component. Mirrors the mobile list to keep both platforms in sync.
 */
export const LOGIN_PHRASES: readonly string[] = [
  'Transforme inspeções de campo em decisões confiáveis',
  'Tudo pronto para sua próxima inspeção',
  'Registro preciso, resultado garantido',
  'Do campo ao relatório, tudo em um lugar',
  'Inspeções mais rápidas, times mais eficientes',
] as const

/** Interval between phrase changes, in milliseconds (~4s per PBI-274). */
export const LOGIN_PHRASE_INTERVAL_MS = 4000
