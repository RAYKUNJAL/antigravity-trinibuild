/**
 * Hero visual: SVG poster paints first (LCP). Three.js scene lazy-loads
 * after first paint when WebGL, power and motion allow it. Pauses offscreen.
 * Caps DPR. Pointer and (optional) gyro parallax.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StallPoster } from './StallPoster';
import { getMotionPrefs, type MotionPrefs } from './useMotionPrefs';
import type { HeroSceneHandle } from './JuvayHeroScene';

type Props = {
  progress: number;
  className?: string;
};

export const HeroStage: React.FC<Props> = ({ progress, className = '' }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HeroSceneHandle | null>(null);
  const [prefs, setPrefs] = useState<MotionPrefs | null>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPrefs(getMotionPrefs());
  }, []);

  useEffect(() => {
    if (!prefs?.allow3d) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let onOrient: ((e: DeviceOrientationEvent) => void) | null = null;

    const start = () => {
      import('./JuvayHeroScene')
        .then(({ createJuvayHeroScene }) => {
          if (cancelled || !canvasRef.current) return;
          const handle = createJuvayHeroScene(canvasRef.current, {
            dprCap: prefs.dprCap,
            reducedMotion: prefs.reducedMotion,
          });
          sceneRef.current = handle;
          handle.setProgress(progress);
          handle.resize();
          setEnhanced(true);

          ro = new ResizeObserver(() => handle.resize());
          if (wrapRef.current) ro.observe(wrapRef.current);

          io = new IntersectionObserver(
            (entries) => {
              const on = entries.some((e) => e.isIntersecting);
              handle.setVisible(on);
            },
            { threshold: 0.05 },
          );
          if (wrapRef.current) io.observe(wrapRef.current);

          onOrient = (e: DeviceOrientationEvent) => {
            if (e.beta == null || e.gamma == null) return;
            handle.setGyro(e.beta, e.gamma);
          };
          // Android often fires without a permission prompt. iOS requires a gesture
          // we do not solicit — if it isn't already granted, we simply skip gyro.
          window.addEventListener('deviceorientation', onOrient, { passive: true });
        })
        .catch(() => {
          setEnhanced(false);
        });
    };

    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const id = ric ? ric(start, { timeout: 1400 }) : window.setTimeout(start, 350);

    return () => {
      cancelled = true;
      if (ric) (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id as number);
      else clearTimeout(id as number);
      ro?.disconnect();
      io?.disconnect();
      if (onOrient) window.removeEventListener('deviceorientation', onOrient);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // progress is applied in a separate effect so we don't rebuild the scene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.allow3d, prefs?.dprCap, prefs?.reducedMotion]);

  useEffect(() => {
    sceneRef.current?.setProgress(progress);
  }, [progress]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      sceneRef.current?.setPointer(x, -y);
      if (!enhanced) setTilt({ x, y: -y });
    };
    const onLeave = () => {
      sceneRef.current?.setPointer(0, 0);
      setTilt({ x: 0, y: 0 });
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [enhanced]);

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className}`}>
      <StallPoster tiltX={tilt.x} tiltY={tilt.y} />
      {prefs?.allow3d && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full transition-opacity duration-700"
          style={{ opacity: enhanced ? 1 : 0 }}
          aria-hidden="true"
        />
      )}
      <p className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85">
        Illustrative scene
      </p>
    </div>
  );
};

export default HeroStage;
