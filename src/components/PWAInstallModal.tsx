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

  const { iconType, setIconType, iconTheme, setIconTheme, getIconUrl } = usePWAIcons();
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
          className="relative w-full max-w-sm bg-[#08080a] border border-[#27272a] rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] text-zinc-100 overflow-hidden my-auto"
        >
          {/* Header Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-amber-500/15 to-transparent blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#111114] border border-[#27272a] text-zinc-400 hover:text-white hover:border-[#333] transition-all z-10 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`absolute top-4 left-4 p-2 rounded-xl transition-all z-10 cursor-pointer border shadow-[0_2px_8px_rgba(0,0,0,0.8)] active:translate-y-[1px] ${
              showSettings 
                ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black' 
                : 'bg-[#111114] border-[#27272a] text-zinc-400 hover:text-white hover:border-[#333]'
            }`}
            title="Personalizar Ícone"
          >
            <Palette className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            
            {/* Title & App Logo Header */}
            <div className="flex flex-col items-center text-center gap-3 mt-8">
              <div 
                className="w-20 h-20 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-amber-500/40 overflow-hidden relative flex items-center justify-center transition-colors duration-300"
                style={{ 
                  backgroundColor: iconTheme === 'light' ? '#ffffff' : iconTheme === 'dark' ? '#020617' : 'transparent',
                  backgroundImage: iconTheme === 'transparent' ? 'repeating-conic-gradient(#3f3f46 0% 25%, #27272a 0% 50%)' : 'none',
                  backgroundSize: iconTheme === 'transparent' ? '16px 16px' : 'auto'
                }}
              >
                <img
                  src={getIconUrl()}
                  alt="HolyLink Logo"
                  className={`w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] ${iconType === 'symbol' ? 'p-2' : 'p-1'}`}
                />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-wide font-sans">Aplicativo HolyLink</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Instale no celular ou computador para acesso instantâneo, modo tela cheia e operação offline.
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
                  <div className="p-4 rounded-2xl bg-[#030304] border border-[#27272a] shadow-[inset_0_2px_8px_rgba(0,0,0,1)] space-y-4 text-sm">
                    {isInstalled && (
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p>Como o app já está instalado, qualquer mudança exigirá que você <strong>desinstale o aplicativo</strong> e instale novamente para atualizar o ícone na tela inicial.</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Estilo do Ícone</label>
                      <div className="grid grid-cols-3 gap-2">
                        {iconOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setIconType(opt.id)}
                            className={`py-2 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer active:translate-y-[1px] ${
                              iconType === opt.id 
                                ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)] font-black' 
                                : 'bg-[#111114] border-[#222] text-zinc-400 hover:border-[#333]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Cor de Fundo</label>
                      <div className="grid grid-cols-3 gap-2">
                        {themeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setIconTheme(opt.id)}
                            className={`py-2 px-1 text-[10px] font-extrabold rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer active:translate-y-[1px] ${
                              iconTheme === opt.id 
                                ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)] font-black' 
                                : 'bg-[#111114] border-[#222] text-zinc-400 hover:border-[#333]'
                            }`}
                          >
                            <span 
                              className="w-4 h-4 rounded-full border border-zinc-700 block shadow-inner" 
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
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-amber-400 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span className="font-extrabold text-sm uppercase font-mono tracking-wider">Nova Versão Disponível!</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Uma atualização do sistema está pronta. Clique para reiniciar e aplicar.
                </p>
                <button
                  onClick={forceAppUpdate}
                  disabled={isUpdating}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:translate-y-[1px] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span>{isUpdating ? 'Atualizando...' : 'Atualizar Agora'}</span>
                </button>
              </div>
            )}

            {/* Main Status Actions */}
            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm text-emerald-300 font-mono uppercase">App Instalado</p>
                  <p className="text-xs text-emerald-400/80">
                    Você já está executando no aplicativo nativo.
                  </p>
                </div>
              </div>
            ) : isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer active:translate-y-[1px]"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Instalar Aplicativo Nativo</span>
              </button>
            ) : isInIframe ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Navegadores bloqueiam a instalação dentro de prévias do iFrame. Abra em uma guia externa.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewTab}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)] active:translate-y-[1px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir em Guia Externa</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#030304] border border-[#27272a] shadow-[inset_0_2px_8px_rgba(0,0,0,1)] space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider font-mono mb-1">
                  {deviceType === 'ios' ? <Share className="w-4 h-4" /> : deviceType === 'android' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  <span>Instalação no {deviceType === 'ios' ? 'iPhone/iPad' : deviceType === 'android' ? 'Android' : 'Computador'}</span>
                </div>
                
                {deviceType === 'android' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                    <li>Toque nos <strong>três pontos (⋮)</strong> no Chrome.</li>
                    <li>Selecione <strong>"Instalar aplicativo"</strong>.</li>
                  </ol>
                )}

                {deviceType === 'ios' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                    <li>No Safari, toque no ícone <strong>Compartilhar <Share className="w-3 h-3 inline-block text-amber-500 mx-0.5" /></strong>.</li>
                    <li>Selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                  </ol>
                )}

                {deviceType === 'desktop' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                    <li>Acesse via <strong>Chrome</strong> ou <strong>Edge</strong>.</li>
                    <li>Clique no ícone de <strong>instalar <Monitor className="w-3 h-3 inline-block text-amber-500 mx-0.5" /></strong> na barra de endereços (URL).</li>
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
