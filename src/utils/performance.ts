import { useState, useEffect, useRef } from 'react';
import { mediaPreloader } from './preloader';

export type PerformanceMode = 'auto' | 'high' | 'balanced' | 'light';

export interface DetailedHardwareReport {
  cpuCores: number;
  cpuScoreMs: number;
  ramGB: number | string;
  ramDisplay?: string;
  jsHeapUsedMB?: number;
  jsHeapLimitMB?: number;
  gpuVendor: string;
  gpuRenderer: string;
  maxTextureSize: number;
  fps: number;
  networkType: string;
  networkDownlinkMBPS?: number;
  storageUsedMB?: number;
  storageQuotaMB?: number;
  recommendedMode: 'high' | 'balanced' | 'light';
  score: number; // 0 to 100
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  physicalWidth?: number;
  physicalHeight?: number;
}

/**
 * Runs a quick CPU benchmark test (measures JS single-thread loop speed)
 */
export function benchmarkCpuSpeed(): number {
  const start = performance.now();
  let result = 0;
  for (let i = 0; i < 500000; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  const end = performance.now();
  return Math.round(end - start);
}

/**
 * Probes WebGL for GPU renderer and hardware capabilities
 */
export function probeGpuCapabilities(): { vendor: string; renderer: string; maxTextureSize: number } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      return { vendor: 'Não Suportado', renderer: 'Renderizador Genérico por Software', maxTextureSize: 2048 };
    }
    const glTyped = gl as WebGLRenderingContext;
    const debugInfo = glTyped.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? glTyped.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Desconhecido';
    const renderer = debugInfo ? glTyped.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Desconhecido';
    const maxTextureSize = glTyped.getParameter(glTyped.MAX_TEXTURE_SIZE) || 2048;

    return {
      vendor: vendor || 'Desconhecido',
      renderer: renderer || 'Placa Gráfica Padrão',
      maxTextureSize
    };
  } catch (err) {
    return { vendor: 'Erro ao detectar', renderer: 'Software Basic', maxTextureSize: 2048 };
  }
}

/**
 * Gathers complete hardware specifications of the host PC or Mobile device
 */
export async function getDetailedHardwareSpecs(currentFps: number = 60): Promise<DetailedHardwareReport> {
  const cpuCores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
  const cpuScoreMs = benchmarkCpuSpeed();
  let realRamGB: number | undefined;
  try {
    if (typeof window !== 'undefined' && (window as any).require) {
      const os = (window as any).require('os');
      if (os && os.totalmem) {
        realRamGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
      }
    }
  } catch (e) {}

  const rawDeviceMemory = (navigator as any).deviceMemory;
  const ramGB: number | string = realRamGB || rawDeviceMemory || '>=4';
  let ramDisplay: string;
  if (realRamGB) {
    ramDisplay = `${realRamGB} GB`;
  } else if (rawDeviceMemory) {
    ramDisplay = `${rawDeviceMemory} GB`;
  } else {
    ramDisplay = `>= 4 GB`;
  }

  // Memory Heap (Chromium)
  let jsHeapUsedMB: number | undefined;
  let jsHeapLimitMB: number | undefined;
  if ((performance as any).memory) {
    jsHeapUsedMB = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
    jsHeapLimitMB = Math.round((performance as any).memory.jsHeapSizeLimit / (1024 * 1024));
  }

  // GPU
  const gpuInfo = probeGpuCapabilities();

  // Network
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const networkType = conn?.effectiveType || 'wifi/ethernet';
  const networkDownlinkMBPS = conn?.downlink;

  // Storage Quota
  let storageUsedMB: number | undefined;
  let storageQuotaMB: number | undefined;
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) storageUsedMB = Math.round(estimate.usage / (1024 * 1024));
      if (estimate.quota) storageQuotaMB = Math.round(estimate.quota / (1024 * 1024));
    } catch (e) {
      // Storage estimate error fallback
    }
  }

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const physicalWidth = typeof window !== 'undefined' && window.screen ? Math.round(window.screen.width * dpr) : screenWidth;
  const physicalHeight = typeof window !== 'undefined' && window.screen ? Math.round(window.screen.height * dpr) : screenHeight;

  // Calculate Hardware Performance Score (0 - 100)
  let score = 50; // base score

  // Core count weighting
  if (cpuCores >= 8) score += 20;
  else if (cpuCores >= 4) score += 10;
  else score -= 10;

  // CPU Benchmark speed weighting (lower ms is faster)
  if (cpuScoreMs < 15) score += 20;
  else if (cpuScoreMs < 35) score += 10;
  else if (cpuScoreMs > 70) score -= 15;

  // RAM weighting
  if (typeof ramGB === 'number') {
    if (ramGB >= 8) score += 20;
    else if (ramGB >= 4) score += 10;
    else score -= 15;
  } else {
    score += 10; // default assumption for desktop
  }

  // FPS weighting
  if (currentFps >= 55) score += 10;
  else if (currentFps < 35) score -= 20;

  // GPU Dedicated check
  const rendererLower = gpuInfo.renderer.toLowerCase();
  if (rendererLower.includes('nvidia') || rendererLower.includes('radeon') || rendererLower.includes('apple m')) {
    score += 15;
  } else if (rendererLower.includes('swiftshader') || rendererLower.includes('llvmpipe') || rendererLower.includes('basic render')) {
    score -= 20;
  }

  // Clamp score
  score = Math.max(10, Math.min(100, score));

  let recommendedMode: 'high' | 'balanced' | 'light' = 'balanced';
  if (score >= 75) recommendedMode = 'high';
  else if (score < 45) recommendedMode = 'light';

  return {
    cpuCores,
    cpuScoreMs,
    ramGB,
    ramDisplay,
    jsHeapUsedMB,
    jsHeapLimitMB,
    gpuVendor: gpuInfo.vendor,
    gpuRenderer: gpuInfo.renderer,
    maxTextureSize: gpuInfo.maxTextureSize,
    fps: currentFps,
    networkType,
    networkDownlinkMBPS,
    storageUsedMB,
    storageQuotaMB,
    recommendedMode,
    score,
    isTouchDevice,
    screenWidth,
    screenHeight,
    physicalWidth,
    physicalHeight
  };
}

/**
 * Runs a step-by-step full diagnostic routine with simulated animation steps
 */
export async function runFullHardwareDiagnostic(
  onProgress?: (stepName: string, percent: number) => void,
  currentFps: number = 60
): Promise<DetailedHardwareReport> {
  if (onProgress) onProgress('Mapeando Arquitetura do Processador e Cores...', 15);
  await new Promise((r) => setTimeout(r, 250));

  if (onProgress) onProgress('Medindo Memória RAM e Limites do Heap JS...', 35);
  await new Promise((r) => setTimeout(r, 300));

  if (onProgress) onProgress('Detectando Acelerador Gráfico WebGL & GPU...', 60);
  await new Promise((r) => setTimeout(r, 300));

  if (onProgress) onProgress('Executando Teste de Estresse Math JS & FPS...', 80);
  const specs = await getDetailedHardwareSpecs(currentFps);
  await new Promise((r) => setTimeout(r, 250));

  if (onProgress) onProgress('Calibrando Políticas de Cache e Renderização...', 100);
  await new Promise((r) => setTimeout(r, 200));

  // Save recommended performance settings
  localStorage.setItem('projection_detectedScore', specs.score.toString());
  localStorage.setItem('projection_recommendedMode', specs.recommendedMode);

  return specs;
}

/**
 * Purges cached preloaded media to free up browser memory
 */
export function purgeSystemMemoryCache() {
  mediaPreloader.clearCache();
  if (typeof window !== 'undefined' && (window as any).gc) {
    try {
      (window as any).gc();
    } catch (e) {
      // GC not available in default V8 context
    }
  }
}

/**
 * React Hook to manage hardware diagnostic state and performance settings
 */
export function usePerformanceDiagnostics() {
  const [mode, setModeState] = useState<PerformanceMode>(() => {
    const saved = localStorage.getItem('projection_perfMode');
    return (saved as PerformanceMode) || 'auto';
  });

  const [fps, setFps] = useState<number>(60);
  const [isDetectedLowPerf, setIsDetectedLowPerf] = useState<boolean>(false);
  const [report, setReport] = useState<DetailedHardwareReport | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState<boolean>(false);
  const [diagnosticStep, setDiagnosticStep] = useState<string>('');
  const [diagnosticProgress, setDiagnosticProgress] = useState<number>(0);

  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const lowFpsCountRef = useRef<number>(0);
  const highFpsCountRef = useRef<number>(0);

  const hardwareConcurrency = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;

  // Listen to storage and custom events across windows/tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'projection_perfMode' && e.newValue) {
        setModeState(e.newValue as PerformanceMode);
      }
    };
    const handleCustom = (e: any) => {
      if (e.detail) setModeState(e.detail as PerformanceMode);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('projection_perf_mode_change', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('projection_perf_mode_change', handleCustom);
    };
  }, []);

  // Measure FPS continuously
  useEffect(() => {
    let animId: number;

    const measure = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        setFps(currentFps);

        if (currentFps < 38) {
          lowFpsCountRef.current++;
          highFpsCountRef.current = 0;
          if (lowFpsCountRef.current >= 3) {
            setIsDetectedLowPerf(true);
          }
        } else if (currentFps >= 52) {
          highFpsCountRef.current++;
          if (highFpsCountRef.current >= 5) {
            setIsDetectedLowPerf(false);
            lowFpsCountRef.current = 0;
          }
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Initial specs load
  useEffect(() => {
    getDetailedHardwareSpecs(fps).then((rep) => setReport(rep));
  }, []);

  const runBenchmark = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticProgress(0);
    try {
      const rep = await runFullHardwareDiagnostic((step, percent) => {
        setDiagnosticStep(step);
        setDiagnosticProgress(percent);
      }, fps);
      setReport(rep);

      if (mode === 'auto') {
        window.dispatchEvent(new CustomEvent('projection_perf_mode_change', { detail: rep.recommendedMode }));
      }
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const effectiveMode: 'high' | 'balanced' | 'light' = (() => {
    if (mode === 'light') return 'light';
    if (mode === 'high') return 'high';
    if (mode === 'balanced') return 'balanced';
    // Auto mode decision based on report or low FPS
    if (isDetectedLowPerf) return 'light';
    if (report) return report.recommendedMode;
    if (hardwareConcurrency <= 2) return 'light';
    if (hardwareConcurrency <= 4) return 'balanced';
    return 'high';
  })();

  const isLightModeActive = effectiveMode === 'light';
  const isBalancedModeActive = effectiveMode === 'balanced';
  const isHighModeActive = effectiveMode === 'high';

  const setPerformanceMode = (newMode: PerformanceMode) => {
    setModeState(newMode);
    localStorage.setItem('projection_perfMode', newMode);
    window.dispatchEvent(new CustomEvent('projection_perf_mode_change', { detail: newMode }));
  };

  return {
    fps,
    hardwareConcurrency,
    mode,
    effectiveMode,
    isDetectedLowPerf,
    isLightModeActive,
    isBalancedModeActive,
    isHighModeActive,
    report,
    isDiagnosticRunning,
    diagnosticStep,
    diagnosticProgress,
    runBenchmark,
    setPerformanceMode,
    purgeCache: purgeSystemMemoryCache
  };
}
