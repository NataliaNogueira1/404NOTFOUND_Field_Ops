/**
 * SignaturePad — PBI-086 (bugfix PBI-322, issue #334)
 *
 * Canvas de assinatura manuscrita sem dependências externas.
 * Usa as props de responder do View (mesmos eventos do PanResponder) para
 * capturar traços e os renderiza como segmentos de linha com Views de
 * posicionamento absoluto.
 *
 * Performance: os traços concluídos ficam memoizados (CompletedStrokes); a cada
 * ponto de movimento só o traço em andamento (LiveStroke) é redesenhado.
 *
 * Boundary: quando o dedo sai dos limites do canvas (x<0, y<0, x>width,
 * y>height) o stroke é imediatamente commitado — sem clamp, sem linhas tortas.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
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
  /**
   * Called with true when a stroke starts and false when it ends. Lets a parent
   * ScrollView disable scrolling while the user signs — on iOS the JS responder
   * cannot stop the native scroll gesture on its own.
   */
  onDrawingChange?: (drawing: boolean) => void;
}

// ─── Gesture tuning ───────────────────────────────────────────────────────────

// Minimum squared distance between consecutive points. Skipping points that
// are too close reduces the number of segments rendered without visible loss
// of quality. This is the only point filter: a time-based throttle dropped
// points on fast strokes, turning curves into long straight jumps.
const MIN_DIST_SQ = 4; // 2dp minimum distance

// ─── Stroke segment rendering ─────────────────────────────────────────────────

/**
 * Draws signature strokes as absolutely-positioned Views. Used both live in the
 * canvas and, read-only, in SignaturePreview — so the preview is pixel-faithful
 * to what was drawn without relying on <Image>/SVG decoding (PBI-322).
 */
/**
 * One line segment between two points. Memoized: point objects are never
 * mutated (new points are appended), so while a stroke grows only the newest
 * segment actually renders; the others bail out on the props comparison.
 *
 * The segment extends half a stroke width past each point and has round
 * caps, so neighbouring segments overlap at the joints. That closes the
 * gaps/notches that appeared on curves when segments ended exactly at the
 * points. It is centred on the midpoint and rotated around its own centre.
 */
const Segment = React.memo(function Segment({
  from,
  to,
  strokeColor,
  strokeWidth,
}: {
  from: SignaturePoint;
  to: SignaturePoint;
  strokeColor: string;
  strokeWidth: number;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.5) return null;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const width = length + strokeWidth;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.segment,
        {
          width,
          height: strokeWidth,
          borderRadius: strokeWidth / 2,
          left: (from.x + to.x) / 2 - width / 2,
          top: (from.y + to.y) / 2 - strokeWidth / 2,
          backgroundColor: strokeColor,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
});

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
        stroke.slice(0, -1).map((pt, pi) => (
          <Segment
            key={`${si}-${pi}`}
            from={pt}
            to={stroke[pi + 1]}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
          />
        )),
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
 * Completed strokes, memoized so a new in-flight point does not redraw every
 * finished segment — only the live stroke below changes per touch-move.
 */
const CompletedStrokes = React.memo(SignatureStrokes);

/**
 * In-flight stroke. Receives the stroke as a value (not a ref): reading
 * `ref.current` during render breaks the React Compiler rules after SDK 58.
 */
const LiveStroke = React.memo(function LiveStroke({
  stroke,
  strokeColor,
  strokeWidth,
}: {
  stroke: SignatureStroke;
  strokeColor: string;
  strokeWidth: number;
}) {
  return (
    <SignatureStrokes
      strokes={stroke.length > 0 ? [stroke] : []}
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
  onDrawingChange,
}: SignaturePadProps) {
  const c = useThemeColors();

  // Completed strokes — only updated on finger-up. Changing this re-renders
  // the whole component, but that only happens ~once per stroke, not per point.
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);

  // In-flight stroke: the ref is the source of truth read by the gesture
  // handlers (always the latest points, no stale closure); `liveStroke` is the
  // render copy handed to LiveStroke. Completed strokes are memoized
  // (CompletedStrokes), so a new point only repaints the live stroke.
  const liveStrokeRef = useRef<SignatureStroke>([]);
  const [liveStroke, setLiveStroke] = useState<SignatureStroke>([]);

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
    setLiveStroke([]);
    if (finished.length === 0) return;
    setStrokes((prev) => {
      const next = [...prev, finished];
      committedRef.current = next;
      return next;
    });
    setCommitCount((n) => n + 1);
  }, []);

  // Release/terminate end the gesture; a boundary exit only ends the stroke
  // (the finger is still down, so the parent keeps scrolling disabled).
  const endGesture = useCallback(() => {
    commitCurrentStroke();
    onDrawingChange?.(false);
  }, [commitCurrentStroke, onDrawingChange]);

  // Notify parent after render settles (avoids setState-during-render, #334).
  useEffect(() => {
    if (commitCount === 0) return;
    notify(committedRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitCount]);

  // ─── Gesture handlers ──────────────────────────────────────────────────────

  const isInsideCanvas = useCallback((x: number, y: number): boolean => {
    const { width: w, height: h } = canvasSizeRef.current;
    return x >= 0 && y >= 0 && (w <= 0 || x <= w) && (h <= 0 || y <= h);
  }, []);

  // The canvas uses the View responder props directly — the same events that
  // PanResponder.panHandlers forwards. Building a PanResponder inside useMemo
  // made the React Compiler treat these handlers as render-time code, flagging
  // the ref access and Date.now() in them (react-hooks/refs, react-hooks/purity).
  // As plain event handlers they only run on touch, never during render.
  const shouldBecomeResponder = useCallback(() => !disabled, [disabled]);

  // Returning true blocks native components (the summary screen's ScrollView)
  // from stealing the gesture. PanResponder did this by default
  // (onShouldBlockNativeResponder); without it the ScrollView took over on
  // vertical moves, terminating the stroke and scrolling the page under the
  // finger — strokes broke into dots and drifted away from the finger.
  const onResponderGrant = useCallback(
    (evt: GestureResponderEvent): boolean => {
      const { locationX: x, locationY: y } = evt.nativeEvent;
      onDrawingChange?.(true);
      if (isInsideCanvas(x, y)) {
        liveStrokeRef.current = [{ x, y }];
        setLiveStroke(liveStrokeRef.current);
      }
      return true;
    },
    [isInsideCanvas, onDrawingChange],
  );

  // Refuse to hand the gesture to another responder (e.g. a parent ScrollView)
  // while the user is signing.
  const refuseTermination = useCallback(() => false, []);

  const onResponderMove = useCallback(
    (evt: GestureResponderEvent) => {
      const { locationX: x, locationY: y } = evt.nativeEvent;

      // Stop drawing immediately when the finger exits the canvas boundary.
      if (!isInsideCanvas(x, y)) {
        commitCurrentStroke();
        return;
      }

      // Skip points too close to the last one (reduces segment count).
      const live = liveStrokeRef.current;
      if (live.length > 0) {
        const last = live[live.length - 1];
        const dx = x - last.x;
        const dy = y - last.y;
        if (dx * dx + dy * dy < MIN_DIST_SQ) return;
      }

      liveStrokeRef.current = [...live, { x, y }];
      setLiveStroke(liveStrokeRef.current);
    },
    [isInsideCanvas, commitCurrentStroke],
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
    setLiveStroke([]);
    setStrokes([]);
    onSignatureChange(null);
  }, [onSignatureChange]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const isEmpty = strokes.length === 0 && liveStroke.length === 0;

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

        {/* Completed strokes — memoized, redrawn only on finger-up */}
        <CompletedStrokes
          strokes={strokes}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
        />

        {/* In-flight stroke — the only part repainted on every point */}
        <LiveStroke
          stroke={liveStroke}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
        />

        {/* Touch layer: transparent and rendered last so it is always the touch
            target. Without it, once a stroke segment View sits under the finger,
            locationX/Y become relative to that segment (not the canvas), fall
            outside the bounds and end the stroke — leaving only dots. */}
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={shouldBecomeResponder}
          onMoveShouldSetResponder={shouldBecomeResponder}
          onResponderGrant={onResponderGrant}
          onResponderMove={onResponderMove}
          onResponderTerminationRequest={refuseTermination}
          onResponderRelease={endGesture}
          // Terminate fires when the gesture is stolen — commit what was drawn.
          onResponderTerminate={endGesture}
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
