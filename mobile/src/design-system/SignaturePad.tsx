/**
 * SignaturePad — PBI-086 (bugfix PBI-322)
 *
 * Canvas de assinatura manuscrita sem dependências externas.
 * Usa PanResponder para capturar traços e os renderiza como segmentos de linha
 * com Views de posicionamento absoluto.
 *
 * A assinatura é entregue ao pai de duas formas (via onSignatureChange):
 *   - `dataUri`: SVG em data URI base64, usado para persistência/sync (o backend
 *     e o SQLite guardam esse formato).
 *   - `strokes`: os pontos capturados, usados para a prévia on-device. O preview
 *     NÃO pode usar <Image> com o SVG data URI porque o componente nativo
 *     <Image> do React Native não decodifica SVG em Expo Go (causa do bug de
 *     preview reportado na PBI-322); por isso a prévia redesenha os strokes com
 *     o mesmo mecanismo de Views do canvas (ver SignaturePreview).
 *
 * Correção do offset (PBI-322): as coordenadas vêm de `locationX/locationY`,
 * que já são relativas à view tocada. Isso elimina a conta anterior de
 * `pageX − measure()`, que ficava defasada após rolagem da tela (a tela de
 * conclusão é um ScrollView) e deslocava o traço em relação ao dedo.
 *
 * Props:
 *   onSignatureChange(signature | null) — chamado quando o canvas muda.
 *     null = canvas vazio; { dataUri, strokes } quando há traços.
 *   strokeColor   — cor do traço (padrão: azul primário do projeto)
 *   strokeWidth   — espessura do traço em px (padrão: 2)
 *   height        — altura do canvas em dp (padrão: 180)
 *   disabled      — quando true, bloqueia novos traços
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  strokesToSvgDataUri,
  type SignaturePoint,
  type SignatureStroke,
} from './signatureGeometry';

// Re-export the pure geometry helpers/types so existing imports from
// '@/design-system' keep working.
export { previewScale, scaleStrokes, strokesToSvgDataUri };
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

// ─── Stroke rendering (shared by the canvas and the preview) ───────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function SignaturePad({
  onSignatureChange,
  strokeColor = Colors.primary,
  strokeWidth = 2,
  height = 180,
  disabled = false,
}: SignaturePadProps) {
  const c = useThemeColors();

  // All completed strokes.
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);
  // The stroke currently being drawn (in-flight). Kept in state — it is render
  // data: the live trace must repaint as the finger moves. Handlers use
  // functional updates, so no ref is read during render (PBI-322 lint-safe).
  const [currentStroke, setCurrentStroke] = useState<SignatureStroke>([]);

  // Canvas dimensions (measured on layout). A ref is correct here: the values are
  // only read inside event handlers (onLayout/notify), never during render.
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

  // ─── Gesture handlers ──────────────────────────────────────────────────────

  // locationX/locationY are relative to the view that received the touch (the
  // canvas), so no absolute-offset math is needed — immune to page scroll and
  // screen size, fixing the touch-offset bug (PBI-322). All reads go through
  // functional state updates, so nothing reads a ref during render.
  const startStroke = useCallback((x: number, y: number) => {
    setCurrentStroke([{ x, y }]);
  }, []);

  const extendStroke = useCallback((x: number, y: number) => {
    setCurrentStroke((current) => [...current, { x, y }]);
  }, []);

  const commitStroke = useCallback(() => {
    setCurrentStroke((finished) => {
      if (finished.length > 0) {
        setStrokes((prev) => {
          const next = [...prev, finished];
          notify(next);
          return next;
        });
      }
      return [];
    });
  }, [notify]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt) => startStroke(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
        onPanResponderMove: (evt) => extendStroke(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
        onPanResponderRelease: commitStroke,
        onPanResponderTerminate: () => setCurrentStroke([]),
      }),
    [disabled, startStroke, extendStroke, commitStroke],
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
    setCurrentStroke([]);
    setStrokes([]);
    onSignatureChange(null);
  }, [onSignatureChange]);

  // ─── Render strokes ───────────────────────────────────────────────────────

  // All strokes (committed + in-flight) rendered as thin View-based segments.
  const allStrokes = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;
  const isEmpty = strokes.length === 0 && currentStroke.length === 0;

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
        {/* Placeholder text */}
        {isEmpty && (
          <Text
            style={[styles.placeholder, { color: c.textSecondary }]}
            pointerEvents="none"
          >
            Assine aqui
          </Text>
        )}

        <SignatureStrokes strokes={allStrokes} strokeColor={strokeColor} strokeWidth={strokeWidth} />
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
  // preserving the aspect ratio (so the preview is faithful, not distorted).
  const scale = previewScale(sourceWidth, sourceHeight, boxWidth, height);
  const scaledStrokes = scale > 0 ? scaleStrokes(strokes, scale) : [];

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
