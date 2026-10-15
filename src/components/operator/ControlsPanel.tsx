import {BackgroundControls} from './BackgroundControls';
import {ShortcutsGuide} from './ShortcutsGuide';
import {ConsoleIntro, ConsoleGroupTitle} from './ConsoleIntro';
import React, { FormEvent, useState, useEffect, useRef } from 'react';
import {
  Tv, ExternalLink, X, EyeOff, Sparkles, Plus, Minus, Play, Pause, RefreshCw,
  Bell, AlertTriangle, Trash2, Send, VolumeX, Volume2, Megaphone, Cpu, Zap, Gauge, CheckCircle2, HardDrive, Monitor, Download,
  Shield, Scale, Bot, Sunrise, ShieldAlert, Ban, Baby, Car, Key, CloudRain, Check, Droplets, ArrowRightLeft
} from 'lucide-react';
import { ALERTS } from '../../data';
import { Meeting } from '../../types';
import { getSetting, saveSetting } from '../../utils';
import { usePerformanceDiagnostics } from '../../utils/performance';
import { useWakeLock } from '../../hooks/useWakeLock';
import { PWAInstallModal } from '../PWAInstallModal';

function PerformanceControlModule() {
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, enable: enableWakeLock, disable: disableWakeLock } = useWakeLock(true);
  const {
    fps,
    hardwareConcurrency,
    mode,
    effectiveMode,
    isDetectedLowPerf,
    setPerformanceMode,
    report,
    purgeCache
  } = usePerformanceDiagnostics();

  const [ramCleared, setRamCleared] = useState(false);

  const handlePurgeRam = () => {
    purgeCache();
    setRamCleared(true);
    setTimeout(() => setRamCleared(false), 2500);
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await disableWakeLock();
    } else {
      await enableWakeLock();
    }
  };

  return (
    <div className="bg-hl-panel border border-hl-line rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col gap-5 relative overflow-hidden">
      {/* Corner screws */}
      <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-hl-line via-hl-raised to-hl-canvas border border-hl-line-strong/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none opacity-80">
        <div className="w-1.5 h-[1px] bg-hl-line rotate-45" />
      </div>
      <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-hl-line via-hl-raised to-hl-canvas border border-hl-line-strong/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none opacity-80">
        <div className="w-1.5 h-[1px] bg-hl-line -rotate-45" />
      </div>

      <div className="border-b border-hl-line-soft pb-3 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-hl-soft font-black text-[10px] uppercase tracking-[0.2em] font-sans flex items-center gap-2">
          <Gauge className="w-4 h-4 text-hl-gold drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
          Desempenho & Anti-Travamento
        </h3>
        <span className={`text-[8px] font-mono px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] flex items-center gap-1 ${
          effectiveMode === 'light'
            ? 'bg-hl-gold-well/80 border-hl-line-strong/80 text-hl-gold-bright'
            : effectiveMode === 'balanced'
            ? 'bg-blue-950/80 border-blue-800/80 text-blue-400'
            : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400'
        }`}>
          {effectiveMode === 'light' ? (
            <>
              <Zap className="w-2.5 h-2.5 text-hl-gold-bright shrink-0" />
              <span>{isDetectedLowPerf ? 'Leve (Lag Detectado)' : 'Modo Leve (Anti-Lag)'}</span>
            </>
          ) : effectiveMode === 'balanced' ? (
            <>
              <Scale className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <span>Modo Equilibrado</span>
            </>
          ) : (
            <>
              <Sparkles className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span>Alta Qualidade</span>
            </>
          )}
        </span>
      </div>

      <p className="operator-muted">Dados deste aparelho e desta aba, não do PC remoto. FPS mede a atualização da página; RAM é aproximada e o navegador pode ocultar CPU, GPU e memória.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-hl-canvas border border-hl-line-soft p-3 rounded-2xl flex flex-col justify-between shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
          <span className="text-[9px] text-hl-dim font-black uppercase font-mono">Taxa FPS</span>
          <span className={`font-mono font-black text-xs mt-0.5 ${fps < 38 ? 'text-hl-gold-bright' : 'text-emerald-400'}`}>{fps} FPS</span>
        </div>
        <div className="bg-hl-canvas border border-hl-line-soft p-3 rounded-2xl flex flex-col justify-between shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
          <span className="text-[9px] text-hl-dim font-black uppercase font-mono">Processadores lógicos</span>
          <span className="font-mono font-black text-xs text-hl-soft mt-0.5">{hardwareConcurrency || 'Não informado'}{hardwareConcurrency ? ' lógicos' : ''}</span>
        </div>
        <div className="bg-hl-canvas border border-hl-line-soft p-3 rounded-2xl flex flex-col justify-between shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
          <span className="text-[9px] text-hl-dim font-black uppercase font-mono">RAM aproximada</span>
          <span className="font-mono font-black text-xs text-blue-400 mt-0.5 truncate" title={'Estimativa disponibilizada pelo navegador'}>
            {report?.ramDisplay || 'Não informada'}
          </span>
        </div>
        <div className="bg-hl-canvas border border-hl-line-soft p-3 rounded-2xl flex flex-col justify-between shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
          <span className="text-[9px] text-hl-dim font-black uppercase font-mono">Heap JS</span>
          <span className="font-mono font-black text-xs text-purple-400 mt-0.5 truncate">
            {report?.jsHeapUsedMB !== undefined ? `${report.jsHeapUsedMB} MB` : 'Não informado'}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-hl-canvas/80 border border-hl-line/80 p-3 rounded-xl text-[10px] leading-relaxed text-hl-muted shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-hl-gold mt-0.5" />
        <div>
          {effectiveMode === 'light' ? (
            <span><strong>Modo Leve:</strong> Otimizado para fluidez instantânea, pré-carregamento econômico de slides na RAM e renderização com menor complexidade visual.</span>
          ) : effectiveMode === 'balanced' ? (
            <span><strong>Modo Equilibrado:</strong> Transições suaves com pré-carregamento preditivo e baixo consumo de memória.</span>
          ) : (
            <span><strong>Alta Qualidade:</strong> Efeitos visuais completos, desfoques e shaders 3D cinemáticos.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        <button
          onClick={handlePurgeRam}
          className={`relative overflow-hidden w-full py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            ramCleared
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[inset_0_2px_8px_rgba(16,185,129,0.2)]'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-hl-soft shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] active:translate-y-[1px] active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]'
          }`}
        >
          {!ramCleared && <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl opacity-50" />}
          <HardDrive className={`w-3.5 h-3.5 relative z-10 ${ramCleared ? 'text-emerald-400 animate-bounce' : 'text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.5)]'}`} />
          <span className="relative z-10 flex items-center gap-1">
            {ramCleared ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Cache de pré-carregamento limpo</span>
              </>
            ) : (
              <span>Limpar RAM aproximada</span>
            )}
          </span>
        </button>

        <button
          onClick={handleToggleWakeLock}
          disabled={!wakeLockSupported}
          className={`relative overflow-hidden w-full py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold ${
            wakeLockActive
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[inset_0_2px_8px_rgba(16,185,129,0.2)]'
              : wakeLockSupported
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-hl-soft shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] active:translate-y-[1px] active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]'
              : 'bg-hl-canvas border-hl-line/50 text-hl-dim cursor-not-allowed'
          }`}
          title={wakeLockSupported ? 'Impedir hibernação do navegador durante transmissão' : 'Wake Lock não suportado pelo navegador'}
        >
          {wakeLockSupported && !wakeLockActive && <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl opacity-50" />}
          <Monitor className={`w-3.5 h-3.5 ${wakeLockActive ? 'text-emerald-400' : 'text-hl-gold'}`} />
          <span className="flex items-center gap-1">
            {wakeLockActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse shrink-0" />
                <span>Tela Acesa (Wake Lock)</span>
              </>
            ) : wakeLockSupported ? (
              'Activar Tela Acesa'
            ) : (
              'Wake Lock Indisponível'
            )}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold text-hl-dim uppercase tracking-wider">Perfil Manual de Desempenho</span>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => setPerformanceMode('auto')}
            className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
              mode === 'auto'
                ? 'bg-hl-gold/20 border-hl-gold/50 text-hl-gold-bright'
                : 'bg-hl-canvas border-hl-line hover:border-hl-line text-hl-dim'
            }`}
          >
            Auto
          </button>
          <button
            onClick={() => setPerformanceMode('light')}
            className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border flex items-center justify-center gap-1 ${
              mode === 'light'
                ? 'bg-hl-gold/20 border-hl-gold/50 text-hl-gold-bright'
                : 'bg-hl-canvas border-hl-line hover:border-hl-line text-hl-dim'
            }`}
          >
            <Zap className="w-3 h-3 text-hl-gold shrink-0" />
            Leve
          </button>
          <button
            onClick={() => setPerformanceMode('balanced')}
            className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
              mode === 'balanced'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-hl-canvas border-hl-line hover:border-hl-line text-hl-dim'
            }`}
          >
            Equilibrado
          </button>
          <button
            onClick={() => setPerformanceMode('high')}
            className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
              mode === 'high'
                ? 'bg-hl-gold/20 border-hl-gold/50 text-hl-gold-bright'
                : 'bg-hl-canvas border-hl-line hover:border-hl-line text-hl-dim'
            }`}
          >
            Alto
          </button>
        </div>
      </div>
    </div>
  );
}

function AudioVolumeControl({
  volume,
  updateStateAndBroadcast
}: {
  volume: number;
  updateStateAndBroadcast: (key: string, value: any) => void;
}) {
  const [localVolume, setLocalVolume] = useState<number>(volume);
  const isDraggingRef = useRef<boolean>(false);
  const throttleTimerRef = useRef<any>(null);

  // Keep local state in sync with external volume prop ONLY when not actively dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalVolume(volume);
    }
  }, [volume]);

  // Handle slider drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    setLocalVolume(newVal);

    // Throttle broadcast during dragging to avoid state echo stutter across dual screens
    if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        updateStateAndBroadcast('volume', newVal);
        throttleTimerRef.current = null;
      }, 30);
    }
  };

  const handlePointerDown = () => {
    isDraggingRef.current = true;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    updateStateAndBroadcast('volume', localVolume);
  };

  const handlePresetClick = (val: number) => {
    isDraggingRef.current = false;
    setLocalVolume(val);
    updateStateAndBroadcast('volume', val);
  };

  const displayVolume = isDraggingRef.current ? localVolume : volume;
  const volPercent = Math.round(displayVolume * 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-hl-dim uppercase tracking-wider">Volume Geral da Mídia</span>
          {displayVolume === 0 ? (
            <span className="text-[8px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded uppercase">
              Mudo
            </span>
          ) : (
            <span className="text-[8px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">
              Ativo
            </span>
          )}
        </div>
        <span className="text-xs font-mono font-black text-hl-gold-bright">{volPercent}%</span>
      </div>

      {/* LED Meter Visual Indicator */}
      <div className="flex items-center gap-1 bg-hl-canvas p-1.5 rounded-lg border border-hl-line">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, idx) => {
          const isActive = displayVolume >= threshold - 0.05;
          return (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                isActive
                  ? idx < 3
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : idx === 3
                    ? 'bg-hl-gold-bright shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'bg-hl-raised/60'
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handlePresetClick(displayVolume === 0 ? 0.8 : 0)}
          className={`p-2.5 rounded-xl transition-all border cursor-pointer ${
            displayVolume === 0
              ? 'bg-red-500/20 border-red-500/40 text-red-400 font-bold shadow-md shadow-red-500/10 animate-pulse'
              : 'bg-hl-canvas border-hl-line text-hl-soft hover:text-hl-gold-bright hover:border-hl-gold/40'
          }`}
          title={displayVolume === 0 ? "Ativar Áudio (80%)" : "Silenciar Imediatamente"}
        >
          {displayVolume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="flex-1 flex items-center relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={displayVolume}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onChange={handleSliderChange}
            className="w-full h-2.5 bg-hl-canvas rounded-lg appearance-none cursor-pointer accent-hl-gold hover:accent-hl-gold-bright focus:outline-none border border-hl-line"
          />
        </div>
      </div>

      {/* Quick Volume Presets */}
      <div className="grid grid-cols-5 gap-1">
        {[
          { label: 'Mudo', val: 0 },
          { label: '20%', val: 0.2 },
          { label: '50%', val: 0.5 },
          { label: '80%', val: 0.8 },
          { label: '100%', val: 1.0 },
        ].map((item) => {
          const isSelected = Math.abs(displayVolume - item.val) < 0.05;
          return (
            <button
              key={item.label}
              onClick={() => handlePresetClick(item.val)}
              className={`py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase cursor-pointer border ${
                isSelected
                  ? 'bg-hl-gold border-hl-gold text-black font-extrabold shadow-sm'
                  : 'bg-hl-canvas border-hl-line hover:border-hl-line text-hl-muted hover:text-hl-soft'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ControlsPanelProps {
  projectionWin: Window | null;
  setProjectionWin: (w: Window | null) => void;
  blackoutEnabled: boolean;
  clearContentEnabled: boolean;
  nextMeeting: Meeting;
  nextMeetingDate: Date;
  hoursStr: string;
  minutesStr: string;
  diffSeconds: number;
  countdownOffset: number;
  countdownPaused: boolean;
  pausedSeconds: number | null;
  activeAlert: string | null;
  volume: number;
  tickerText: string | null;
  background3DStyle?: 'auto' | 'aurora' | 'veil' | 'fju_aura' | 'particles_2d' | 'off';
  background3DFps?: 30 | 60;
  background3DIntensity?: 'high' | 'medium' | 'low';
  manualSlideOverride?: string | null;
  projectionMode?: 'pre' | 'post';
  updateStateAndBroadcast: (key: string, value: any) => void;
  currentTime: Date;
  isProjectionOpen?: boolean;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  showAlert?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function ControlsPanel({
  projectionWin,
  setProjectionWin,
  blackoutEnabled,
  clearContentEnabled,
  nextMeeting,
  nextMeetingDate,
  hoursStr,
  minutesStr,
  diffSeconds,
  countdownOffset,
  countdownPaused,
  pausedSeconds,
  activeAlert,
  volume,
  tickerText,
  background3DStyle = 'auto',
  background3DFps = 60,
  background3DIntensity = 'high',
  projectionMode = 'pre',
  manualSlideOverride,
  updateStateAndBroadcast,
  currentTime,
  isProjectionOpen = false,
  showToast,
  showAlert
}: ControlsPanelProps) {
  const notify = showToast || showAlert;
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOpenMonitor = async () => {
    const projectionUrl = `${window.location.origin}${window.location.pathname}?projection`;
    try {
      let windowFeatures = 'width=1280,height=720,menubar=no,status=no,titlebar=no';

      // Attempt to use Window Management API (Screen Details)
      if ('getScreenDetails' in window) {
        try {
          const screenDetails = await (window as any).getScreenDetails();
          // Find the first screen that is NOT the current internal/primary screen
          const secondaryScreen = screenDetails.screens.find((s: any) => s !== screenDetails.currentScreen);

          if (secondaryScreen) {
            // Position the window on the secondary screen
            windowFeatures = `left=${secondaryScreen.availLeft},top=${secondaryScreen.availTop},width=${secondaryScreen.availWidth},height=${secondaryScreen.availHeight},menubar=no,status=no,titlebar=no,fullscreen=yes`;
          }
        } catch (err) {
          console.warn("Screen Details API permission denied or error:", err);
        }
      }

      const newWin = window.open(projectionUrl, 'holyrics_projection', windowFeatures);
      if (newWin) {
        setProjectionWin(newWin);
        if (newWin.document) {
          newWin.onload = () => {
            if (newWin.document.documentElement.requestFullscreen) {
              newWin.document.documentElement.requestFullscreen().catch(() => {});
            }
          };
        }
      } else {
        if (notify) notify('Janela do monitor foi bloqueada. Permita pop-ups no seu navegador.', 'error');
      }
    } catch (e) {
      console.warn("Could not open projection window:", e);
      if (notify) notify('Erro ao tentar abrir janela do monitor.', 'error');
    }
    updateStateAndBroadcast('isProjectionOpen', true);
    updateStateAndBroadcast('projectionCloseTrigger', null);
  };

  const handleCloseMonitor = () => {
    setProjectionWin(null);
    updateStateAndBroadcast('projectionCloseTrigger', Date.now().toString());
    updateStateAndBroadcast('isProjectionOpen', false);
  };

  const handleToggleTimerPlayPause = () => {
    if (countdownPaused) {
      const currentDiffMs = nextMeetingDate.getTime() - new Date().getTime();
      const currentDiffSec = Math.floor(currentDiffMs / 1000);
      const targetDiffSec = pausedSeconds || 0;
      const secondsToAdjust = targetDiffSec - currentDiffSec;
      updateStateAndBroadcast('countdownOffset', secondsToAdjust * 1000);
      updateStateAndBroadcast('countdownPaused', false);
      updateStateAndBroadcast('pausedSeconds', null);
    } else {
      updateStateAndBroadcast('countdownPaused', true);
      updateStateAndBroadcast('pausedSeconds', diffSeconds);
    }
  };

  const handleResetTimer = () => {
    updateStateAndBroadcast('countdownOffset', 0);
    updateStateAndBroadcast('countdownPaused', false);
    updateStateAndBroadcast('pausedSeconds', null);
  };

  const [alertType, setAlertType] = useState<'custom' | 'car_plate' | 'ebi_child'>('custom');
  const [carPlate, setCarPlate] = useState('');
  const [carModel, setCarModel] = useState('');
  const [childName, setChildName] = useState('');
  const [alertHistory, setAlertHistory] = useState<string[]>([]);
  const [isAlertHistoryLoaded, setIsAlertHistoryLoaded] = useState(false);

  useEffect(() => {
    getSetting('projection_alert_history', []).then(history => {
      setAlertHistory(history);
      setIsAlertHistoryLoaded(true);
    });
  }, []);

  const CHURCH_ALERT_PRESETS = [
    {
      id: 'baby',
      title: 'Berçário (EBI)',
      icon: Baby,
      msg: 'Atenção pais: Compareçam ao berçário (EBI).'
    },
    {
      id: 'car',
      title: 'Estacionamento',
      icon: Car,
      msg: 'Proprietário de veículo: Compareça ao estacionamento.'
    },
    {
      id: 'keys',
      title: 'Chave Achada',
      icon: Key,
      msg: 'Uma chave foi encontrada. Procurar a recepção ao final.'
    },
    {
      id: 'rain',
      title: 'Alerta de Chuva',
      icon: CloudRain,
      msg: 'Atenção condutores: Verificar janelas dos veículos.'
    },
    {
      id: 'workers',
      title: 'Reunião Obreiros',
      icon: Megaphone,
      msg: 'Breve reunião com todos os obreiros e colaboradores após a reunião.'
    }
  ];

  const handleSendAlertMessage = (message: string) => {
    if (!message.trim()) return;
    updateStateAndBroadcast('activeAlert', message.trim());

    // Save to history
    const updated = [message.trim(), ...alertHistory.filter(h => h !== message.trim())].slice(0, 10);
    setAlertHistory(updated);
    saveSetting('projection_alert_history', updated);
  };

  const handleCustomAlertSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (alertType === 'car_plate') {
      if (!carPlate.trim()) return;
      const text = `Atenção: Veículo ${carModel ? carModel + ' ' : ''}placa ${carPlate.toUpperCase().trim()}, favor comparecer ao estacionamento.`;
      handleSendAlertMessage(text);
      setCarPlate('');
      setCarModel('');
    } else if (alertType === 'ebi_child') {
      if (!childName.trim()) return;
      const text = `Atenção: Responsável pela criança ${childName.trim()}, favor dirigir-se à EBI.`;
      handleSendAlertMessage(text);
      setChildName('');
    } else {
      const form = e.currentTarget;
      const input = form.elements.namedItem('customAlertText') as HTMLInputElement;
      if (input && input.value.trim()) {
        handleSendAlertMessage(input.value.trim());
        input.value = "";
      }
    }
  };

  const handleDeleteHistoryItem = (idx: number) => {
    const updated = alertHistory.filter((_, i) => i !== idx);
    setAlertHistory(updated);
    saveSetting('projection_alert_history', updated);
  };

  const tickerSuggestions = [
    "Seja muito bem-vindo à Casa de Deus!",
    "Por favor, silencie o seu aparelho celular para a reunião.",
    "EBI: Traga seus filhos para o Espaço Infantil durante a reunião.",
    "Participe da Corrente de Libertação nesta Sexta-feira.",
    "Reunião de Fé do Domingo: Traga toda a sua família!",
    "FJU: Encontro Jovem neste Sábado às 16h."
  ];

  return (
    <div className="controls-workspace console-area">
      <ConsoleIntro icon={Sparkles} title="Ajustes da reunião" eyebrow="Luz, tempo e comunicação" description="Prepare a atmosfera e os avisos no mesmo lugar, com o estado atual à vista." stats={[{label:'Saída',value:blackoutEnabled ? 'Blackout' : clearContentEnabled ? 'Sem texto' : 'Conteúdo visível'},{label:'Cronômetro',value:countdownPaused ? 'Pausado' : 'Em contagem'},{label:'Áudio',value:Math.round(volume * 100) + '%'}]}/>
      <div className="console-settings-groups">

<details open className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Sparkles} title="Projeção, efeitos e cronômetro" description="Atmosfera do telão, abertura da reunião e tempo." badge={background3DStyle === 'off' ? 'Efeito desligado' : 'Efeito ativo'}/></summary>
      {/* COLUMN 1: PROJECTION & TIMERS */}
      <div className="flex flex-col gap-6">

        {/* TRANSMISSION MODE SWITCHER (PRÉ-REUNIÃO / PÓS-REUNIÃO) */}
        <div className="relative bg-hl-panel border border-hl-line rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-4">
          <div className="border-b border-hl-line-soft pb-3 flex items-center justify-between">
            <h3 className="text-hl-soft font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 font-sans">
              <ArrowRightLeft className="w-4 h-4 text-hl-gold drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
              Modo da Transmissão
            </h3>
            <span className={`text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
              projectionMode === 'post'
                ? 'bg-sky-950/80 border-sky-800 text-sky-400'
                : 'bg-hl-gold-well/80 border-hl-line-strong text-hl-gold-bright'
            }`}>
              {projectionMode === 'post' ? 'Pós-Reunião Ativo' : 'Pré-Reunião Ativo'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                updateStateAndBroadcast('projectionMode', 'pre');
                updateStateAndBroadcast('manualSlideOverride', null);
              }}
              className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border ${
                projectionMode === 'pre'
                  ? 'bg-gradient-to-b from-hl-raised to-hl-raised border-hl-gold/80 text-hl-gold-bright shadow-[0_0_20px_rgba(255,211,79,0.25)]'
                  : 'bg-hl-raised border-hl-line text-hl-muted hover:text-hl-soft hover:border-hl-line'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${projectionMode === 'pre' ? 'bg-hl-gold-bright animate-pulse' : 'bg-hl-line'}`} />
                <span className="font-sans font-extrabold text-xs">Pré-Reunião</span>
              </div>
              <span className="text-[9px] text-hl-dim font-mono text-center">
                Contagem regressiva, foco e carrossel de entrada
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                updateStateAndBroadcast('projectionMode', 'post');
                updateStateAndBroadcast('manualSlideOverride', null);
              }}
              className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer border ${
                projectionMode === 'post'
                  ? 'bg-gradient-to-b from-[#101b2b] to-hl-raised border-sky-500/80 text-sky-300 shadow-[0_0_20px_rgba(14,165,233,0.25)]'
                  : 'bg-hl-raised border-hl-line text-hl-muted hover:text-hl-soft hover:border-hl-line'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${projectionMode === 'post' ? 'bg-sky-400 animate-pulse' : 'bg-hl-line'}`} />
                <span className="font-sans font-extrabold text-xs">Pós-Reunião</span>
              </div>
              <span className="text-[9px] text-hl-dim font-mono text-center">
                Batismo, despedida, bênção da semana e dízimos
              </span>
            </button>
          </div>

          {/* QUICK SHORTCUTS FOR IMPORTANT SLIDES */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-hl-line-soft">
            <button
              type="button"
              aria-pressed={manualSlideOverride === 'baptism'}
              onClick={() => {updateStateAndBroadcast('activeVerseIndex',null); updateStateAndBroadcast('customVerseText',null); updateStateAndBroadcast('customVerseRef',null); updateStateAndBroadcast('manualSlideOverride',manualSlideOverride === 'baptism' ? null : 'baptism');}}
              className="py-2.5 px-3 bg-hl-raised hover:bg-sky-950/40 border border-hl-line hover:border-sky-500/50 rounded-xl text-[10px] font-bold text-sky-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:translate-y-[1px]"
            >
              <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{manualSlideOverride === 'baptism' ? 'Soltar Batismo' : 'Fixar Batismo'}</span>
            </button>

            <button
              type="button"
              aria-pressed={manualSlideOverride === 'blessing'}
              onClick={() => {updateStateAndBroadcast('activeVerseIndex',null); updateStateAndBroadcast('customVerseText',null); updateStateAndBroadcast('customVerseRef',null); updateStateAndBroadcast('manualSlideOverride',manualSlideOverride === 'blessing' ? null : 'blessing');}}
              className="py-2.5 px-3 bg-hl-raised hover:bg-hl-gold-well/40 border border-hl-line hover:border-hl-gold/50 rounded-xl text-[10px] font-bold text-hl-gold-bright flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:translate-y-[1px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-hl-gold-bright shrink-0" />
              <span>{manualSlideOverride === 'blessing' ? 'Soltar Despedida' : 'Fixar Despedida'}</span>
            </button>
          </div>
          {(manualSlideOverride === 'baptism' || manualSlideOverride === 'blessing') && <div className="operator-actions" role="status"><span>Slide fixado · a fila foi preservada.</span><button className="operator-primary" onClick={() => updateStateAndBroadcast('manualSlideOverride',null)}><Play size={17}/>Voltar à fila normal</button></div>}

        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className="relative bg-hl-panel border border-hl-line rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-5 group">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <h3 className="relative z-10 text-hl-muted font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-hl-gold shadow-[0_0_8px_rgba(255,211,79,0.8)] animate-pulse" />
            Controle de Saída HDMI
          </h3>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <button
              onClick={() => updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled)}
              className={`relative p-5 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                blackoutEnabled
                  ? "bg-gradient-to-b from-hl-raised to-hl-panel border border-red-900/50 text-red-500 shadow-[inset_0_3px_8px_rgba(0,0,0,0.8),0_0_15px_rgba(220,38,38,0.2)] translate-y-[2px]"
                  : "bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-hl-line-strong text-hl-soft shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[2px] active:shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)]"
              }`}
            >
              <EyeOff className={`w-7 h-7 relative z-10 transition-colors ${blackoutEnabled ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" : "text-hl-dim"}`} />
              <div className="text-center relative z-10">
                <p className="font-bold text-xs tracking-wide">{blackoutEnabled ? "Tela Preta Ativa" : "Tela Preta"}</p>
                <p className="text-[9px] font-mono text-hl-dim mt-1 uppercase">Corta Sinal</p>
              </div>
            </button>

            <button
              onClick={() => updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled)}
              className={`relative p-5 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold ${
                clearContentEnabled
                  ? "bg-gradient-to-b from-hl-raised to-hl-panel border border-hl-line-strong/50 text-hl-gold shadow-[inset_0_3px_8px_rgba(0,0,0,0.8),0_0_15px_rgba(255,211,79,0.2)] translate-y-[2px]"
                  : "bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-hl-line-strong text-hl-soft shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[2px] active:shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)]"
              }`}
            >
              <Sparkles className={`w-7 h-7 relative z-10 transition-colors ${clearContentEnabled ? "text-hl-gold drop-shadow-[0_0_10px_rgba(255,211,79,0.8)]" : "text-hl-dim"}`} />
              <div className="text-center relative z-10">
                <p className="font-bold text-xs tracking-wide">{clearContentEnabled ? "Texto Ocultado" : "Limpar Slide"}</p>
                <p className="text-[9px] font-mono text-hl-dim mt-1 uppercase">Mantém Fundo</p>
              </div>
            </button>
          </div>

          {!isProjectionOpen ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleOpenMonitor}
                  className="w-full p-3 bg-hl-gold hover:bg-hl-gold-strong text-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 animate-in fade-in duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Monitor 2ª Tela
                </button>
                <button
                  onClick={() => setShowPwaModal(true)}
                  className="w-full p-3 bg-hl-canvas hover:bg-hl-raised border border-hl-line hover:border-hl-gold/50 text-hl-gold-bright rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Download className="w-4 h-4 text-hl-gold" />
                  Instalar App HolyLink
                </button>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 bg-hl-canvas border border-hl-line/80 rounded-lg text-[10px] text-hl-muted">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-hl-gold'} animate-pulse`} />
                  {isOnline ? 'Navegador online' : 'Navegador offline'}
                </span>
                <button
                  onClick={() => {
                    const bc = new BroadcastChannel('holyrics_projection_sync');
                    bc.postMessage({ type: 'UPDATE_STATE', key: 'mediaUpdateTrigger', value: Date.now().toString() });
                    bc.close();
                    window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
                  }}
                  className="text-[9px] font-bold text-hl-gold-bright hover:text-hl-gold-bright underline cursor-pointer"
                >
                  Atualizar estado local
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCloseMonitor}
                className="w-full p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer animate-in fade-in duration-200"
              >
                <X className="w-4 h-4" />
                Fechar 2ª Tela
              </button>
              <div className="flex items-center justify-between px-2 py-1.5 bg-hl-canvas border border-hl-line/80 rounded-lg text-[10px] text-hl-muted">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-hl-gold'} animate-pulse`} />
                  Janela de projeção aberta
                </span>
                <button
                  onClick={() => {
                    const bc = new BroadcastChannel('holyrics_projection_sync');
                    bc.postMessage({ type: 'UPDATE_STATE', key: 'mediaUpdateTrigger', value: Date.now().toString() });
                    bc.close();
                    window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
                  }}
                  className="text-[9px] font-bold text-hl-gold-bright hover:text-hl-gold-bright underline cursor-pointer"
                >
                  Atualizar estado local
                </button>
              </div>
            </div>
          )}
        </div>

        <BackgroundControls style={background3DStyle} fps={background3DFps} intensity={background3DIntensity} update={updateStateAndBroadcast}/>

        {/* TIMER COUNTDOWN CARD */}
        <div className="relative bg-hl-panel border border-hl-line rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col gap-4">
          <div className="border-b border-hl-line-soft pb-3 flex items-center justify-between">
            <h3 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider font-sans">Cronômetro de Reunião</h3>
            <span className="text-[9px] bg-hl-raised border border-hl-line text-hl-muted font-mono px-2 py-0.5 rounded-md font-bold">
              Ajustável
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-hl-canvas p-4 rounded-2xl border border-hl-line-soft shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[10px] text-hl-muted font-mono font-extrabold uppercase tracking-wider block">Próxima Reunião</span>
              <p className="text-sm font-extrabold text-hl-copy mt-1 font-sans">
                <span className="text-hl-gold">{nextMeeting.dayName}</span> às {nextMeeting.time}
              </p>
              <p className="text-xs text-hl-muted font-semibold leading-relaxed truncate max-w-[180px] mt-0.5 font-sans">{nextMeeting.theme}</p>
            </div>

            <div className="text-center bg-hl-raised border border-hl-line px-6 py-3 rounded-2xl w-full sm:w-auto min-w-[140px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <span className="text-[9px] font-mono font-extrabold text-hl-muted uppercase tracking-widest block">Regressiva</span>
              <p className="text-3xl font-mono font-black text-hl-gold tracking-widest mt-0.5 drop-shadow-[0_0_10px_rgba(255,211,79,0.5)] animate-pulse">
                {hoursStr}:{minutesStr}
              </p>
            </div>
          </div>

          {/* TIMER ACTIONS */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 60 * 1000)}
                className="bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-emerald-500/50 text-hl-soft text-[10px] font-extrabold py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:translate-y-[1px]"
                title="Avançar 1 minuto"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> 1m
              </button>
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 5 * 60 * 1000)}
                className="bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-emerald-500/50 text-hl-soft text-[10px] font-extrabold py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:translate-y-[1px]"
                title="Avançar 5 minutos"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> 5m
              </button>
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 30 * 60 * 1000)}
                className="bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-emerald-500/50 text-hl-soft text-[10px] font-extrabold py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:translate-y-[1px]"
                title="Avançar 30 minutos"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> 30m
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 60 * 1000)}
                className="bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-red-500/50 text-hl-soft text-[10px] font-extrabold py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:translate-y-[1px]"
                title="Voltar 1 minuto"
              >
                <Minus className="w-3.5 h-3.5 text-red-400" /> 1m
              </button>
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 5 * 60 * 1000)}
                className="bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-red-500/50 text-hl-soft text-[10px] font-extrabold py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:translate-y-[1px]"
                title="Voltar 5 minutos"
              >
                <Minus className="w-3.5 h-3.5 text-red-400" /> 5m
              </button>
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 30 * 60 * 1000)}
                className="bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-red-500/50 text-hl-soft text-[10px] font-extrabold py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:translate-y-[1px]"
                title="Voltar 30 minutos"
              >
                <Minus className="w-3.5 h-3.5 text-red-400" /> 30m
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              type="button"
              onClick={handleToggleTimerPlayPause}
              className={`text-xs font-black py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all font-sans active:translate-y-[1px] ${
                countdownPaused
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "bg-hl-raised text-red-400 border border-red-900/50 hover:bg-red-950/30"
              }`}
            >
              {countdownPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              {countdownPaused ? "Retomar" : "Pausar"}
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              className="bg-hl-raised hover:bg-hl-raised text-hl-soft text-xs font-extrabold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 border border-hl-line hover:border-hl-line-strong transition-all font-sans active:translate-y-[1px]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-hl-gold" /> Resetar
            </button>
          </div>
        </div>

        <details className="bible-picker"><summary>Atalhos de teclado por função</summary><ShortcutsGuide/></details>

      </div>

</details>
<details className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Megaphone} title="Avisos, áudio e letreiro" description="Mensagens prontas, recados personalizados e som." badge={activeAlert ? 'Aviso na saída' : 'Pronto para enviar'}/></summary>
      {/* COLUMN 2: ALERTS & AUDIO & LETREIRO */}
      <div className="flex flex-col gap-6">

        {/* ALERTS MODULE */}
        <div className="relative bg-hl-panel border border-hl-line rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col gap-4">
          <div className="border-b border-hl-line-soft pb-3 flex items-center justify-between">
            <h3 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 font-sans">
              <Bell className="w-4 h-4 text-hl-gold drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
              Disparador de Alertas
            </h3>
            {activeAlert && (
              <span className="text-[8px] bg-hl-gold/20 border border-hl-gold/40 text-hl-gold-bright px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                Alerta Na Tela
              </span>
            )}
          </div>

          {/* ACTIVE ALERT CARD IF ANY */}
          {activeAlert && (
            <div className="bg-hl-gold-well/60 border border-hl-line-strong/60 rounded-xl p-3 flex items-center justify-between text-hl-gold-bright text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2.5 text-left">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce text-hl-gold-bright" />
                <span className="leading-snug truncate max-w-[210px] font-medium font-sans">
                  <strong className="text-hl-gold-bright">Exibindo:</strong> {activeAlert === 'baby' ? ALERTS.baby.message : activeAlert === 'car' ? ALERTS.car.message : activeAlert}
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('activeAlert', null)}
                className="bg-hl-gold hover:bg-hl-gold-bright text-black px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow active:translate-y-[1px]"
              >
                <X className="w-3.5 h-3.5" /> Remover
              </button>
            </div>
          )}

          {/* PRESET CHURCH ALERTS BUTTONS */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono font-extrabold text-hl-muted uppercase tracking-wider">Alertas Rápidos de Igreja</span>
            <div className="grid grid-cols-2 gap-2">
              {CHURCH_ALERT_PRESETS.map((preset) => {
                const isActive = activeAlert === preset.id || activeAlert === preset.msg;
                const PresetIcon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateStateAndBroadcast('activeAlert', isActive ? null : preset.msg)}
                    className={`p-3 rounded-xl border text-[10px] font-extrabold transition-all text-left flex flex-col justify-between cursor-pointer active:translate-y-[1px] ${
                      isActive
                        ? "bg-hl-gold border-hl-gold text-black shadow-[0_0_15px_rgba(255,211,79,0.3)]"
                        : "bg-hl-canvas border-hl-line-soft text-hl-soft hover:border-hl-gold/50 hover:bg-hl-raised shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
                    }`}
                  >
                    <span className="font-extrabold font-sans truncate flex items-center gap-1.5">
                      <PresetIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-black' : 'text-hl-gold'}`} />
                      <span>{preset.title}</span>
                    </span>
                    <span className={`text-[8px] truncate mt-1 ${isActive ? 'text-black/80 font-semibold' : 'text-hl-dim font-mono'}`}>
                      {preset.msg}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BUILDER SELECTOR & CUSTOM INPUT */}
          <div className="flex flex-col gap-2 pt-2 border-t border-hl-line/50">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-hl-dim uppercase tracking-wider">Montar Alerta Específico</span>
              <div className="flex gap-1 bg-hl-canvas p-1 rounded-lg border border-hl-line text-[9px] font-bold">
                <button
                  type="button"
                  onClick={() => setAlertType('custom')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${alertType === 'custom' ? 'bg-hl-gold text-black font-extrabold' : 'text-hl-muted hover:text-white'}`}
                >
                  Livre
                </button>
                <button
                  type="button"
                  onClick={() => setAlertType('car_plate')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${alertType === 'car_plate' ? 'bg-hl-gold text-black font-extrabold' : 'text-hl-muted hover:text-white'}`}
                >
                  <Car className="w-3 h-3 shrink-0" />
                  <span>Carro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlertType('ebi_child')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${alertType === 'ebi_child' ? 'bg-hl-gold text-black font-extrabold' : 'text-hl-muted hover:text-white'}`}
                >
                  <Baby className="w-3 h-3 shrink-0" />
                  <span>Criança</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCustomAlertSubmit} className="flex flex-col gap-2">
              {alertType === 'car_plate' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Placa (Ex: ABC-1234)"
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value)}
                    className="bg-hl-canvas border border-hl-line rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-hl-gold/50 uppercase font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Modelo/Cor (Ex: Onix Prata)"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="bg-hl-canvas border border-hl-line rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-hl-gold/50"
                  />
                </div>
              )}

              {alertType === 'ebi_child' && (
                <input
                  type="text"
                  placeholder="Nome da criança (Ex: Sofia Rodrigues)"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="bg-hl-canvas border border-hl-line rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-hl-gold/50"
                />
              )}

              {alertType === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="customAlertText"
                    placeholder="Ex: Mãe do Samuel comparacer à EBI..."
                    className="flex-1 bg-hl-canvas border border-hl-line rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-hl-gold/50 font-sans"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-hl-gold hover:bg-hl-gold-strong text-black py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md shadow-amber-500/10"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Alerta
              </button>
            </form>
          </div>

          {/* HISTÓRICO DE ALERTAS RECENTES */}
          {alertHistory.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-hl-line/50">
              <span className="text-[9px] font-bold text-hl-dim uppercase tracking-wider">Histórico Recente</span>
              <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1">
                {alertHistory.map((histMsg, hIdx) => (
                  <div
                    key={hIdx}
                    className="bg-hl-canvas border border-hl-line p-1.5 rounded-lg flex items-center justify-between text-[10px] gap-2 group hover:border-hl-line"
                  >
                    <button
                      onClick={() => handleSendAlertMessage(histMsg)}
                      className="text-left text-hl-soft hover:text-hl-gold-bright truncate flex-1 font-medium cursor-pointer"
                      title="Re-enviar este alerta"
                    >
                      {histMsg}
                    </button>
                    <button
                      onClick={() => handleDeleteHistoryItem(hIdx)}
                      className="p-1 text-hl-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                      title="Excluir do histórico"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PERFORMANCE & ANTI-LAG MODULE */}


        {/* AUDIO MIXER MODULE */}
        <div className="relative bg-hl-panel border border-hl-line rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-4 group">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <h3 className="relative z-10 text-hl-muted font-bold text-[10px] uppercase tracking-[0.2em] border-b border-hl-line pb-3 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            Mixer de Áudio Geral
          </h3>

          <div className="relative z-10">
            <AudioVolumeControl volume={volume} updateStateAndBroadcast={updateStateAndBroadcast} />
          </div>
        </div>

        {/* TICKER MODULE */}
        <div className="relative bg-hl-panel border border-hl-line rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-5 group">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 border-b border-hl-line pb-3 flex items-center justify-between">
            <h3 className="text-hl-muted font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5 text-emerald-500" />
              Letreiro (Ticker)
            </h3>
            {tickerText && (
              <span className="text-[8px] bg-hl-raised border border-emerald-900/50 text-emerald-500 px-2 py-0.5 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] font-bold uppercase tracking-wider animate-pulse">Ativo</span>
            )}
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Reunião de obreiros hoje às 18h..."
                value={tickerText || ''}
                onChange={(e) => updateStateAndBroadcast('tickerText', e.target.value || null)}
                className="flex-1 bg-hl-canvas border border-hl-line rounded-xl px-4 py-3 text-sm font-sans font-medium text-hl-copy placeholder:text-hl-dim shadow-[inset_0_2px_10px_rgba(0,0,0,1)] focus:outline-none focus:border-hl-gold/60 focus:ring-1 focus:ring-hl-gold/40 transition-all"
              />
              {tickerText && (
                <button
                  onClick={() => updateStateAndBroadcast('tickerText', null)}
                  className="px-4 bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-red-900/50 text-red-500 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[2px] active:shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)] transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="Limpar Letreiro"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-1">
              {tickerSuggestions.map((sug) => (
                <button
                  key={sug}
                  onClick={() => updateStateAndBroadcast('tickerText', sug)}
                  className="text-[10px] font-sans font-semibold bg-hl-raised border border-hl-line hover:border-hl-line-strong shadow-[0_2px_4px_rgba(0,0,0,0.5)] px-3 py-1.5 rounded-lg text-hl-soft hover:text-white hover:bg-hl-raised active:translate-y-[1px] transition-all cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

</details>
<details className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Gauge} title="Desempenho e energia" description="Qualidade visual, diagnóstico e tela sempre ligada."/></summary><PerformanceControlModule /></details>
      </div>
      <PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
}
