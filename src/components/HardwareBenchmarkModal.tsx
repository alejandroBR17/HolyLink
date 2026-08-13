import React from 'react';
import {
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Activity,
  X,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Gauge,
  Layers,
  Sparkles,
  Smartphone,
  Laptop,
  Check,
  AlertTriangle
} from 'lucide-react';
import { usePerformanceDiagnostics, PerformanceMode } from '../utils/performance';

interface HardwareBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HardwareBenchmarkModal({ isOpen, onClose }: HardwareBenchmarkModalProps) {
  const {
    fps,
    mode,
    report,
    isDiagnosticRunning,
    diagnosticStep,
    diagnosticProgress,
    runBenchmark,
    setPerformanceMode,
    purgeCache
  } = usePerformanceDiagnostics();

  const [cacheCleared, setCacheCleared] = React.useState(false);

  if (!isOpen) return null;

  const handleClearCache = () => {
    purgeCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const getTierColor = (recommendedMode?: string) => {
    if (recommendedMode === 'high') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (recommendedMode === 'light') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  };

  const getTierBadgeText = (recommendedMode?: string) => {
    if (recommendedMode === 'high') return 'Alto Desempenho (Efeitos Máximos)';
    if (recommendedMode === 'light') return 'Modo Leve (Economia de Recursos)';
    return 'Desempenho Equilibrado';
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#08080a] border border-[#27272a] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden text-left relative">
        
        {/* HEADER */}
        <div className="p-5 border-b border-[#222] flex items-center justify-between bg-[#040405] relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0f0f12] rounded-2xl text-amber-500 border border-amber-900/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
              <Gauge className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-extrabold text-base uppercase tracking-wider font-sans flex items-center gap-2">
                Otimização Inteligente de Hardware
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Análise de CPU, RAM, GPU e Prevenção Ativa Anti-Lag
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-[#111114] border border-[#27272a] hover:border-[#333] transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-zinc-200 relative z-10">
          
          {/* DIAGNOSTIC RUNNER BANNER */}
          <div className="bg-[#030304] border border-[#222] rounded-2xl p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-[#111114] border border-[#27272a] rounded-xl text-amber-500 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                  <Activity className={`w-6 h-6 ${isDiagnosticRunning ? 'animate-spin text-amber-400' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
                      Pontuação do Hardware: {report ? `${report.score} / 100` : 'Calculando...'}
                    </span>
                    {report && (
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] ${getTierColor(report.recommendedMode)}`}>
                        {getTierBadgeText(report.recommendedMode)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed flex items-center gap-1.5">
                    {report?.isTouchDevice ? (
                      <>
                        <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Dispositivo Móvel Detectado: Modo de economia ativado para preservar energia e estabilizar taxa de quadros.</span>
                      </>
                    ) : (
                      <>
                        <Laptop className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Computador / Notebook de Operação: Analisado para projeção fluida em alta resolução.</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={runBenchmark}
                disabled={isDiagnosticRunning}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-black px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 active:translate-y-[1px]"
              >
                <RefreshCw className={`w-4 h-4 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
                <span>{isDiagnosticRunning ? 'Analisando...' : 'Executar Teste de Estresse'}</span>
              </button>
            </div>

            {/* PROGRESS BAR ANIMATION */}
            {isDiagnosticRunning && (
              <div className="mt-4 pt-3 border-t border-[#222] space-y-2">
                <div className="flex justify-between text-xs text-zinc-400 font-mono">
                  <span>{diagnosticStep}</span>
                  <span className="text-amber-400 font-bold">{diagnosticProgress}%</span>
                </div>
                <div className="w-full bg-[#0d0d0f] h-3 rounded-full overflow-hidden border border-[#27272a] shadow-[inset_0_2px_4px_rgba(0,0,0,1)]">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    style={{ width: `${diagnosticProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* DETAILED SPECS GRID */}
          <div>
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              Recursos de Hardware Identificados
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* CPU CARD */}
              <div className="bg-[#030304] border border-[#222] rounded-2xl p-3.5 flex items-start gap-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                <div className="p-2 bg-[#111114] rounded-xl border border-[#27272a] text-amber-500 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block font-mono">Processador (CPU)</span>
                  <p className="text-xs font-extrabold text-white truncate">
                    {report?.cpuCores ? `${report.cpuCores} Núcleos Lógicos` : '4 Núcleos'}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Benchmark Math JS: <span className="font-mono text-amber-400 font-bold">{report?.cpuScoreMs || 20}ms</span>
                  </p>
                </div>
              </div>

              {/* RAM & HEAP CARD */}
              <div className="bg-[#030304] border border-[#222] rounded-2xl p-3.5 flex items-start gap-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                <div className="p-2 bg-[#111114] rounded-xl border border-[#27272a] text-blue-400 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block font-mono">Memória RAM & App Heap</span>
                  <p className="text-xs font-extrabold text-white truncate" title={report?.ramDisplay || 'RAM Identificada'}>
                    RAM Total: {report?.ramDisplay || (report?.ramGB ? `${report.ramGB} GB` : '>= 4 GB')}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-full bg-[#0d0d0f] h-2 rounded-full overflow-hidden border border-[#222] flex-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${
                            report?.jsHeapUsedMB && report?.jsHeapLimitMB
                              ? Math.min(100, Math.round((report.jsHeapUsedMB / report.jsHeapLimitMB) * 100))
                              : 25
                          }%`
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-blue-400 font-bold shrink-0">
                      App: {report?.jsHeapUsedMB ? `${report.jsHeapUsedMB} MB` : '10 MB'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPU CARD */}
              <div className="bg-[#030304] border border-[#222] rounded-2xl p-3.5 flex items-start gap-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                <div className="p-2 bg-[#111114] rounded-xl border border-[#27272a] text-purple-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block font-mono">Placa de Vídeo (GPU / WebGL)</span>
                  <p className="text-xs font-extrabold text-white truncate" title={report?.gpuRenderer}>
                    {report?.gpuRenderer || 'Aceleração de Hardware Ativa'}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Textura Máx: <span className="font-mono text-purple-400">{report?.maxTextureSize || 4096}px</span>
                  </p>
                </div>
              </div>

              {/* FPS & DISPLAY CARD */}
              <div className="bg-[#030304] border border-[#222] rounded-2xl p-3.5 flex items-start gap-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                <div className="p-2 bg-[#111114] rounded-xl border border-[#27272a] text-emerald-400 shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block font-mono">Taxa de Quadros (FPS Real)</span>
                  <p className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                    <span className={fps < 38 ? 'text-amber-400 font-mono font-black' : 'text-emerald-400 font-mono font-black'}>{fps} FPS</span>
                    <span className="text-[10px] font-normal text-zinc-400">({fps >= 50 ? 'Estável 60Hz' : fps >= 35 ? 'Fluido' : 'Economia'})</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 truncate" title={`Resolução: ${report?.physicalWidth || report?.screenWidth}x${report?.physicalHeight || report?.screenHeight} px`}>
                    Monitor: <span className="font-mono text-zinc-300 font-bold">{report?.physicalWidth || report?.screenWidth}x{report?.physicalHeight || report?.screenHeight}</span>
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* PERFORMANCE MODE SELECTION */}
          <div>
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Seleção de Perfil de Desempenho
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* AUTO MODE */}
              <button
                onClick={() => setPerformanceMode('auto')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 active:translate-y-[1px] ${
                  mode === 'auto'
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.35)] font-black'
                    : 'bg-[#030304] border-[#222] text-zinc-400 hover:border-[#333]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-xs uppercase tracking-wider ${mode === 'auto' ? 'text-black' : 'text-amber-400'}`}>Automático</span>
                    {mode === 'auto' && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </div>
                  <p className={`text-[10px] mt-1 leading-snug ${mode === 'auto' ? 'text-black/80 font-medium' : 'text-zinc-400'}`}>
                    Ajusta os gráficos dinamicamente.
                  </p>
                </div>
              </button>

              {/* HIGH MODE */}
              <button
                onClick={() => setPerformanceMode('high')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 active:translate-y-[1px] ${
                  mode === 'high'
                    ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.35)] font-black'
                    : 'bg-[#030304] border-[#222] text-zinc-400 hover:border-[#333]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-xs uppercase tracking-wider ${mode === 'high' ? 'text-black' : 'text-emerald-400'}`}>Alto Desempenho</span>
                    {mode === 'high' && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </div>
                  <p className={`text-[10px] mt-1 leading-snug ${mode === 'high' ? 'text-black/80 font-medium' : 'text-zinc-400'}`}>
                    Mantém todos os efeitos visuais e blurs.
                  </p>
                </div>
              </button>

              {/* BALANCED MODE */}
              <button
                onClick={() => setPerformanceMode('balanced')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 active:translate-y-[1px] ${
                  mode === 'balanced'
                    ? 'bg-blue-500 border-blue-400 text-black shadow-[0_0_12px_rgba(59,130,246,0.35)] font-black'
                    : 'bg-[#030304] border-[#222] text-zinc-400 hover:border-[#333]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-xs uppercase tracking-wider ${mode === 'balanced' ? 'text-black' : 'text-blue-400'}`}>Equilibrado</span>
                    {mode === 'balanced' && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </div>
                  <p className={`text-[10px] mt-1 leading-snug ${mode === 'balanced' ? 'text-black/80 font-medium' : 'text-zinc-400'}`}>
                    Equilíbrio ideal para apresentações.
                  </p>
                </div>
              </button>

              {/* LIGHT MODE */}
              <button
                onClick={() => setPerformanceMode('light')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 active:translate-y-[1px] ${
                  mode === 'light'
                    ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.35)] font-black'
                    : 'bg-[#030304] border-[#222] text-zinc-400 hover:border-[#333]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-xs uppercase tracking-wider ${mode === 'light' ? 'text-black' : 'text-amber-400'}`}>Modo Leve</span>
                    {mode === 'light' && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </div>
                  <p className={`text-[10px] mt-1 leading-snug ${mode === 'light' ? 'text-black/80 font-medium' : 'text-zinc-400'}`}>
                    Zero lag para computadores básicos.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* CACHE PURGE & MEMORY CLEANUP ACTION */}
          <div className="bg-[#030304] border border-[#222] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[inset_0_2px_8px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#111114] rounded-xl border border-[#27272a] text-amber-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-extrabold text-white uppercase tracking-wider font-sans">
                  Desobstrução de Memória RAM
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Libera buffers temporários de mídias na RAM sem apagar arquivos do culto.
                </p>
              </div>
            </div>

            <button
              onClick={handleClearCache}
              className={`text-xs font-black px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto active:translate-y-[1px] ${
                cacheCleared
                  ? 'bg-emerald-500 border-emerald-400 text-black font-black shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                  : 'bg-[#111114] border-[#27272a] hover:border-[#333] text-zinc-200 hover:text-white'
              }`}
            >
              {cacheCleared ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Memória RAM Desobstruída!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 text-amber-500" />
                  <span>Limpar RAM Agora</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-[#222] bg-[#040405] flex items-center justify-between relative z-10">
          <span className="text-[10px] text-zinc-500 font-mono font-bold">
            HolyLink Engine v2.4 — Aceleração Anti-Lag Ativa
          </span>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-5 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.35)] active:translate-y-[1px]"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
}
