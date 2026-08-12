import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, ExternalLink, X, Smartphone, Monitor, Share, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Palette, ImageIcon } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { usePWAIcons, PWAIconType, PWAIconTheme } from '../hooks/usePWAIcons';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  const { 
    isInstallable, 
    isInstalled, 
    isInIframe, 
    hasUpdateAvailable,
    isUpdating,
    triggerInstall, 
    forceAppUpdate 
  } = usePWAInstall();

  const { iconType, setIconType, iconTheme, setIconTheme } = usePWAIcons();
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleInstallClick = async () => {
    const success = await triggerInstall();
    if (success) {
      onClose();
    }
  };

  const iconOptions: { id: PWAIconType; label: string }[] = [
    { id: 'symbol', label: 'Símbolo' },
    { id: 'full', label: 'Logo Completo' },
    { id: 'text', label: 'Tipografia' },
  ];

  const themeOptions: { id: PWAIconTheme; label: string; color: string }[] = [
    { id: 'dark', label: 'Escuro', color: '#020617' },
    { id: 'light', label: 'Claro', color: '#ffffff' },
    { id: 'transparent', label: 'Invisível', color: 'transparent' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100 overflow-hidden my-auto"
        >
          {/* Header Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-amber-500/20 to-transparent blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors z-10 cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`absolute top-4 left-4 p-2 rounded-full transition-colors z-10 cursor-pointer ${showSettings ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
            title="Personalizar Ícone"
          >
            <Palette className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            
            {/* Title & App Logo Header */}
            <div className="flex flex-col items-center text-center gap-3 mt-8">
              <div 
                className="w-20 h-20 rounded-2xl shadow-lg border border-amber-500/30 overflow-hidden relative flex items-center justify-center transition-colors duration-300"
                style={{ 
                  backgroundColor: iconTheme === 'light' ? '#ffffff' : iconTheme === 'dark' ? '#020617' : 'transparent',
                  backgroundImage: iconTheme === 'transparent' ? 'repeating-conic-gradient(#3f3f46 0% 25%, #27272a 0% 50%)' : 'none',
                  backgroundSize: iconTheme === 'transparent' ? '16px 16px' : 'auto'
                }}
              >
                <img
                  src={`/pwa/${iconType}-${iconTheme}-192.png?v=12`}
                  alt="HolyLink Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">HolyLink App</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Instale para ter acesso rápido, modo tela cheia e offline.
                </p>
              </div>
            </div>

            {/* Icon Customizer (Collapsible) */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 text-sm">
                    {isInstalled && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Como o app já está instalado, qualquer mudança no ícone exigirá que você <strong>desinstale o aplicativo do celular</strong> e instale novamente para ver o novo ícone na tela inicial.</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Estilo do Ícone</label>
                      <div className="grid grid-cols-3 gap-2">
                        {iconOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setIconType(opt.id)}
                            className={`py-2 text-[10px] font-medium rounded-lg border transition-all cursor-pointer ${iconType === opt.id ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Cor de Fundo</label>
                      <div className="grid grid-cols-3 gap-2">
                        {themeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setIconTheme(opt.id)}
                            className={`py-2 px-1 text-[10px] font-medium rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${iconTheme === opt.id ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                          >
                            <span 
                              className="w-4 h-4 rounded-full border border-zinc-700 block" 
                              style={{ 
                                backgroundColor: opt.color,
                                backgroundImage: opt.id === 'transparent' ? 'repeating-conic-gradient(#52525b 0% 25%, #3f3f46 0% 50%)' : 'none',
                                backgroundSize: opt.id === 'transparent' ? '6px 6px' : 'auto'
                              }}
                            />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FORCE UPDATE BANNER */}
            {hasUpdateAvailable && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-amber-400 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span className="font-bold text-sm">Nova Versão!</span>
                </div>
                <p className="text-xs text-zinc-300">
                  Uma atualização está disponível. Clique para recarregar o sistema.
                </p>
                <button
                  onClick={forceAppUpdate}
                  disabled={isUpdating}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span>{isUpdating ? 'Atualizando...' : 'Atualizar Agora'}</span>
                </button>
              </div>
            )}

            {/* Main Status Actions */}
            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-emerald-300">App Instalado</p>
                  <p className="text-xs text-emerald-400/80">
                    Você já está no aplicativo nativo.
                  </p>
                </div>
              </div>
            ) : isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-5 h-5" />
                <span>Instalar Aplicativo</span>
              </button>
            ) : isInIframe ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Navegadores bloqueiam a instalação dentro de prévias. Abra em uma aba separada.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewTab}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir em Nova Aba</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">
                  {deviceType === 'ios' ? <Share className="w-4 h-4" /> : deviceType === 'android' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  <span>Como instalar no {deviceType === 'ios' ? 'iPhone/iPad' : deviceType === 'android' ? 'Android' : 'Computador'}</span>
                </div>
                
                {deviceType === 'android' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                    <li>Toque nos <strong>três pontos (⋮)</strong> no Chrome.</li>
                    <li>Selecione <strong>"Instalar aplicativo"</strong>.</li>
                  </ol>
                )}

                {deviceType === 'ios' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                    <li>No Safari, toque no ícone <strong>Compartilhar (⎋)</strong>.</li>
                    <li>Selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                  </ol>
                )}

                {deviceType === 'desktop' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                    <li>Acesse via <strong>Chrome</strong> ou <strong>Edge</strong>.</li>
                    <li>Clique no ícone de <strong>instalar (🖥️)</strong> na barra de endereços (URL).</li>
                  </ol>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
