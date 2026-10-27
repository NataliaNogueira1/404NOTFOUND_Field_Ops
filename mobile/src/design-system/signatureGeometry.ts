/**
 * Pure, dependency-free geometry + serialisation helpers for the signature pad
 * (PBI-086 / bugfix PBI-322). Kept separate from SignaturePad.tsx so they can be
 * unit-tested in the fast Node jest project without the React Native runtime.
 */

export interface SignaturePoint {
  x: number;
  y: number;
}

/** One continuous stroke (finger-down → finger-up). */
export type SignatureStroke = SignaturePoint[];

/**
 * Converts all strokes into an SVG string, then base64-encodes it as a data URI.
 * Used for persistence/sync only — the backend and SQLite store this format.
 */
export function strokesToSvgDataUri(
  strokes: SignatureStroke[],
  width: number,
  height: number,
  strokeColor: string,
  strokeWidth: number,
): string {
  const paths = strokes
    .map((stroke) => {
      if (stroke.length === 0) return '';
      if (stroke.length === 1) {
        // Single tap → small filled circle
        const { x, y } = stroke[0];
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(strokeWidth / 2).toFixed(1)}" fill="${strokeColor}" />`;
      }
      const d = stroke
        .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
        .join(' ');
      return `<path d="${d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" />`;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${paths}\n</svg>`;
  // btoa is available in React Native's Hermes engine.
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
}

/**
 * Uniform scale factor that fits a drawing of `sourceWidth × sourceHeight` into
 * a `boxWidth × boxHeight` preview box while preserving the aspect ratio. Returns
 * 0 when any dimension is not positive (nothing to render yet).
 */
export function previewScale(
  sourceWidth: number,
  sourceHeight: number,
  boxWidth: number,
  boxHeight: number,
): number {
  if (sourceWidth <= 0 || sourceHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) return 0;
  return Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
}

/** Applies a uniform scale to every point of every stroke (preview rendering). */
export function scaleStrokes(strokes: SignatureStroke[], scale: number): SignatureStroke[] {
  return strokes.map((stroke) => stroke.map((pt) => ({ x: pt.x * scale, y: pt.y * scale })));
}
