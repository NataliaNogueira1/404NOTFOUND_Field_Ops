/**
 * PBI-322 — signature geometry helpers.
 *
 * Covers the pure logic behind the two reported bugs:
 *  - the SVG serialisation used for persistence/preview fidelity;
 *  - the aspect-preserving preview scaling that replaced the broken
 *    <Image>+SVG preview (which did not render in Expo Go).
 * Runs in the fast Node jest project (no React Native runtime needed).
 */

import {
  previewScale,
  scaleStrokes,
  strokesToSvgDataUri,
  type SignatureStroke,
} from '@/design-system/signatureGeometry';

function decode(dataUri: string): string {
  const base64 = dataUri.replace(/^data:image\/svg\+xml;base64,/, '');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

describe('strokesToSvgDataUri', () => {
  it('produces an SVG data URI sized to the canvas viewBox', () => {
    const strokes: SignatureStroke[] = [[{ x: 0, y: 0 }, { x: 10, y: 10 }]];
    const svg = decode(strokesToSvgDataUri(strokes, 300, 180, '#000', 2));
    expect(svg).toContain('viewBox="0 0 300 180"');
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="180"');
  });

  it('renders a multi-point stroke as a path', () => {
    const strokes: SignatureStroke[] = [[{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }]];
    const svg = decode(strokesToSvgDataUri(strokes, 100, 100, '#111', 2))
    expect(svg).toContain('<path')
    expect(svg).toContain('M1.0 2.0 L3.0 4.0 L5.0 6.0')
  });

  it('renders a single tap as a dot (circle)', () => {
    const strokes: SignatureStroke[] = [[{ x: 7, y: 8 }]];
    const svg = decode(strokesToSvgDataUri(strokes, 100, 100, '#222', 4));
    expect(svg).toContain('<circle')
    expect(svg).toContain('cx="7.0"')
    expect(svg).toContain('cy="8.0"')
  });
});

describe('previewScale', () => {
  it('fits the drawing into the box preserving aspect ratio (width-bound)', () => {
    // 300x180 into 150x200 → min(0.5, 1.11) = 0.5
    expect(previewScale(300, 180, 150, 200)).toBeCloseTo(0.5);
  });

  it('fits the drawing into the box preserving aspect ratio (height-bound)', () => {
    // 300x180 into 600x60 → min(2, 0.333) = 0.333
    expect(previewScale(300, 180, 600, 60)).toBeCloseTo(60 / 180);
  });

  it('returns 0 when any dimension is non-positive', () => {
    expect(previewScale(0, 180, 150, 80)).toBe(0);
    expect(previewScale(300, 180, 0, 80)).toBe(0);
    expect(previewScale(300, 180, 150, 0)).toBe(0);
  });
});

describe('scaleStrokes', () => {
  it('scales every point of every stroke', () => {
    const strokes: SignatureStroke[] = [
      [{ x: 10, y: 20 }, { x: 30, y: 40 }],
      [{ x: 100, y: 50 }],
    ];
    expect(scaleStrokes(strokes, 0.5)).toEqual([
      [{ x: 5, y: 10 }, { x: 15, y: 20 }],
      [{ x: 50, y: 25 }],
    ]);
  });

  it('is a no-op at scale 1', () => {
    const strokes: SignatureStroke[] = [[{ x: 3, y: 4 }]];
    expect(scaleStrokes(strokes, 1)).toEqual(strokes);
  });
});
