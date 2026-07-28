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
  const [stage, setStage] = useState<'hardware' | 'permissions' | 'media' | 'optimizing' | 'ready'>('hardware');
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Avaliando capacidade de hardware...');
  const [permissions, setPermissions] = useState<PermissionStatusItem[]>([]);
  const [activePermIdx, setActivePermIdx] = useState<number>(0);
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

    async function startSmartBoot() {
      // Step 1: Hardware check delay
      setProgress(15);
      await new Promise((r) => setTimeout(r, 500));
      if (!isMounted) return;

      // Step 2: Check Browser Permissions one-by-one
      setStage('permissions');
      setStatusText('Verificando permissões do navegador...');
      setProgress(30);

      const perms = await refreshPermissions();
      if (!isMounted) return;

      const needsPrompt = perms.some((p) => p.status === 'prompt');

      if (needsPrompt) {
        // Stop automatically and wait for user to click or grant permissions one by one
        setStatusText('Aprovação de permissões necessária para transmissão perfeita');
      } else {
        // All permissions granted or supported, proceed to media stage
        proceedToMediaStage();
      }
    }

    startSmartBoot();

    return () => {
      isMounted = false;
    };
  }, []);

  const proceedToMediaStage = async () => {
    setStage('media');
    setStatusText(`Preparações para ${customMediaList.length} mídia(s) em memória cache...`);
    setProgress(50);

    if (customMediaList.length === 0) {
      setProgress(85);
    } else {
      await mediaPreloader.preloadAllInitialMedia(
        customMediaList,
        (completed, total) => {
          const pct = 50 + Math.round((completed / total) * 35);
          setProgress(pct);
          setStatusText(`Pré-carregando mídias (${completed}/${total})...`);
        }
      );
    }

    // Step 4: Optimization phase
    setStage('optimizing');
    setStatusText(
      effectiveMode === 'light' 
        ? 'Ativando otimização Anti-Lag para este PC...' 
        : effectiveMode === 'balanced'
        ? 'Configurando perfil gráfico Equilibrado...'
        : 'Ajustando motor gráfico para alta performance...'
    );
    setProgress(95);
    await new Promise((r) => setTimeout(r, 600));

    // Step 5: Ready
    setStage('ready');
    setProgress(100);
    setStatusText('Sistema de Transmissão Pronto!');
    await new Promise((r) => setTimeout(r, 400));

    onComplete();
  };

  const handleGrantPermission = async (id: PermissionStatusItem['id']) => {
    setIsGranting(true);
    try {
      await requestSinglePermission(id);
      const updated = await refreshPermissions();

      // Check if any prompt permission still remains
      const remainingPrompt = updated.some((p) => p.status === 'prompt');
      if (!remainingPrompt) {
        await proceedToMediaStage();
      }
    } finally {
      setIsGranting(false);
    }
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
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/30 flex items-center justify-center mb-4 shadow-inner">
          <Sparkles className="w-7 h-7 text-amber-500 animate-pulse" />
        </div>

        <h1 className="text-xl font-extrabold tracking-tight text-zinc-100 mb-0.5">
          Holyrics Projection Pro
        </h1>
        <p className="text-[11px] text-zinc-500 font-medium mb-5">
          Sincronizador Inteligente de Transmissão
        </p>

        {/* Progress Bar Container */}
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

        {/* STAGE: PERMISSIONS INTERACTIVE LIST */}
        {stage === 'permissions' && permissions.some((p) => p.status === 'prompt') && (
          <div className="w-full bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-4 mb-4 flex flex-col gap-3 text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Verificação de Permissões</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">1 por 1</span>
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
              onClick={proceedToMediaStage}
              className="w-full mt-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Continuar sem alterar as restantes</span>
              <ArrowRight className="w-3.5 h-3.5" />
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

