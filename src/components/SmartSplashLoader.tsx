import React, { useEffect, useState } from 'react';
import { Sparkles, Gauge, Zap, CheckCircle2, Cpu, ShieldCheck, AlertCircle, ArrowRight, Volume2, HardDrive, Bell, Monitor } from 'lucide-react';
import { mediaPreloader } from '../utils/preloader';
import { usePerformanceDiagnostics } from '../utils/performance';
import { checkAllPermissions, requestSinglePermission, PermissionStatusItem } from '../utils/permissions';

interface SmartSplashLoaderProps {
  customMediaList: Array<{ id: string; type: 'image' | 'video'; url: string }>;
  onComplete: () => void;
}

export function SmartSplashLoader({ customMediaList, onComplete }: SmartSplashLoaderProps) {
  const [stage, setStage] = useState<'splash' | 'loader' | 'permissions' | 'ready'>('splash');
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Iniciando Holyrics Projection...');
  const [permissions, setPermissions] = useState<PermissionStatusItem[]>([]);
  const [isGranting, setIsGranting] = useState<boolean>(false);

  const { hardwareConcurrency, effectiveMode } = usePerformanceDiagnostics();

  // Helper to re-check permissions state
  const refreshPermissions = async () => {
    const list = await checkAllPermissions();
    setPermissions(list);
    return list;
  };

  useEffect(() => {
    let isMounted = true;

    async function runBootSequence() {
      // ETAPA 1: SPLASH SCREEN (Apresentação Visual)
      setStage('splash');
      setStatusText('Carregando Painel de Transmissão...');
      for (let p = 0; p <= 100; p += 20) {
        if (!isMounted) return;
        setProgress(p);
        await new Promise((r) => setTimeout(r, 150));
      }

      if (!isMounted) return;

      // ETAPA 2: LOADER DE RECURSOS E MÍDIAS
      setStage('loader');
      setStatusText('Verificando hardware e armazenamento...');
      setProgress(10);
      await new Promise((r) => setTimeout(r, 300));
      if (!isMounted) return;

      if (customMediaList.length === 0) {
        setProgress(100);
        setStatusText('Recursos e mídias prontos!');
      } else {
        await mediaPreloader.preloadAllInitialMedia(
          customMediaList,
          (completed, total) => {
            const pct = Math.round((completed / total) * 100);
            setProgress(pct);
            setStatusText(`Pré-carregando mídias (${completed}/${total})...`);
          }
        );
      }

      await new Promise((r) => setTimeout(r, 200));
      if (!isMounted) return;

      // ETAPA 3: FINALIZAÇÃO RÁPIDA
      setStage('ready');
      setProgress(100);
      setStatusText('Tudo pronto! Entrando na aplicação...');
      await new Promise((r) => setTimeout(r, 300));
      if (!isMounted) return;
      onComplete();
    }

    runBootSequence();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGrantPermission = async (id: PermissionStatusItem['id']) => {
    setIsGranting(true);
    try {
      await requestSinglePermission(id);
      const updated = await refreshPermissions();

      const remainingPrompt = updated.some((p) => p.status === 'prompt');
      if (!remainingPrompt) {
        setStage('ready');
        setStatusText('Permissões concedidas! Entrando...');
        await new Promise((r) => setTimeout(r, 400));
        onComplete();
      }
    } finally {
      setIsGranting(false);
    }
  };

  const handleAdvance = () => {
    onComplete();
  };

  const getPermIcon = (id: PermissionStatusItem['id']) => {
    switch (id) {
      case 'audio': return <Volume2 className="w-4 h-4 text-amber-500" />;
      case 'storage': return <HardDrive className="w-4 h-4 text-amber-500" />;
      case 'notifications': return <Bell className="w-4 h-4 text-amber-500" />;
      case 'wakelock': return <Monitor className="w-4 h-4 text-amber-500" />;
      default: return <ShieldCheck className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo / Header */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="h-16 px-4 py-1.5 rounded-2xl bg-zinc-950/80 border border-amber-500/30 flex items-center justify-center shadow-xl overflow-hidden backdrop-blur-md">
            <img src="/logo-full.png?v=8" alt="HolyLink Logo Completo" className="h-full w-auto object-contain" />
          </div>
        </div>

        <h1 className="text-xl font-extrabold tracking-tight text-zinc-100 mb-0.5">
          HolyLink
        </h1>
        <p className="text-[11px] text-zinc-500 font-medium mb-5">
          {stage === 'splash' && 'Painel de Transmissão Inteligente'}
          {stage === 'loader' && 'Pré-carregamento e Verificação de Recursos'}
          {stage === 'permissions' && 'Verificação de Permissões do Navegador'}
          {stage === 'ready' && 'Sistema Pronto'}
        </p>

        {/* STAGE 1 & 2: SPLASH / LOADER PROGRESS BAR */}
        {(stage === 'splash' || stage === 'loader') && (
          <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3.5 mb-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono text-[11px] font-semibold truncate max-w-[280px]">{statusText}</span>
              <span className="font-mono font-bold text-amber-500">{progress}%</span>
            </div>

            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50 p-0.5 relative">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* STAGE 3: PERMISSIONS INTERACTIVE LIST */}
        {stage === 'permissions' && (
          <div className="w-full bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-4 mb-4 flex flex-col gap-3 text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Permissões Recomendadas</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Status</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {permissions.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                    item.status === 'granted'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : item.status === 'prompt'
                      ? 'bg-amber-500/10 border-amber-500/40 text-zinc-200'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="shrink-0">{getPermIcon(item.id)}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">{item.title}</span>
                      <span className="text-[10px] text-zinc-400 truncate leading-tight">{item.description}</span>
                    </div>
                  </div>

                  {item.status === 'granted' && (
                    <span className="shrink-0 text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </span>
                  )}

                  {item.status === 'prompt' && (
                    <button
                      onClick={() => handleGrantPermission(item.id)}
                      disabled={isGranting}
                      className="shrink-0 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow disabled:opacity-50"
                    >
                      Permitir
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAdvance}
              className="w-full mt-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <span>Entrar na Aplicação</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

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
            {effectiveMode === 'light' ? (
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            ) : effectiveMode === 'balanced' ? (
              <Gauge className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 font-bold uppercase">Motor</span>
              <span className="text-[11px] font-mono font-semibold text-zinc-300">
                {effectiveMode === 'light' ? 'Modo Anti-Lag' : effectiveMode === 'balanced' ? 'Modo Equilibrado' : 'Alta Performance'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-zinc-600 mt-5 font-medium">
          Sincronização em memória e armazenamento persistente salvos.
        </p>
      </div>
    </div>
  );
}

