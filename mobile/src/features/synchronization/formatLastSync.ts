/**
 * Formats the "última sincronização" timestamp for the sync screen.
 *
 * Returns a pt-BR date/time like "22/09/2026 às 18:42" for a valid ISO string,
 * or a friendly placeholder when the app has never synced successfully yet.
 * Kept pure (no Date.now dependency for formatting) so it is easy to test.
 */
export function formatLastSync(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'Nunca sincronizado';

  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return 'Nunca sincronizado';

  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}
