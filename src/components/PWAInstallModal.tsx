import {useDialogFocus} from '../hooks/useDialogFocus';
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
    isInstalling,
    installMessage,
    triggerInstall,
    forceAppUpdate
  } = usePWAInstall();

  const { iconType, setIconType, iconTheme, setIconTheme, getIconUrl, downloadUrl, requiresReload, applyIcon } = usePWAIcons();
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const dialogRef = useDialogFocus(isOpen, onClose);
  if (!isOpen) return null;

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleInstallClick = async () => {
    await triggerInstall();
  };

  const iconOptions: { id: PWAIconType; label: string }[] = [
    { id: 'symbol', label: 'Símbolo' },
    { id: 'full', label: 'Logo Completo' },
    { id: 'text', label: 'Tipografia' },
  ];

  const themeOptions: { id: PWAIconTheme; label: string; color: string }[] = [
    { id: 'dark', label: 'Escuro', color: '#030305' },
    { id: 'light', label: 'Claro', color: '#ffffff' },
    { id: 'transparent', label: 'Sem fundo', color: 'transparent' },
  ];

  return (
    <AnimatePresence>
      <div className="holy-theme holy-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          ref={dialogRef} role="dialog" aria-modal="true" aria-label="Aplicativo HolyLink" tabIndex={-1} className="holy-dialog relative w-full max-w-sm bg-hl-panel border border-hl-line rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] text-hl-copy max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain my-auto"
        >
          {/* Header Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-hl-gold/15 to-transparent blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 min-h-11 min-w-11 p-2 rounded-xl bg-hl-raised border border-hl-line text-hl-muted hover:text-white hover:border-hl-line transition-all z-10 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`absolute top-4 left-4 min-h-11 min-w-11 p-2 rounded-xl transition-all z-10 cursor-pointer border shadow-[0_2px_8px_rgba(0,0,0,0.8)] active:translate-y-[1px] ${
              showSettings
                ? 'bg-hl-gold border-hl-gold text-black shadow-[0_0_12px_rgba(255,211,79,0.4)] font-black'
                : 'bg-hl-raised border-hl-line text-hl-muted hover:text-white hover:border-hl-line'
            }`}
            title="Personalizar Ícone"
          >
            <Palette className="w-5 h-5" />
          </button>

          <div className="space-y-6">

            {/* Title & App Logo Header */}
            <div className="flex flex-col items-center text-center gap-3 mt-8">
              <div
                className="w-20 h-20 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-hl-gold/40 overflow-hidden relative flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: iconTheme === 'light' ? '#ffffff' : iconTheme === 'dark' ? '#030305' : 'transparent',
                  backgroundImage: iconTheme === 'transparent' ? 'repeating-conic-gradient(var(--color-hl-raised) 0% 25%, var(--color-hl-line-soft) 0% 50%)' : 'none',
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
                <p className="text-xs text-hl-muted mt-1 leading-relaxed">
                  Instale no celular ou computador para acesso instantâneo, modo tela cheia e acesso aos recursos já carregados. Consultas novas e conexão entre aparelhos podem precisar de internet.
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
                  <div className="p-4 rounded-2xl bg-hl-canvas border border-hl-line shadow-[inset_0_2px_8px_rgba(0,0,0,1)] space-y-4 text-sm">
                    {isInstalled && (
                      <div className="p-3 rounded-xl bg-hl-gold-well/40 border border-hl-line-strong/60 text-hl-gold-bright text-xs flex items-start gap-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                        <AlertTriangle className="w-4 h-4 text-hl-gold-bright shrink-0 mt-0.5" />
                        <p>O sistema controla a atualização do ícone já instalado. A escolha vale para a próxima instalação; a mudança pode não aparecer imediatamente no app existente.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-black text-hl-gold uppercase tracking-wider font-mono flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Estilo do Ícone</label>
                      <div className="grid grid-cols-3 gap-2">
                        {iconOptions.map((opt) => (
                          <button
                            key={opt.id}
                            aria-pressed={iconType === opt.id}
                            onClick={() => setIconType(opt.id)}
                            className={`py-2 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer active:translate-y-[1px] ${
                              iconType === opt.id
                                ? 'bg-hl-gold border-hl-gold text-black shadow-[0_0_10px_rgba(255,211,79,0.3)] font-black'
                                : 'bg-hl-raised border-hl-line-soft text-hl-muted hover:border-hl-line'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-hl-gold uppercase tracking-wider font-mono flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Cor de Fundo</label>
                      <div className="grid grid-cols-3 gap-2">
                        {themeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            aria-pressed={iconTheme === opt.id}
                            onClick={() => setIconTheme(opt.id)}
                            className={`py-2 px-1 text-[10px] font-extrabold rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer active:translate-y-[1px] ${
                              iconTheme === opt.id
                                ? 'bg-hl-gold border-hl-gold text-black shadow-[0_0_10px_rgba(255,211,79,0.3)] font-black'
                                : 'bg-hl-raised border-hl-line-soft text-hl-muted hover:border-hl-line'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-hl-line block shadow-inner"
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

            <a href={downloadUrl} download={`HolyLink-${iconType}-${iconTheme}.png`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-hl-line bg-hl-raised px-3 py-3 text-sm text-hl-gold"><Download className="h-4 w-4" />Baixar imagem PNG</a>
            {requiresReload && <div className="space-y-3 rounded-xl border border-hl-line p-3 text-xs text-hl-soft"><p>Para usar este ícone na instalação, aplique a escolha antes de instalar. O app será recarregado; faça isso fora da projeção ao vivo. O sistema pode acrescentar um fundo ao ícone transparente.</p><button onClick={applyIcon} className="min-h-11 w-full rounded-xl bg-hl-gold px-3 text-black font-bold">Aplicar ícone e recarregar</button></div>}
            {/* FORCE UPDATE BANNER */}
            {hasUpdateAvailable && (
              <div className="p-4 rounded-2xl bg-hl-gold-well/40 border border-hl-line-strong/60 text-hl-gold-bright space-y-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-hl-gold-bright ${isUpdating ? 'animate-spin' : ''}`} />
                  <span className="font-extrabold text-sm uppercase font-mono tracking-wider">Nova Versão Disponível!</span>
                </div>
                <p className="text-xs text-hl-soft leading-relaxed">
                  Uma atualização do sistema está pronta. Clique para reiniciar e aplicar.
                </p>
                <button
                  onClick={forceAppUpdate}
                  disabled={isUpdating}
                  className="w-full py-3 px-4 rounded-xl bg-hl-gold hover:bg-hl-gold-bright text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(255,211,79,0.35)] transition-all cursor-pointer active:translate-y-[1px] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span>{isUpdating ? 'Atualizando...' : 'Atualizar Agora'}</span>
                </button>
              </div>
            )}

            <div className="flex gap-2" role="group" aria-label="Instruções por dispositivo">{([['android','Android'],['ios','iPhone / iPad'],['desktop','PC / Mac']] as const).map(([id,label]) => <button key={id} onClick={() => setDeviceType(id)} aria-pressed={deviceType === id} className={`min-h-11 flex-1 rounded-xl border px-1 text-xs ${deviceType === id ? 'border-hl-gold text-hl-gold bg-hl-gold/10' : 'border-hl-line text-hl-muted'}`}>{label}</button>)}</div>
            {installMessage && <p role="status" className="rounded-xl border border-hl-line bg-hl-raised p-3 text-sm text-hl-soft">{installMessage}</p>}
            {/* Main Status Actions */}
            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-extrabold text-sm text-emerald-300 font-mono uppercase">App Instalado</p>
                  <p className="text-xs text-emerald-400/80">
                    Instalação confirmada pelo navegador ou execução em janela de aplicativo.
                  </p>
                </div>
              </div>
            ) : isInstallable && !requiresReload ? (
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full py-3.5 px-5 rounded-2xl bg-hl-gold hover:bg-hl-gold-bright text-black font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(255,211,79,0.4)] transition-all cursor-pointer active:translate-y-[1px]"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Instalar HolyLink</span>
              </button>
            ) : isInIframe ? (
              <div className="p-4 rounded-2xl bg-hl-gold-well/40 border border-hl-line-strong/60 text-hl-gold-bright space-y-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-hl-gold-bright shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Navegadores bloqueiam a instalação dentro de prévias do iFrame. Abra em uma guia externa.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewTab}
                  className="w-full py-2.5 px-4 rounded-xl bg-hl-gold hover:bg-hl-gold-bright text-black font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,211,79,0.3)] active:translate-y-[1px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir em Guia Externa</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-hl-canvas border border-hl-line shadow-[inset_0_2px_8px_rgba(0,0,0,1)] space-y-3">
                <div className="flex items-center gap-2 text-hl-gold-bright font-black text-xs uppercase tracking-wider font-mono mb-1">
                  {deviceType === 'ios' ? <Share className="w-4 h-4" /> : deviceType === 'android' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  <span>Instalação no {deviceType === 'ios' ? 'iPhone/iPad' : deviceType === 'android' ? 'Android' : 'Computador'}</span>
                </div>

                {deviceType === 'android' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-hl-soft">
                    <li>Toque nos <strong>três pontos (⋮)</strong> no Chrome.</li>
                    <li>Selecione <strong>"Instalar aplicativo"</strong>.</li>
                  </ol>
                )}

                {deviceType === 'ios' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-hl-soft">
                    <li>No Safari, toque no ícone <strong>Compartilhar <Share className="w-3 h-3 inline-block text-hl-gold mx-0.5" /></strong>.</li>
                    <li>Selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                  </ol>
                )}

                {deviceType === 'desktop' && (
                  <ol className="list-decimal list-inside space-y-2 text-xs text-hl-soft">
                    <li>Acesse via <strong>Chrome</strong> ou <strong>Edge</strong>.</li>
                    <li>Clique no ícone de <strong>instalar <Monitor className="w-3 h-3 inline-block text-hl-gold mx-0.5" /></strong> na barra de endereços (URL).</li>
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
