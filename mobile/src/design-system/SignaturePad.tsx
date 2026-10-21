/**
 * SignaturePad — PBI-086
 *
 * Canvas de assinatura manuscrita sem dependências externas.
 * Usa PanResponder para capturar traços e os renderiza como segmentos de linha
 * com Views de posicionamento absoluto. A assinatura é serializada como SVG
 * (data URI base64) para persistência e envio ao servidor.
 *
 * Props:
 *   onSignatureChange(dataUri | null) — chamado sempre que o canvas muda.
 *     null = canvas vazio; string = SVG data URI (base64) quando há traços.
 *   strokeColor   — cor do traço (padrão: azul primário do projeto)
 *   strokeWidth   — espessura do traço em px (padrão: 2)
 *   height        — altura do canvas em dp (padrão: 180)
 *   disabled      — quando true, bloqueia novos traços
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useThemeColors } from '@/features/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

/** One continuous stroke (finger-down → finger-up). */
type Stroke = Point[];

export interface SignaturePadProps {
  onSignatureChange: (dataUri: string | null) => void;
  strokeColor?: string;
  strokeWidth?: number;
  height?: number;
  disabled?: boolean;
}

// ─── SVG serialisation ────────────────────────────────────────────────────────

/**
 * Converts all strokes into an SVG string, then base64-encodes it as a data URI.
 * The resulting string can be saved to disk (expo-file-system) or sent to the
 * API as-is.
 */
function strokesToSvgDataUri(
  strokes: Stroke[],
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

// ─── Component ────────────────────────────────────────────────────────────────

export function SignaturePad({
  onSignatureChange,
  strokeColor = Colors.primary,
  strokeWidth = 2,
  height = 180,
  disabled = false,
}: SignaturePadProps) {
  const c = useThemeColors();

  // All completed strokes
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // The stroke currently being drawn (in-flight)
  const currentStrokeRef = useRef<Stroke>([]);

  // Canvas dimensions (measured on layout)
  const canvasWidthRef = useRef<number>(0);
  const canvasHeightRef = useRef<number>(0);
  // Absolute position of the canvas on the screen (needed for coordinate offset)
  const canvasOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<View>(null);

  // Force re-render while the finger moves
  const [, forceUpdate] = useState(0);
  const tick = useCallback(() => forceUpdate((n) => n + 1), []);

  // ─── Notify parent ────────────────────────────────────────────────────────

  const notify = useCallback(
    (nextStrokes: Stroke[]) => {
      if (nextStrokes.length === 0) {
        onSignatureChange(null);
        return;
      }
      const w = canvasWidthRef.current || 300;
      const h = canvasHeightRef.current || height;
      onSignatureChange(strokesToSvgDataUri(nextStrokes, w, h, strokeColor, strokeWidth));
    },
    [onSignatureChange, height, strokeColor, strokeWidth],
  );

  // ─── PanResponder ─────────────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,

      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        const pt: Point = {
          x: pageX - canvasOffsetRef.current.x,
          y: pageY - canvasOffsetRef.current.y,
        };
        currentStrokeRef.current = [pt];
        tick();
      },

      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        const pt: Point = {
          x: pageX - canvasOffsetRef.current.x,
          y: pageY - canvasOffsetRef.current.y,
        };
        currentStrokeRef.current = [...currentStrokeRef.current, pt];
        tick();
      },

      onPanResponderRelease: () => {
        const finished = currentStrokeRef.current;
        currentStrokeRef.current = [];
        if (finished.length === 0) return;
        setStrokes((prev) => {
          const next = [...prev, finished];
          notify(next);
          return next;
        });
      },

      onPanResponderTerminate: () => {
        currentStrokeRef.current = [];
      },
    }),
  ).current;

  // ─── Layout ───────────────────────────────────────────────────────────────

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    canvasWidthRef.current = e.nativeEvent.layout.width;
    canvasHeightRef.current = e.nativeEvent.layout.height;
    // measure gives us the absolute on-screen position (needed because
    // nativeEvent.locationX/Y has quirks in some RN versions)
    canvasRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      canvasOffsetRef.current = { x: pageX, y: pageY };
    });
  }, []);

  // ─── Clear ────────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    currentStrokeRef.current = [];
    setStrokes([]);
    onSignatureChange(null);
  }, [onSignatureChange]);

  // ─── Render strokes ───────────────────────────────────────────────────────

  // All strokes (committed + in-flight) rendered as thin View-based segments.
  const allStrokes = [...strokes];
  if (currentStrokeRef.current.length > 0) {
    allStrokes.push(currentStrokeRef.current);
  }

  const isEmpty = strokes.length === 0 && currentStrokeRef.current.length === 0;

  return (
    <View style={styles.wrapper}>
      {/* Canvas area */}
      <View
        ref={canvasRef}
        style={[
          styles.canvas,
          {
            height,
            borderColor: disabled ? c.border : c.primary,
            backgroundColor: c.surface,
          },
        ]}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {/* Placeholder text */}
        {isEmpty && (
          <Text
            style={[styles.placeholder, { color: c.textSecondary }]}
            pointerEvents="none"
          >
            Assine aqui
          </Text>
        )}

        {/* Render each stroke as connected segments */}
        {allStrokes.map((stroke, si) =>
          stroke.slice(0, -1).map((pt, pi) => {
            const next = stroke[pi + 1];
            const dx = next.x - pt.x;
            const dy = next.y - pt.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length < 0.5) return null;
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            return (
              <View
                key={`${si}-${pi}`}
                pointerEvents="none"
                style={[
                  styles.segment,
                  {
                    width: length,
                    height: strokeWidth,
                    left: pt.x,
                    top: pt.y - strokeWidth / 2,
                    backgroundColor: strokeColor,
                    transform: [
                      { translateX: 0 },
                      { rotate: `${angle}deg` },
                      { translateX: 0 },
                    ],
                    transformOrigin: '0% 50%',
                  },
                ]}
              />
            );
          }),
        )}

        {/* Single-point dots */}
        {allStrokes.map((stroke, si) =>
          stroke.length === 1 ? (
            <View
              key={`dot-${si}`}
              pointerEvents="none"
              style={[
                styles.dot,
                {
                  width: strokeWidth * 2,
                  height: strokeWidth * 2,
                  borderRadius: strokeWidth,
                  left: stroke[0].x - strokeWidth,
                  top: stroke[0].y - strokeWidth,
                  backgroundColor: strokeColor,
                },
              ]}
            />
          ) : null,
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={clear}
          disabled={isEmpty || disabled}
          style={[
            styles.actionBtn,
            {
              borderColor: c.border,
              opacity: isEmpty || disabled ? 0.4 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Limpar assinatura"
        >
          <Text style={[styles.actionText, { color: c.textSecondary }]}>Limpar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  canvas: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    fontSize: FontSize.md,
  },
  segment: {
    position: 'absolute',
    borderRadius: 999,
  },
  dot: {
    position: 'absolute',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
