/**
 * SignatureCanvas — PBI-086
 *
 * A freehand signature pad built with PanResponder and a pure React Native
 * canvas (no external drawing libraries required). Strokes are stored as
 * arrays of {x, y} points and rendered as thin rectangular segments so the
 * component works in Expo Go without a native rebuild.
 *
 * Props
 * ─────
 * onSignatureChange(base64 | null)
 *   Called whenever the drawing changes. Receives a lightweight base64-like
 *   JSON representation of the strokes so the parent can detect "has content"
 *   and persist the data. Pass `null` when the canvas is cleared.
 *
 * strokeColor   — line colour (default: '#0F172A')
 * strokeWidth   — line thickness in px (default: 2)
 * height        — canvas height (default: 180)
 * disabled      — when true, gestures are ignored (e.g. after confirmation)
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PanResponderGestureState,
  type GestureResponderEvent,
} from 'react-native';

import { BorderRadius, Colors, FontSize, Spacing } from '@/config/theme';
import { useThemeColors } from '@/features/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

type Stroke = Point[];

interface SignatureCanvasProps {
  onSignatureChange: (data: string | null) => void;
  strokeColor?: string;
  strokeWidth?: number;
  height?: number;
  disabled?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Encode strokes as a compact JSON string that serves as the "base64"
 * representation stored in SQLite. It carries enough information to:
 *  - detect whether the canvas has content (length > 0 strokes with points)
 *  - re-render a preview if needed in the future
 *  - be sent to the server as-is or converted to a real PNG later
 */
function encodeStrokes(strokes: Stroke[]): string {
  const meaningful = strokes.filter((s) => s.length > 1);
  return JSON.stringify(meaningful);
}

/**
 * Interpolate extra points between two points so fast gestures don't leave
 * gaps in the stroke. Returns a list of intermediate points (exclusive of p1).
 */
function interpolate(p1: Point, p2: Point, steps = 4): Point[] {
  const pts: Point[] = [];
  for (let i = 1; i <= steps; i++) {
    pts.push({
      x: p1.x + ((p2.x - p1.x) * i) / steps,
      y: p1.y + ((p2.y - p1.y) * i) / steps,
    });
  }
  return pts;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SignatureCanvas({
  onSignatureChange,
  strokeColor = Colors.text,
  strokeWidth = 2,
  height = 180,
  disabled = false,
}: SignatureCanvasProps) {
  const c = useThemeColors();

  // All completed strokes + the stroke currently being drawn
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Stroke>([]);

  // Canvas offset so we can convert page coordinates to canvas-local coords
  const canvasOffsetX = useRef(0);
  const canvasOffsetY = useRef(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    canvasOffsetX.current = e.nativeEvent.layout.x;
    canvasOffsetY.current = e.nativeEvent.layout.y;
  }, []);

  // Convert a gesture event to canvas-local coordinates
  const toLocal = useCallback((e: GestureResponderEvent): Point => ({
    x: e.nativeEvent.pageX - canvasOffsetX.current,
    y: e.nativeEvent.pageY - canvasOffsetY.current,
  }), []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,

      onPanResponderGrant: (e: GestureResponderEvent) => {
        const pt = toLocal(e);
        currentStroke.current = [pt];
      },

      onPanResponderMove: (e: GestureResponderEvent, _gs: PanResponderGestureState) => {
        const pt = toLocal(e);
        const prev = currentStroke.current[currentStroke.current.length - 1];
        if (prev) {
          // Interpolate so fast swipes don't leave gaps
          const intermediate = interpolate(prev, pt);
          currentStroke.current = [...currentStroke.current, ...intermediate];
        } else {
          currentStroke.current = [...currentStroke.current, pt];
        }
        // Trigger a re-render with the live stroke
        setStrokes((s) => [...s]);
      },

      onPanResponderRelease: () => {
        if (currentStroke.current.length < 2) {
          // Tap: add a tiny stroke so single dots are visible
          const pt = currentStroke.current[0];
          if (pt) {
            currentStroke.current = [pt, { x: pt.x + 1, y: pt.y + 1 }];
          }
        }
        const finished = [...currentStroke.current];
        currentStroke.current = [];
        setStrokes((prev) => {
          const next = [...prev, finished];
          onSignatureChange(encodeStrokes(next));
          return next;
        });
      },

      onPanResponderTerminate: () => {
        currentStroke.current = [];
      },
    }),
  ).current;

  // ─── Clear ──────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    currentStroke.current = [];
    setStrokes([]);
    onSignatureChange(null);
  }, [onSignatureChange]);

  // ─── Render strokes as line segments ────────────────────────────────────

  const allStrokes = [...strokes, currentStroke.current];

  return (
    <View style={styles.wrapper}>
      {/* Drawing surface */}
      <View
        style={[
          styles.canvas,
          { height, borderColor: c.border, backgroundColor: c.surface },
        ]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
        accessible={false}
        accessibilityLabel="Área de desenho de assinatura"
        accessibilityHint="Desenhe sua assinatura nesta área com o dedo"
      >
        {/* Placeholder text when empty */}
        {strokes.length === 0 && currentStroke.current.length === 0 && (
          <Text style={[styles.placeholder, { color: c.textSecondary }]}>
            Desenhe sua assinatura aqui
          </Text>
        )}

        {/* Render each stroke as connected segments */}
        {allStrokes.map((stroke, si) =>
          stroke.length > 1
            ? stroke.slice(1).map((pt, pi) => {
                const prev = stroke[pi]; // point before current
                return (
                  <StrokeLine
                    key={`${si}-${pi}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={pt.x}
                    y2={pt.y}
                    strokeWidth={strokeWidth}
                    strokeColor={strokeColor}
                  />
                );
              })
            : null,
        )}
      </View>

      {/* Clear button */}
      <View style={styles.actions}>
        <Text
          style={[styles.clearBtn, { color: Colors.danger }]}
          onPress={clear}
          accessibilityRole="button"
          accessibilityLabel="Limpar assinatura"
        >
          Limpar
        </Text>
      </View>
    </View>
  );
}

// ─── StrokeLine ───────────────────────────────────────────────────────────────

/**
 * Renders a single line segment between (x1,y1) and (x2,y2) using an
 * absolutely-positioned, rotated View. This avoids any SVG dependency.
 */
function StrokeLine({
  x1, y1, x2, y2, strokeWidth, strokeColor,
}: {
  x1: number; y1: number; x2: number; y2: number;
  strokeWidth: number; strokeColor: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (length < 0.5) return null; // Skip degenerate segments

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x1,
        top: y1 - strokeWidth / 2,
        width: length,
        height: strokeWidth,
        backgroundColor: strokeColor,
        borderRadius: strokeWidth / 2,
        transform: [{ rotate: `${angle}deg` }, { translateX: 0 }],
        transformOrigin: '0 50%',
      }}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  canvas: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: FontSize.sm,
    pointerEvents: 'none',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: Spacing.xs,
  },
  clearBtn: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
});
