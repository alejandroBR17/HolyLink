import { useState, useEffect, useRef } from 'react';

export type PerformanceMode = 'auto' | 'high' | 'light';

export interface PerformanceStats {
  fps: number;
  isLowPerformance: boolean;
  hardwareConcurrency: number;
  mode: PerformanceMode;
  isLightModeActive: boolean;
}

/**
 * Hook to measure frame rate and manage light performance mode
 */
export function usePerformanceDiagnostics() {
  const [mode, setModeState] = useState<PerformanceMode>(() => {
    const saved = localStorage.getItem('projection_perfMode');
    return (saved as PerformanceMode) || 'auto';
  });

  const [fps, setFps] = useState<number>(60);
  const [isDetectedLowPerf, setIsDetectedLowPerf] = useState<boolean>(false);

  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const lowFpsCountRef = useRef<number>(0);

  const hardwareConcurrency = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;

  // Measure FPS
  useEffect(() => {
    let animId: number;

    const measure = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        setFps(currentFps);

        // Detect persistent low FPS (< 38 fps)
        if (currentFps < 38) {
          lowFpsCountRef.current++;
          if (lowFpsCountRef.current >= 3) {
            setIsDetectedLowPerf(true);
          }
        } else {
          if (lowFpsCountRef.current > 0) lowFpsCountRef.current--;
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Determine if light mode should actually be active right now
  const isLightModeActive = (() => {
    if (mode === 'light') return true;
    if (mode === 'high') return false;
    // Auto mode: check hardware specs or measured low FPS
    return isDetectedLowPerf || hardwareConcurrency <= 4;
  })();

  const setPerformanceMode = (newMode: PerformanceMode) => {
    setModeState(newMode);
    localStorage.setItem('projection_perfMode', newMode);
    window.dispatchEvent(new CustomEvent('projection_perf_mode_change', { detail: newMode }));
  };

  return {
    fps,
    hardwareConcurrency,
    mode,
    isDetectedLowPerf,
    isLightModeActive,
    setPerformanceMode
  };
}
