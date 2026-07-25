import React, { useEffect, useState } from 'react';
import { Sparkles, Gauge, Zap, CheckCircle2, Cpu } from 'lucide-react';
import { mediaPreloader } from '../utils/preloader';
import { usePerformanceDiagnostics } from '../utils/performance';

interface SmartSplashLoaderProps {
  customMediaList: Array<{ id: string; type: 'image' | 'video'; url: string }>;
  onComplete: () => void;
}

export function SmartSplashLoader({ customMediaList, onComplete }: SmartSplashLoaderProps) {
  const [stage, setStage] = useState<'hardware' | 'media' | 'optimizing' | 'ready'>('hardware');
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Avaliando capacidade de hardware...');
  
  const { hardwareConcurrency, isLightModeActive } = usePerformanceDiagnostics();

  useEffect(() => {
    let isMounted = true;

    async function startSmartBoot() {
      // Step 1: Hardware check delay
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;

      setStage('media');
      setStatusText(`Preparações para ${customMediaList.length} mídia(s) em memória cache...`);

      if (customMediaList.length === 0) {
        setProgress(100);
      } else {
        await mediaPreloader.preloadAllInitialMedia(
          customMediaList,
          (completed, total) => {
            if (!isMounted) return;
            const pct = Math.round((completed / total) * 100);
            setProgress(pct);
            setStatusText(`Pré-carregando mídias (${completed}/${total})...`);
          }
        );
      }

      if (!isMounted) return;

      // Step 3: Optimization phase
      setStage('optimizing');
      setStatusText(isLightModeActive ? 'Ativando otimização Anti-Lag para este PC...' : 'Ajustando motor gráfico para alta performance...');
      await new Promise((r) => setTimeout(r, 700));

      if (!isMounted) return;

      // Step 4: Ready
      setStage('ready');
      setProgress(100);
      setStatusText('Sistema de Transmissão Pronto!');
      await new Promise((r) => setTimeout(r, 500));

      if (isMounted) {
        onComplete();
      }
    }

    startSmartBoot();

    return () => {
      isMounted = false;
    };
  }, [customMediaList]);

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo / Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/30 flex items-center justify-center mb-5 shadow-inner">
          <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>

        <h1 className="text-xl font-extrabold tracking-tight text-zinc-100 mb-1">
          Holyrics Projection Pro
        </h1>
        <p className="text-xs text-zinc-500 font-medium mb-6">
          Sincronizador Inteligente de Transmissão
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 mb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-mono text-[11px] font-semibold">{statusText}</span>
            <span className="font-mono font-bold text-amber-500">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50 p-0.5 relative">
            <div 
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* System Diagnostic Badge */}
        <div className="w-full grid grid-cols-2 gap-2 text-left">
          <div className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-xl flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-amber-500/80 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold uppercase">Processador</span>
              <span className="text-[11px] font-mono font-semibold text-zinc-300">{hardwareConcurrency} Cores CPU</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-xl flex items-center gap-2.5">
            {isLightModeActive ? (
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold uppercase">Motor</span>
              <span className="text-[11px] font-mono font-semibold text-zinc-300">
                {isLightModeActive ? 'Modo Anti-Lag' : 'Alta Performance'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-zinc-600 mt-6 font-medium">
          Carregamento em memória ativado para eliminar engasgos na 2ª tela.
        </p>
      </div>
    </div>
  );
}
