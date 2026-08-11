import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, ExternalLink, X, Smartphone, Monitor, Share, CheckCircle2, Sparkles, Info, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  const { isInstallable, isInstalled, isInIframe, triggerInstall } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios' | 'desktop'>('auto');

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-850 rounded-3xl p-6 shadow-2xl text-zinc-100 overflow-hidden"
        >
          {/* Header Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-amber-500/20 to-transparent blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & App Icon */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src="/icon-192.jpg"
              alt="HolyLink Logo"
              className="w-16 h-16 rounded-2xl shadow-lg border border-amber-500/30 object-cover"
              onError={(e) => {
                // Fallback if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-wide">Instalar HolyLink</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                  App PWA
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Instale no seu Celular ou Computador para acesso rápido e tela cheia.
              </p>
            </div>
          </div>

          {/* Main Status / Direct Action */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-sm">HolyLink já está instalado!</p>
                <p className="text-xs text-emerald-400/80">
                  Você já está executando o aplicativo em modo nativo Standalone.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="mb-6">
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-5 h-5" />
                <span>Instalar Aplicativo Agora</span>
              </button>
            </div>
          ) : isInIframe ? (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  <strong>Atenção:</strong> Você está visualizando a prévia dentro do editor. Por segurança, navegadores bloqueiam a instalação PWA dentro de quadros (iframes).
                </p>
              </div>
              <button
                onClick={handleOpenNewTab}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir em Nova Aba para Instalar</span>
              </button>
            </div>
          ) : null}

          {/* Platform Instructions Selector */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Instruções de Instalação Manual
            </p>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveTab('android')}
                className={`py-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'android' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`py-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'ios' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>iPhone/iPad</span>
              </button>

              <button
                onClick={() => setActiveTab('desktop')}
                className={`py-2 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'desktop' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Computador</span>
              </button>
            </div>

            {/* Tab content */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 space-y-2.5">
              {activeTab === 'android' && (
                <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                  <li>Abra o HolyLink no <strong>Google Chrome</strong> do seu Android.</li>
                  <li>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito.</li>
                  <li>Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>Confirme e o ícone do HolyLink aparecerá na sua gaveta de apps.</li>
                </ol>
              )}

              {activeTab === 'ios' && (
                <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                  <li>Abra o link no navegador <strong>Safari</strong> do iPhone/iPad.</li>
                  <li>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima ⎋ na barra inferior).</li>
                  <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
                </ol>
              )}

              {(activeTab === 'desktop' || activeTab === 'auto') && (
                <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                  <li>Acesse o link direto no <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> ou <strong>Brave</strong>.</li>
                  <li>Observe o lado direito da barra de endereço (onde fica a URL do site).</li>
                  <li>Clique no ícone de <strong>instalar (🖥️ ou ➕)</strong> que aparece ao lado da barra.</li>
                  <li>O aplicativo será aberto em uma janela própria de área de trabalho sem barras do navegador.</li>
                </ol>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1 text-emerald-500/80">
              <ShieldCheck className="w-3.5 h-3.5" /> Suporte a PWA nativo e offline ativado
            </span>
            <button
              onClick={handleOpenNewTab}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium underline transition-colors cursor-pointer"
            >
              Link Direto <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
