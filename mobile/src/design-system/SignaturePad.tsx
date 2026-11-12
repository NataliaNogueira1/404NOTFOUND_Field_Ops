/**
 * SignaturePad — PBI-086 (bugfix PBI-322, issue #334)
 *
 * Canvas de assinatura manuscrita sem dependências externas.
 * Usa PanResponder para capturar traços e os renderiza como segmentos de linha
 * com Views de posicionamento absoluto.
 *
 * Performance: o stroke in-flight é mantido em um ref e renderizado via um
 * componente filho isolado (LiveStroke) que só re-renderiza a si mesmo,
 * evitando re-render do componente pai a cada ponto de movimento.
 *
 * Boundary: quando o dedo sai dos limites do canvas (x<0, y<0, x>width,
 * y>height) o stroke é imediatamente commitado — sem clamp, sem linhas tortas.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  previewScale,
  scaleStrokes,
  scaleAndCenterStrokes,
  strokesToSvgDataUri,
  type SignaturePoint,
  type SignatureStroke,
} from './signatureGeometry';

// Re-export the pure geometry helpers/types so existing imports from
// '@/design-system' keep working.
export { previewScale, scaleStrokes, scaleAndCenterStrokes, strokesToSvgDataUri };
export type { SignaturePoint, SignatureStroke };

// ─── Types ────────────────────────────────────────────────────────────────────

/** Signature payload handed to the parent: a persistable data URI + the raw
 * strokes for an on-device preview. */
export interface SignatureValue {
  dataUri: string;
  strokes: SignatureStroke[];
  width: number;
  height: number;
}

export interface SignaturePadProps {
  onSignatureChange: (signature: SignatureValue | null) => void;
  strokeColor?: string;
  strokeWidth?: number;
  height?: number;
  disabled?: boolean;
}

// ─── Stroke segment rendering ─────────────────────────────────────────────────

/**
 * Draws signature strokes as absolutely-positioned Views. Used both live in the
 * canvas and, read-only, in SignaturePreview — so the preview is pixel-faithful
 * to what was drawn without relying on <Image>/SVG decoding (PBI-322).
 */
function SignatureStrokes({
  strokes,
  strokeColor,
  strokeWidth,
}: {
  strokes: SignatureStroke[];
  strokeColor: string;
  strokeWidth: number;
}) {
  return (
    <>
      {strokes.map((stroke, si) =>
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
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: '0% 50%',
                },
              ]}
            />
          );
        }),
      )}

      {/* Single-point taps rendered as dots */}
      {strokes.map((stroke, si) =>
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
    </>
  );
}

/**
 * Isolated component for the in-flight stroke. Receives a ref to a mutable
 * array and a tick counter — re-renders only when tick changes, keeping the
 * parent SignaturePad from re-rendering on every touch-move event.
 */
const LiveStroke = React.memo(function LiveStroke({
  strokeRef,
  tick,
  strokeColor,
  strokeWidth,
}: {
  strokeRef: React.MutableRefObject<SignatureStroke>;
  tick: number;
  strokeColor: string;
  strokeWidth: number;
}) {
  // tick is the render trigger; reading strokeRef.current here is intentional.
  void tick;
  return (
    <SignatureStrokes
      strokes={strokeRef.current.length > 0 ? [strokeRef.current] : []}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
});

// ─── Component ────────────────────────────────────────────────────────────────

export function SignaturePad({
  onSignatureChange,
  strokeColor = Colors.primary,
  strokeWidth = 2,
  height = 180,
  disabled = false,
}: SignaturePadProps) {
  const c = useThemeColors();

  // Completed strokes — only updated on finger-up. Changing this re-renders
  // the whole component, but that only happens ~once per stroke, not per point.
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);

  // In-flight stroke lives in a ref to avoid triggering a full re-render on
  // every touch-move. LiveStroke subscribes to `liveTick` to repaint itself.
  const liveStrokeRef = useRef<SignatureStroke>([]);
  const [liveTick, setLiveTick] = useState(0);

  // Canvas dimensions — read in gesture handlers only, never during render.
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height });

  // ─── Notify parent ────────────────────────────────────────────────────────

  const notify = useCallback(
    (nextStrokes: SignatureStroke[]) => {
      if (nextStrokes.length === 0) {
        onSignatureChange(null);
        return;
      }
      const w = canvasSizeRef.current.width || 300;
      const h = canvasSizeRef.current.height || height;
      onSignatureChange({
        dataUri: strokesToSvgDataUri(nextStrokes, w, h, strokeColor, strokeWidth),
        strokes: nextStrokes,
        width: w,
        height: h,
      });
    },
    [onSignatureChange, height, strokeColor, strokeWidth],
  );

  // ─── Commit helpers ───────────────────────────────────────────────────────

  // Ref to hold the latest committed strokes so the useEffect below can read
  // them without being a dependency (they change on every stroke).
  const committedRef = useRef<SignatureStroke[]>([]);
  const [commitCount, setCommitCount] = useState(0);

  const commitCurrentStroke = useCallback(() => {
    const finished = liveStrokeRef.current;
    liveStrokeRef.current = [];
    // Repaint LiveStroke as empty.
    setLiveTick((n) => n + 1);
    if (finished.length === 0) return;
    setStrokes((prev) => {
      const next = [...prev, finished];
      committedRef.current = next;
      return next;
    });
    setCommitCount((n) => n + 1);
  }, []);

  // Notify parent after render settles (avoids setState-during-render, #334).
  useEffect(() => {
    if (commitCount === 0) return;
    notify(committedRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitCount]);

  // ─── Gesture handlers ──────────────────────────────────────────────────────

  // Minimum squared distance between consecutive points. Skipping points that
  // are too close reduces the number of segments rendered without visible loss
  // of quality, which is the main source of lag on slow devices.
  const MIN_DIST_SQ = 4; // 2dp minimum distance

  // Timestamp of the last accepted point, used to throttle high-frequency events.
  const lastPointTimeRef = useRef(0);
  const THROTTLE_MS = 16; // ~60fps cap; natively fires faster on some devices

  const isInsideCanvas = useCallback((x: number, y: number): boolean => {
    const { width: w, height: h } = canvasSizeRef.current;
    return x >= 0 && y >= 0 && (w <= 0 || x <= w) && (h <= 0 || y <= h);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,

        onPanResponderGrant: (evt) => {
          const { locationX: x, locationY: y } = evt.nativeEvent;
          if (!isInsideCanvas(x, y)) return;
          liveStrokeRef.current = [{ x, y }];
          lastPointTimeRef.current = Date.now();
          setLiveTick((n) => n + 1);
        },

        onPanResponderMove: (evt) => {
          const { locationX: x, locationY: y } = evt.nativeEvent;

          // Stop drawing immediately when the finger exits the canvas boundary.
          if (!isInsideCanvas(x, y)) {
            commitCurrentStroke();
            return;
          }

          // Throttle: skip points that arrive faster than THROTTLE_MS.
          const now = Date.now();
          if (now - lastPointTimeRef.current < THROTTLE_MS) return;
          lastPointTimeRef.current = now;

          // Skip points too close to the last one (reduces segment count).
          const live = liveStrokeRef.current;
          if (live.length > 0) {
            const last = live[live.length - 1];
            const dx = x - last.x;
            const dy = y - last.y;
            if (dx * dx + dy * dy < MIN_DIST_SQ) return;
          }

          liveStrokeRef.current = [...live, { x, y }];
          setLiveTick((n) => n + 1);
        },

        onPanResponderRelease: commitCurrentStroke,
        // Terminate fires when the gesture is stolen — commit what was drawn.
        onPanResponderTerminate: commitCurrentStroke,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, isInsideCanvas, commitCurrentStroke],
  );

  // ─── Layout ───────────────────────────────────────────────────────────────

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    canvasSizeRef.current = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };
  }, []);

  // ─── Clear ────────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    liveStrokeRef.current = [];
    setLiveTick((n) => n + 1);
    setStrokes([]);
    onSignatureChange(null);
  }, [onSignatureChange]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const isEmpty = strokes.length === 0 && liveStrokeRef.current.length === 0;

  return (
    <View style={styles.wrapper}>
      {/* Canvas area */}
      <View
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
        {/* Placeholder */}
        {isEmpty && (
          <Text
            style={[styles.placeholder, { color: c.textSecondary }]}
            pointerEvents="none"
          >
            Assine aqui
          </Text>
        )}

        {/* Completed strokes — re-rendered only on finger-up */}
        <SignatureStrokes
          strokes={strokes}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
        />

        {/* In-flight stroke — isolated re-render on every point */}
        <LiveStroke
          strokeRef={liveStrokeRef}
          tick={liveTick}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
        />
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

// ─── Preview ──────────────────────────────────────────────────────────────────

/**
 * Read-only, faithful preview of a captured signature (PBI-322). Redraws the
 * strokes with the same View mechanism as the canvas, scaling them from the
 * original canvas size to the preview box so the drawing keeps its proportions.
 * Avoids <Image>+SVG, which does not render in Expo Go.
 */
export function SignaturePreview({
  strokes,
  sourceWidth,
  sourceHeight,
  height = 80,
  strokeColor = Colors.primary,
  strokeWidth = 2,
  accessibilityLabel = 'Prévia da assinatura capturada',
}: {
  strokes: SignatureStroke[];
  sourceWidth: number;
  sourceHeight: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  accessibilityLabel?: string;
}) {
  const c = useThemeColors();
  const [boxWidth, setBoxWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setBoxWidth(e.nativeEvent.layout.width);
  }, []);

  // Uniform scale that fits the original drawing into the preview box while
  // preserving the aspect ratio. scaleAndCenterStrokes also translates the
  // drawing to center it inside the box (issue #334).
  const scale = previewScale(sourceWidth, sourceHeight, boxWidth, height);
  const scaledStrokes = scale > 0 ? scaleAndCenterStrokes(strokes, scale, boxWidth, height) : [];

  return (
    <View
      style={[styles.previewBox, { borderColor: c.border, backgroundColor: c.surface, height }]}
      onLayout={onLayout}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      {scale > 0 && (
        <SignatureStrokes
          strokes={scaledStrokes}
          strokeColor={strokeColor}
          strokeWidth={Math.max(1, strokeWidth * scale)}
        />
      )}
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
  previewBox: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
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
