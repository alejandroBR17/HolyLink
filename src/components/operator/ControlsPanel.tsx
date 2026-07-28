import React, { FormEvent, useState, useEffect, useRef } from 'react';
import { 
  Tv, ExternalLink, X, EyeOff, Sparkles, Plus, Minus, Play, Pause, RefreshCw, 
  Bell, AlertTriangle, Trash2, Send, VolumeX, Volume2, Megaphone, Cpu, Zap, Gauge, CheckCircle2, HardDrive 
} from 'lucide-react';
import { ALERTS } from '../../data';
import { Meeting } from '../../types';
import { usePerformanceDiagnostics } from '../../utils/performance';

function PerformanceControlModule() {
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

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      <div className="border-b border-zinc-800/50 pb-3 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-amber-500" />
          Desempenho & Anti-Travamento
        </h3>
        <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
          effectiveMode === 'light' 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
            : effectiveMode === 'balanced'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {effectiveMode === 'light' 
            ? (isDetectedLowPerf ? '⚡ Leve (Lag Detectado)' : '⚡ Modo Leve (Anti-Lag)') 
            : effectiveMode === 'balanced'
            ? '⚖️ Modo Equilibrado'
            : '🟢 Alta Qualidade'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-zinc-950 border border-zinc-800/80 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] text-zinc-500 font-bold uppercase">Taxa FPS</span>
          <span className={`font-mono font-bold text-xs mt-0.5 ${fps < 38 ? 'text-amber-400' : 'text-emerald-400'}`}>{fps} FPS</span>
        </div>
        <div className="bg-zinc-950 border border-zinc-800/80 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] text-zinc-500 font-bold uppercase">CPU Cores</span>
          <span className="font-mono font-bold text-xs text-zinc-300 mt-0.5">{hardwareConcurrency} Cores</span>
        </div>
        <div className="bg-zinc-950 border border-zinc-800/80 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] text-zinc-500 font-bold uppercase">Memória RAM</span>
          <span className="font-mono font-bold text-xs text-blue-400 mt-0.5 truncate" title={report?.ramDisplay || 'RAM Identificada'}>
            {report?.ramDisplay || (report?.ramGB ? `${report.ramGB} GB` : '>= 4 GB')}
          </span>
        </div>
        <div className="bg-zinc-950 border border-zinc-800/80 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] text-zinc-500 font-bold uppercase">Heap JS</span>
          <span className="font-mono font-bold text-xs text-purple-400 mt-0.5 truncate">
            {report?.jsHeapUsedMB ? `${report.jsHeapUsedMB} MB` : 'Ativo'}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-xl text-[10px] leading-relaxed text-zinc-400">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
        <div>
          {effectiveMode === 'light' ? (
            <span><strong>Modo Leve (Anti-Lag) Ativo:</strong> Renderização direta sem duplicar decodificadores de vídeo, sem partículas e sem heavy blur para eliminação total de lag.</span>
          ) : effectiveMode === 'balanced' ? (
            <span><strong>Modo Equilibrado Ativo:</strong> Transições suaves com fade rápido sem sobrecarregar a memória RAM nem a placa gráfica do computador.</span>
          ) : (
            <span><strong>Alta Qualidade Ativa:</strong> Exibe fundo desfocado em tempo real, iluminação ambiente dinâmica, partículas e transições suaves.</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handlePurgeRam}
          className={`w-full py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            ramCleared 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
              : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-300'
          }`}
        >
          <HardDrive className={`w-3.5 h-3.5 ${ramCleared ? 'text-emerald-400 animate-bounce' : 'text-blue-400'}`} />
          <span>{ramCleared ? '✓ Memória Cache Liberada!' : 'Limpar Memória RAM e Cache'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Perfil Manual de Desempenho</span>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => setPerformanceMode('auto')}
            className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
              mode === 'auto'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-500'
            }`}
          >
            Auto
          </button>
          <button
            onClick={() => setPerformanceMode('light')}
            className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border flex items-center justify-center gap-1 ${
              mode === 'light'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-500'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
            Leve
          </button>
          <button
            onClick={() => setPerformanceMode('balanced')}
            className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
              mode === 'balanced'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-500'
            }`}
          >
            Equilibrado
          </button>
          <button
            onClick={() => setPerformanceMode('high')}
            className={`py-2 px-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
              mode === 'high'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-500'
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Volume da Transmissão</span>
        <span className="text-xs font-mono font-bold text-amber-500">{Math.round(displayVolume * 100)}%</span>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => handlePresetClick(displayVolume === 0 ? 0.5 : 0)}
          className={`p-2.5 rounded-xl transition-all border cursor-pointer ${
            displayVolume === 0 
              ? 'bg-red-500/10 border-red-500/30 text-red-500' 
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title={displayVolume === 0 ? "Ativar Áudio" : "Silenciar"}
        >
          {displayVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
            className="w-full h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 focus:outline-none"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-1.5">
        <button 
          onClick={() => handlePresetClick(0)} 
          className={`py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase cursor-pointer border ${
            displayVolume === 0 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Mudo
        </button>
        <button 
          onClick={() => handlePresetClick(0.25)} 
          className={`py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase cursor-pointer border ${
            Math.abs(displayVolume - 0.25) < 0.05 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          25%
        </button>
        <button 
          onClick={() => handlePresetClick(0.5)} 
          className={`py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase cursor-pointer border ${
            Math.abs(displayVolume - 0.5) < 0.05 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          50%
        </button>
        <button 
          onClick={() => handlePresetClick(1)} 
          className={`py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase cursor-pointer border ${
            displayVolume === 1 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          100%
        </button>
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
  updateStateAndBroadcast: (key: string, value: any) => void;
  currentTime: Date;
  isProjectionOpen?: boolean;
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
  updateStateAndBroadcast,
  currentTime,
  isProjectionOpen = false
}: ControlsPanelProps) {

  const handleOpenMonitor = () => {
    const projectionUrl = `${window.location.origin}${window.location.pathname}?projection`;
    try {
      const newWin = window.open(projectionUrl, 'holyrics_projection', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
      setProjectionWin(newWin);
    } catch (e) {
      console.warn("Could not open projection window:", e);
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

  const handleCustomAlertSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('customAlertText') as HTMLInputElement;
    if (input && input.value.trim()) {
      updateStateAndBroadcast('activeAlert', input.value.trim());
      input.value = "";
    }
  };

  const tickerSuggestions = [
    "Bem-vindos à Casa de Deus!",
    "Participe da Corrente dos 70 às 15h.",
    "PIX de Ofertas: dízimos@universal.org"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in duration-200">
      
      {/* COLUMN 1: PROJECTION & TIMERS */}
      <div className="flex flex-col gap-6">
        
        {/* QUICK ACTION BUTTONS */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <Tv className="w-4.5 h-4.5 text-amber-500" />
            Controle de Saída HDMI
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled)}
              className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                blackoutEnabled
                  ? "bg-red-600/10 border-red-500/60 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.15)]"
                  : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <EyeOff className={`w-6 h-6 ${blackoutEnabled ? "animate-pulse" : "text-zinc-500"}`} />
              <div className="text-center">
                <p className="font-bold text-xs">{blackoutEnabled ? "Tela Preta Ativa" : "Tela Preta"}</p>
                <p className="text-[9px] text-zinc-500 font-normal mt-0.5">Corta a transmissão</p>
              </div>
            </button>

            <button
              onClick={() => updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled)}
              className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                clearContentEnabled
                  ? "bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                  : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <Sparkles className={`w-6 h-6 ${clearContentEnabled ? "text-amber-500" : "text-zinc-500"}`} />
              <div className="text-center">
                <p className="font-bold text-xs">{clearContentEnabled ? "Texto Ocultado" : "Limpar Slide"}</p>
                <p className="text-[9px] text-zinc-500 font-normal mt-0.5">Mantém apenas o fundo</p>
              </div>
            </button>
          </div>

          {!isProjectionOpen ? (
            <button
              onClick={handleOpenMonitor}
              className="w-full p-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 animate-in fade-in duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Monitor HDMI (2ª Tela)
            </button>
          ) : (
            <button
              onClick={handleCloseMonitor}
              className="w-full p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer animate-in fade-in duration-200"
            >
              <X className="w-4 h-4" />
              Fechar Monitor HDMI
            </button>
          )}
        </div>

        {/* TIMER COUNTDOWN CARD */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="border-b border-zinc-800/50 pb-3 flex items-center justify-between">
            <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Cronômetro de Reunião</h3>
            <span className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-500 font-mono px-2 py-0.5 rounded-md">
              Ajustável
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Próxima Reunião</span>
              <p className="text-sm font-bold text-zinc-100 mt-1">
                <span className="text-amber-500">{nextMeeting.dayName}</span> às {nextMeeting.time}
              </p>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed truncate max-w-[180px] mt-0.5">{nextMeeting.theme}</p>
            </div>
            
            <div className="text-center bg-zinc-950 border border-zinc-800 px-5 py-2.5 rounded-xl w-full sm:w-auto min-w-[130px] shadow-inner">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider block">Regressiva</span>
              <p className="text-3xl font-mono font-black text-amber-500 tracking-widest mt-0.5 animate-pulse">
                {hoursStr}:{minutesStr}
              </p>
            </div>
          </div>

          {/* TIMER ACTIONS */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 60 * 1000)}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                title="Avançar 1 minuto"
              >
                <Plus className="w-3 h-3 text-emerald-500" /> 1m
              </button>
              <button
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 5 * 60 * 1000)}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                title="Avançar 5 minutos"
              >
                <Plus className="w-3 h-3 text-emerald-500" /> 5m
              </button>
              <button
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 30 * 60 * 1000)}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                title="Avançar 30 minutos"
              >
                <Plus className="w-3 h-3 text-emerald-400" /> 30m
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 60 * 1000)}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                title="Voltar 1 minuto"
              >
                <Minus className="w-3 h-3 text-red-500" /> 1m
              </button>
              <button
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 5 * 60 * 1000)}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                title="Voltar 5 minutos"
              >
                <Minus className="w-3 h-3 text-red-500" /> 5m
              </button>
              <button
                onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 30 * 60 * 1000)}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                title="Voltar 30 minutos"
              >
                <Minus className="w-3 h-3 text-red-400" /> 30m
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleToggleTimerPlayPause}
              className={`text-xs font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                countdownPaused 
                  ? "bg-emerald-500 text-black hover:bg-emerald-600 shadow-lg shadow-emerald-500/10" 
                  : "bg-zinc-950 text-red-400 border border-zinc-800 hover:border-red-900/30 hover:bg-red-950/10"
              }`}
            >
              {countdownPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {countdownPaused ? "Retomar" : "Pausar"}
            </button>
            
            <button
              onClick={handleResetTimer}
              className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border border-zinc-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-500" /> Resetar
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 2: ALERTS & AUDIO & LETREIRO */}
      <div className="flex flex-col gap-6">
        
        {/* ALERTS MODULE */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider border-b border-zinc-800/50 pb-3">
            Disparador de Alertas Visuais
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => updateStateAndBroadcast('activeAlert', activeAlert === 'baby' ? null : 'baby')}
              className={`p-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeAlert === 'baby'
                  ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10"
                  : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              {ALERTS.baby.buttonTitle}
            </button>
            
            <button
              onClick={() => updateStateAndBroadcast('activeAlert', activeAlert === 'car' ? null : 'car')}
              className={`p-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeAlert === 'car'
                  ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10"
                  : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              {ALERTS.car.buttonTitle}
            </button>
          </div>

          <form onSubmit={handleCustomAlertSubmit} className="flex gap-2">
            <input
              type="text"
              name="customAlertText"
              placeholder="Ex: Mãe da Sofia comparecer à EBI..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 font-sans"
            />
            <button
              type="submit"
              className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> Enviar
            </button>
          </form>

          {activeAlert && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between text-amber-500 text-xs">
              <div className="flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                <span className="leading-snug truncate max-w-[200px]">
                  <strong>Ativo:</strong> {activeAlert === 'baby' ? ALERTS.baby.message : activeAlert === 'car' ? ALERTS.car.message : activeAlert}
                </span>
              </div>
              <button
                onClick={() => updateStateAndBroadcast('activeAlert', null)}
                className="bg-amber-500/10 hover:bg-amber-500/20 p-1 rounded-full text-amber-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>

        {/* PERFORMANCE & ANTI-LAG MODULE */}
        <PerformanceControlModule />

        {/* AUDIO MIXER MODULE */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider border-b border-zinc-800/50 pb-3">
            Controle de Áudio Geral
          </h3>

          <AudioVolumeControl volume={volume} updateStateAndBroadcast={updateStateAndBroadcast} />
        </div>

        {/* TICKER MODULE */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="border-b border-zinc-800/50 pb-3 flex items-center justify-between">
            <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-amber-500" />
              Letreiro Digital (Ticker)
            </h3>
            {tickerText && (
              <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">Ativo</span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: Reunião de obreiros hoje às 18h..."
                value={tickerText || ''}
                onChange={(e) => updateStateAndBroadcast('tickerText', e.target.value || null)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 font-sans"
              />
              {tickerText && (
                <button 
                  onClick={() => updateStateAndBroadcast('tickerText', null)}
                  className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-all cursor-pointer"
                  title="Limpar Letreiro"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {tickerSuggestions.map((sug) => (
                <button
                  key={sug}
                  onClick={() => updateStateAndBroadcast('tickerText', sug)}
                  className="text-[9px] bg-zinc-950 border border-zinc-850 hover:border-zinc-700 px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
