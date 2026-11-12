/**
 * Decide whether the immersive Three.js scene may load.
 * First paint never waits on this — the CSS/SVG poster is the LCP.
 */

export type MotionPrefs = {
  reducedMotion: boolean;
  lowPower: boolean;
  noWebGL: boolean;
  allow3d: boolean;
  dprCap: number;
};

export function getMotionPrefs(): MotionPrefs {
  if (typeof window === 'undefined') {
    return { reducedMotion: true, lowPower: true, noWebGL: true, allow3d: false, dprCap: 1 };
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const saveData = !!nav.connection?.saveData;
  const slow =
    nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g';
  const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2;
  const lowCpu =
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency > 0 &&
    navigator.hardwareConcurrency <= 2;
  const lowPower = saveData || slow || lowMem || lowCpu;
  let noWebGL = false;
  try {
    const c = document.createElement('canvas');
    noWebGL = !(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    noWebGL = true;
  }
  const allow3d = !reducedMotion && !lowPower && !noWebGL;
  const dprCap = lowPower ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
  return { reducedMotion, lowPower, noWebGL, allow3d, dprCap };
}
