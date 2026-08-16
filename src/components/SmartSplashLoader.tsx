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
    <div className="fixed inset-0 h-[100dvh] w-full z-[9999] bg-[#050507] text-white flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans relative">
      {/* Background static rack texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Main Console Rack Chassis */}
      <div className="max-w-md w-full m-auto bg-[#0a0a0d] border border-[#27272a] rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Rack Mount Screws (4 corners for physical rack unit feel) */}
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-950 border border-zinc-600/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none opacity-80">
          <div className="w-1.5 h-[1px] bg-zinc-400 rotate-45" />
        </div>
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-950 border border-zinc-600/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none opacity-80">
          <div className="w-1.5 h-[1px] bg-zinc-400 -rotate-45" />
        </div>
        <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-950 border border-zinc-600/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none opacity-80">
          <div className="w-1.5 h-[1px] bg-zinc-400 -rotate-45" />
        </div>
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-950 border border-zinc-600/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none opacity-80">
          <div className="w-1.5 h-[1px] bg-zinc-400 rotate-45" />
        </div>

        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo / Header */}
        <div className="flex flex-col items-center justify-center mb-4 relative z-10">
          <div className="h-16 px-5 py-2 rounded-2xl bg-[#030304] border border-[#333] flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,1)] overflow-hidden min-w-[160px]">
            <img 
              src="/logo-full.png" 
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
                const fb = document.getElementById('splash-logo-fallback');
                if (fb) fb.style.display = 'flex';
              }}
              alt="HolyLink" 
              className="h-full w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
            />
            <div id="splash-logo-fallback" className="hidden items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                <span className="text-amber-400 font-black text-xs font-mono">HL</span>
              </div>
              <span className="font-sans font-black text-xl tracking-widest text-amber-400">HOLYLINK</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100 font-sans uppercase">
            Painel do Operador - HolyLink
          </h1>
        </div>
        <p className="text-[11px] text-zinc-400 font-medium mb-5 font-sans relative z-10">
          {stage === 'splash' && 'Inicializando Sistema de Transmissão'}
          {stage === 'loader' && 'Sincronização e Leitura de Hardware'}
          {stage === 'permissions' && 'Verificação de Permissões de Áudio e Mídia'}
          {stage === 'ready' && 'Sistema Pronto para Operação'}
        </p>

        {/* STAGE 1 & 2: SPLASH / LOADER PROGRESS BAR */}
        {(stage === 'splash' || stage === 'loader') && (
          <div className="w-full bg-[#030304] border border-[#222] rounded-2xl p-4 mb-4 flex flex-col gap-3 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-mono text-[11px] font-bold truncate max-w-[280px] text-left">{statusText}</span>
              <span className="font-mono font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">{progress}%</span>
            </div>

            <div className="w-full h-3 bg-[#0d0d0f] rounded-full overflow-hidden border border-[#27272a] p-0.5 relative shadow-[inset_0_2px_4px_rgba(0,0,0,1)]">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: PERMISSIONS INTERACTIVE LIST */}
        {stage === 'permissions' && (
          <div className="w-full bg-[#030304] border border-amber-900/50 rounded-2xl p-4 mb-4 flex flex-col gap-3 text-left relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-[#222] pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">Permissões de Sistema</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Status</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {permissions.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] ${
                    item.status === 'granted'
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : item.status === 'prompt'
                      ? 'bg-amber-950/40 border-amber-800/60 text-zinc-200'
                      : 'bg-[#0d0d0f] border-[#222] text-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="shrink-0">{getPermIcon(item.id)}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-extrabold truncate">{item.title}</span>
                      <span className="text-[10px] text-zinc-400 truncate leading-tight">{item.description}</span>
                    </div>
                  </div>

                  {item.status === 'granted' && (
                    <span className="shrink-0 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </span>
                  )}

                  {item.status === 'prompt' && (
                    <button
                      onClick={() => handleGrantPermission(item.id)}
                      disabled={isGranting}
                      className="shrink-0 bg-amber-500 hover:bg-amber-400 active:translate-y-[1px] text-black text-[10px] font-black px-3 py-1 rounded-lg transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)] disabled:opacity-50"
                    >
                      Permitir
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAdvance}
              className="w-full mt-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.35)] active:translate-y-[1px]"
            >
              <span>Entrar na Aplicação</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* System Diagnostic Badge */}
        <div className="w-full grid grid-cols-2 gap-2 text-left relative z-10">
          <div className="bg-[#030304] border border-[#222] p-3 rounded-xl flex items-center gap-2.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
            <Cpu className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 font-black uppercase font-mono">Processador</span>
              <span className="text-[11px] font-mono font-bold text-zinc-300">{hardwareConcurrency} Cores CPU</span>
            </div>
          </div>

          <div className="bg-[#030304] border border-[#222] p-3 rounded-xl flex items-center gap-2.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
            {effectiveMode === 'light' ? (
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            ) : effectiveMode === 'balanced' ? (
              <Gauge className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 font-black uppercase font-mono">Motor GPU</span>
              <span className="text-[11px] font-mono font-bold text-zinc-300">
                {effectiveMode === 'light' ? 'Anti-Lag' : effectiveMode === 'balanced' ? 'Equilibrado' : 'Alta Performance'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-zinc-500 mt-5 font-medium relative z-10 font-mono">
          Hardware acelerado por GPU & Banco de Dados em Memória.
        </p>
      </div>
    </div>
  );
}

