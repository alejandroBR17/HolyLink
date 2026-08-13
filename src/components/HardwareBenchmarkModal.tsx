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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-left">
        
        {/* HEADER */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-extrabold text-base uppercase tracking-wider flex items-center gap-2">
                Otimização Inteligente de Hardware
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Diagnóstico de CPU, RAM, Placa de Vídeo e Ajuste Automático de Performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-zinc-200">
          
          {/* DIAGNOSTIC RUNNER BANNER */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-inner relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-500 shrink-0 shadow-md">
                  <Activity className={`w-6 h-6 ${isDiagnosticRunning ? 'animate-spin text-amber-400' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-white uppercase tracking-wider">
                      Pontuação do Hardware: {report ? `${report.score} / 100` : 'Calculando...'}
                    </span>
                    {report && (
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-extrabold ${getTierColor(report.recommendedMode)}`}>
                        {getTierBadgeText(report.recommendedMode)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed flex items-center gap-1.5">
                    {report?.isTouchDevice ? (
                      <>
                        <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Dispositivo Móvel Detectado: Modo econômico ativado para preservar bateria e evitar aquecimento.</span>
                      </>
                    ) : (
                      <>
                        <Laptop className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Computador / Notebook de Operação: Analisado para transmissão em alta definição (1080p/4K).</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={runBenchmark}
                disabled={isDiagnosticRunning}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
                <span>{isDiagnosticRunning ? 'Analisando Sistema...' : 'Executar Teste de Estresse'}</span>
              </button>
            </div>

            {/* PROGRESS BAR ANIMATION */}
            {isDiagnosticRunning && (
              <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400 font-mono">
                  <span>{diagnosticStep}</span>
                  <span className="text-amber-400 font-bold">{diagnosticProgress}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
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
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              Recursos de Hardware Identificados
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* CPU CARD */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-amber-500 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Processador (CPU)</span>
                  <p className="text-xs font-extrabold text-white truncate">
                    {report?.cpuCores ? `${report.cpuCores} Núcleos Lógicos` : '4 Núcleos'}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Benchmark Math JS: <span className="font-mono text-amber-400 font-bold">{report?.cpuScoreMs || 20}ms</span>
                  </p>
                </div>
              </div>

              {/* RAM & HEAP CARD */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-blue-400 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Memória RAM do Dispositivo & App</span>
                  <p className="text-xs font-extrabold text-white truncate" title={report?.ramDisplay || 'RAM Identificada'}>
                    RAM Total do Dispositivo: {report?.ramDisplay || (report?.ramGB ? `${report.ramGB} GB` : '>= 4 GB')}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800 flex-1">
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
                    <span className="text-[9px] font-mono text-blue-400 font-bold shrink-0" title="Memória RAM consumida no momento por este sistema de projeção">
                      App usando: {report?.jsHeapUsedMB ? `${report.jsHeapUsedMB} MB` : '10 MB'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPU CARD */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-purple-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Placa de Vídeo (GPU / WebGL)</span>
                  <p className="text-xs font-extrabold text-white truncate" title={report?.gpuRenderer}>
                    {report?.gpuRenderer || 'Aceleração de Hardware Ativa'}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Textura Máx: <span className="font-mono text-purple-400">{report?.maxTextureSize || 4096}px</span>
                  </p>
                </div>
              </div>

              {/* FPS & DISPLAY CARD */}
              <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3.5 flex items-start gap-3">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-emerald-400 shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Taxa de Quadros (FPS Real)</span>
                  <p className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                    <span className={fps < 38 ? 'text-amber-400' : 'text-emerald-400'}>{fps} FPS</span>
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
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Seleção de Perfil de Desempenho
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* AUTO MODE */}
              <button
                onClick={() => setPerformanceMode('auto')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  mode === 'auto'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-zinc-950 border-zinc-850 hover:border-zinc-750 text-zinc-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-amber-400">Automático</span>
                    {mode === 'auto' && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Ajusta os gráficos com base no teste do aparelho.
                  </p>
                </div>
              </button>

              {/* HIGH MODE */}
              <button
                onClick={() => setPerformanceMode('high')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  mode === 'high'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-zinc-950 border-zinc-850 hover:border-zinc-750 text-zinc-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-emerald-400">Alto Desempenho</span>
                    {mode === 'high' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Mantém todos os efeitos visuais, blurs e transições.
                  </p>
                </div>
              </button>

              {/* BALANCED MODE */}
              <button
                onClick={() => setPerformanceMode('balanced')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  mode === 'balanced'
                    ? 'bg-blue-500/10 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-zinc-950 border-zinc-850 hover:border-zinc-750 text-zinc-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-blue-400">Modo Equilibrado</span>
                    {mode === 'balanced' && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Equilíbrio ideal entre fluidez de slides e efeitos visuais.
                  </p>
                </div>
              </button>

              {/* LIGHT MODE */}
              <button
                onClick={() => setPerformanceMode('light')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  mode === 'light'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-zinc-950 border-zinc-850 hover:border-zinc-750 text-zinc-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-amber-400">Modo Leve</span>
                    {mode === 'light' && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    Zero lag para computadores básicos.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* CACHE PURGE & MEMORY CLEANUP ACTION */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Limpeza de Memória RAM
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Libera recursos temporários de mídias na RAM sem apagar arquivos salvos.
                </p>
              </div>
            </div>

            <button
              onClick={handleClearCache}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto active:scale-95 ${
                cacheCleared
                  ? 'bg-emerald-500 border-emerald-400 text-black font-extrabold'
                  : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600 text-zinc-200 hover:text-white'
              }`}
            >
              {cacheCleared ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Memória RAM Liberada!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 text-amber-500" />
                  <span>Limpar Memória RAM</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-mono">
            ProjecaoFJU Hardware Engine v2.4
          </span>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
}
