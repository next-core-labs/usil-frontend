import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

type Point = { x: number; y: number };

export type SignaturePadHandle = {
  /** A PNG data URL of the strokes on a transparent background, or null when nothing is drawn. */
  toDataUrl: () => string | null;
  clear: () => void;
};

/** Ink drawn shorter than this (CSS px, all strokes together) does not count as a signature. */
const MIN_INK = 40;
const INK = '#0A1A33';

function inkLength(strokes: Point[][]): number {
  let total = 0;
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) total += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y);
  }
  return total;
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Point[][], scale: number) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 2.6 * scale;
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    if (stroke.length === 1) {
      ctx.beginPath();
      ctx.arc(stroke[0].x * scale, stroke[0].y * scale, 1.4 * scale, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(stroke[0].x * scale, stroke[0].y * scale);
    // Midpoint quadratic smoothing: steady curves from a jittery finger.
    for (let i = 1; i < stroke.length - 1; i++) {
      const mid = { x: (stroke[i].x + stroke[i + 1].x) / 2, y: (stroke[i].y + stroke[i + 1].y) / 2 };
      ctx.quadraticCurveTo(stroke[i].x * scale, stroke[i].y * scale, mid.x * scale, mid.y * scale);
    }
    const last = stroke[stroke.length - 1];
    ctx.lineTo(last.x * scale, last.y * scale);
    ctx.stroke();
  }
}

/**
 * A finger / mouse / pen signature box. Strokes are kept as points in CSS
 * pixels, so a resize or rotation redraws them sharply instead of wiping them,
 * and the export is rendered fresh at a fixed resolution.
 */
export const SignaturePad = React.forwardRef<SignaturePadHandle, { onChange?: (hasInk: boolean) => void; disabled?: boolean; height?: number }>(
  function SignaturePad({ onChange, disabled = false, height = 180 }, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokes = useRef<Point[][]>([]);
    const drawing = useRef<number | null>(null);
    const [hasInk, setHasInk] = useState(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const redraw = useCallback(() => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const width = wrap.clientWidth;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStrokes(ctx, strokes.current, dpr);
    }, [height]);

    useEffect(() => {
      redraw();
      const wrap = wrapRef.current;
      if (!wrap || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => redraw());
      observer.observe(wrap);
      return () => observer.disconnect();
    }, [redraw]);

    const report = useCallback(() => {
      const next = inkLength(strokes.current) >= MIN_INK;
      setHasInk(next);
      onChangeRef.current?.(next);
    }, []);

    const clear = useCallback(() => {
      strokes.current = [];
      redraw();
      report();
    }, [redraw, report]);

    useImperativeHandle(
      ref,
      () => ({
        clear,
        toDataUrl: () => {
          const wrap = wrapRef.current;
          if (!wrap || inkLength(strokes.current) < MIN_INK) return null;
          // Fixed export size: ~2x the box, capped, so a phone and a desktop give similar files.
          const scale = Math.min(2, 1000 / Math.max(1, wrap.clientWidth));
          const out = document.createElement('canvas');
          out.width = Math.max(80, Math.round(wrap.clientWidth * scale));
          out.height = Math.max(40, Math.round(height * scale));
          const ctx = out.getContext('2d');
          if (!ctx) return null;
          drawStrokes(ctx, strokes.current, scale);
          return out.toDataURL('image/png');
        },
      }),
      [clear, height],
    );

    function point(event: React.PointerEvent<HTMLCanvasElement>): Point {
      const rect = event.currentTarget.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
      if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      drawing.current = event.pointerId;
      strokes.current.push([point(event)]);
      redraw();
    }

    function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
      if (drawing.current !== event.pointerId) return;
      event.preventDefault();
      const stroke = strokes.current[strokes.current.length - 1];
      const events = typeof event.nativeEvent.getCoalescedEvents === 'function' ? event.nativeEvent.getCoalescedEvents() : [];
      if (events.length) {
        const rect = event.currentTarget.getBoundingClientRect();
        for (const e of events) stroke.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        stroke.push(point(event));
      }
      redraw();
    }

    function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
      if (drawing.current !== event.pointerId) return;
      drawing.current = null;
      report();
    }

    return (
      <div className="space-y-2">
        <div
          ref={wrapRef}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-white ${
            hasInk ? 'border-navy-300' : 'border-line'
          } ${disabled ? 'opacity-60' : ''}`}
          style={{ height }}
        >
          {!hasInk ? (
            <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-ink-3">
              ارسم توقيعك هنا بإصبعك
            </span>
          ) : null}
          <div className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-line" aria-hidden />
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="مساحة التوقيع"
            className="absolute inset-0 h-full w-full cursor-crosshair"
            style={{ touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-ink-3">
          <span>{hasInk ? 'تم رسم التوقيع' : 'التوقيع مطلوب'}</span>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-ink-1 hover:bg-navy-100 disabled:opacity-50"
          >
            <Eraser size={14} aria-hidden />
            مسح التوقيع
          </button>
        </div>
      </div>
    );
  },
);
