/**
 * Formats a backend date for display in Brazilian Portuguese (dd/mm/yyyy).
 *
 * Backend dates arrive as ISO 8601 strings. A date-only value (YYYY-MM-DD) is
 * formatted without timezone conversion, because `new Date('2026-10-19')` is
 * parsed as UTC midnight and would roll back a day in negative offsets such as
 * America/Sao_Paulo (UTC-3). Full timestamps keep their instant and are
 * localized normally. Empty or unparseable values fall back to a dash.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '-'

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoString)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return `${day}/${month}/${year}`
  }

  const parsed = new Date(isoString)
  if (Number.isNaN(parsed.getTime())) return isoString
  return parsed.toLocaleDateString('pt-BR')
}
