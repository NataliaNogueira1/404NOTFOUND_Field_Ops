/**
 * Formatting helpers for the human-readable inspection identifier (PBI #337).
 *
 * Inspection ids are full UUID strings. Showing the whole UUID on cards and
 * detail rows pollutes the layout, so we display a short, stable prefix that is
 * still enough for a technician/supervisor to reference an inspection.
 */

/** Number of leading UUID characters kept in the abbreviated form. */
export const SHORT_INSPECTION_ID_LENGTH = 8;

/**
 * Returns a short, readable inspection id (e.g. `#a1b2c3d4`).
 *
 * - Keeps the first {@link SHORT_INSPECTION_ID_LENGTH} characters of the UUID.
 * - Ids shorter than that (or non-UUID/sequential ids) are shown as-is.
 * - Returns an empty string for a missing id so callers can render nothing.
 */
export function formatInspectionId(id: string | undefined | null): string {
  if (!id) return '';
  const trimmed = id.trim();
  if (trimmed.length === 0) return '';
  const short =
    trimmed.length > SHORT_INSPECTION_ID_LENGTH
      ? trimmed.slice(0, SHORT_INSPECTION_ID_LENGTH)
      : trimmed;
  return `#${short}`;
}
