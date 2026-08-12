import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, ExternalLink, X, Smartphone, Monitor, Share, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  const { 
    isInstallable, 
    isInstalled, 
    isInIframe, 
    swStatus, 
    manifestStatus, 
    isHttps, 
    hasUpdateAvailable,
    isUpdating,
    triggerInstall, 
    checkStatus,
    forceAppUpdate 
  } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [icon192Loaded, setIcon192Loaded] = useState<boolean | null>(null);
  const [icon512Loaded, setIcon512Loaded] = useState<boolean | null>(null);
  const [logoFullLoaded, setLogoFullLoaded] = useState<boolean | null>(null);
  const [logoTextLoaded, setLogoTextLoaded] = useState<boolean | null>(null);

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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100 overflow-hidden my-auto max-h-[90vh] flex flex-col"
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

          {/* Scrollable Content */}
          <div className="overflow-y-auto pr-1 space-y-5 custom-scrollbar">
            
            {/* Title & App Logo Header */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src="/icon-192.png"
                  alt="HolyLink Logo"
                  className="w-16 h-16 rounded-2xl shadow-lg border border-amber-500/30 object-cover bg-zinc-900"
                  onLoad={() => setIcon192Loaded(true)}
                  onError={() => setIcon192Loaded(false)}
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black">
                  ✓
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-wide">HolyLink App</h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                    PWA Nativo
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Gerenciamento de PWA, sincronização local e atualização de versão.
                </p>
              </div>
            </div>

            {/* FORCE UPDATE BANNER (Para resolver PWA que não atualiza) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-amber-400 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                    {hasUpdateAvailable ? 'Nova Versão Encontrada!' : 'Atualização de Versão PWA'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Cache Busting</span>
              </div>

              <p className="text-xs leading-relaxed text-zinc-300">
                Se o seu PWA instalado ainda estiver mostrando uma versão antiga do site, clique no botão abaixo para limpar o cache local e carregar a última versão enviada para a Vercel.
              </p>

              <button
                onClick={forceAppUpdate}
                disabled={isUpdating}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>{isUpdating ? 'Atualizando e Recarregando...' : '🔄 Forçar Atualização para Nova Versão'}</span>
              </button>
            </div>

            {/* Main Status Actions */}
            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm">HolyLink já está instalado!</p>
                  <p className="text-xs text-emerald-400/80">
                    Você já está executando o aplicativo em modo nativo Standalone no seu dispositivo.
                  </p>
                </div>
              </div>
            ) : isInstallable ? (
              <div>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-98"
                >
                  <Download className="w-5 h-5" />
                  <span>Instalar Aplicativo Agora</span>
                </button>
              </div>
            ) : isInIframe ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    <strong>Atenção ao Preview:</strong> Navegadores bloqueiam a instalação automática dentro de quadros (iframes). Para instalar no seu dispositivo, abra a Vercel em uma aba separada.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewTab}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir HolyLink em Nova Aba</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar App PWA no Dispositivo</span>
                </button>
                <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                  Caso o atalho direto do navegador não apareça, veja o passo a passo de 2 cliques abaixo para o seu navegador.
                </p>
              </div>
            )}

            {/* Platform Instructions Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Guia de Instalação Manual
                </p>
                <button
                  onClick={handleOpenNewTab}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  Link Vercel <ExternalLink className="w-3 h-3" />
                </button>
              </div>

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
                    <li>Abra o HolyLink no <strong>Google Chrome</strong> do Android.</li>
                    <li>Toque nos <strong>três pontos (⋮)</strong> no canto superior direito.</li>
                    <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                    <li>O ícone do HolyLink aparecerá na sua tela de aplicativos.</li>
                  </ol>
                )}

                {activeTab === 'ios' && (
                  <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                    <li>Abra o link no navegador <strong>Safari</strong> do iPhone/iPad.</li>
                    <li>Toque no ícone de <strong>Compartilhar (⎋)</strong> na barra inferior.</li>
                    <li>Role as opções e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                    <li>Confirme tocando em <strong>"Adicionar"</strong> no topo.</li>
                  </ol>
                )}

                {activeTab === 'desktop' && (
                  <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                    <li>Acesse o HolyLink no <strong>Chrome</strong>, <strong>Edge</strong> ou <strong>Brave</strong>.</li>
                    <li>Olhe para a barra de endereço da URL no topo da tela.</li>
                    <li>Clique no ícone de <strong>instalar (🖥️ ou ➕)</strong> ao lado da barra.</li>
                    <li>O app abrirá como uma janela de computador nativa.</li>
                  </ol>
                )}
              </div>
            </div>

            {/* Diagnostic Box for Vercel Verification & Brand Showcase */}
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden text-xs">
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="w-full p-3 flex items-center justify-between text-zinc-400 hover:text-zinc-200 font-medium transition-colors cursor-pointer bg-zinc-900/40"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Diagnóstico PWA & Logotipos Oficiais</span>
                </div>
                {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDiagnostics && (
                <div className="p-3.5 space-y-3 border-t border-zinc-800/60 text-[11px] text-zinc-300 bg-zinc-950/80">
                  
                  {/* Status List */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-400">HTTPS / Seguro:</span>
                      <span className={isHttps ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {isHttps ? "✓ Sim" : "❌ Não"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-400">Service Worker:</span>
                      <span className={swStatus === 'active' ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {swStatus === 'active' ? "✓ Ativo (/sw.js)" : swStatus === 'checking' ? "Verificando..." : "Pendente"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-400">Manifest:</span>
                      <span className={manifestStatus === 'ok' ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {manifestStatus === 'ok' ? "✓ OK (/manifest.json)" : manifestStatus === 'checking' ? "Verificando..." : "Erro"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-400">Iframe (Prévia):</span>
                      <span className={isInIframe ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                        {isInIframe ? "Sim (Aba Externa Necessária)" : "Não (Direto)"}
                      </span>
                    </div>
                  </div>

                  {/* Complete 3 Logos Showcase */}
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-semibold flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        Logotipos Oficiais HolyLink no Sistema:
                      </span>
                      <button
                        onClick={() => checkStatus()}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Rechecar
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 text-[10px]">
                      {/* Icon 192 */}
                      <div className="flex items-center gap-2.5 p-2 rounded bg-zinc-950 border border-zinc-850">
                        <img
                          src="/icon-192.png"
                          alt="192 Icon"
                          className="w-7 h-7 rounded border border-amber-500/30 object-cover shrink-0"
                          onLoad={() => setIcon192Loaded(true)}
                          onError={() => setIcon192Loaded(false)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-200">Símbolo Principal (icon-192.png)</p>
                          <p className="text-[9px] text-zinc-400 truncate">Usado no Favicon, PWA e Cabeçalho</p>
                        </div>
                        <span className={icon192Loaded === true ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {icon192Loaded === true ? "✓ OK" : "Carregando..."}
                        </span>
                      </div>

                      {/* Logo Full */}
                      <div className="flex items-center gap-2.5 p-2 rounded bg-zinc-950 border border-zinc-850">
                        <img
                          src="/logo-full.png"
                          alt="Logo Completo"
                          className="h-7 w-auto max-w-[120px] object-contain shrink-0"
                          onLoad={() => setLogoFullLoaded(true)}
                          onError={() => setLogoFullLoaded(false)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-200">Logotipo Completo (logo-full.png)</p>
                          <p className="text-[9px] text-zinc-400 truncate">Usado na Tela de Splash e Telas Iniciais</p>
                        </div>
                        <span className={logoFullLoaded === true ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {logoFullLoaded === true ? "✓ OK" : "Carregando..."}
                        </span>
                      </div>

                      {/* Logo Text */}
                      <div className="flex items-center gap-2.5 p-2 rounded bg-zinc-950 border border-zinc-850">
                        <img
                          src="/logo-text.png"
                          alt="Tipografia Logo"
                          className="h-6 w-auto max-w-[120px] object-contain shrink-0"
                          onLoad={() => setLogoTextLoaded(true)}
                          onError={() => setLogoTextLoaded(false)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-200">Tipografia Oficial (logo-text.png)</p>
                          <p className="text-[9px] text-zinc-400 truncate">Usado na Barra Superior do Operador</p>
                        </div>
                        <span className={logoTextLoaded === true ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {logoTextLoaded === true ? "✓ OK" : "Carregando..."}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
            <span className="flex items-center gap-1 text-emerald-500/80 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> PWA Nativo com Auto-Atualização
            </span>
            <button
              onClick={handleOpenNewTab}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium underline transition-colors cursor-pointer"
            >
              Link Direto Vercel <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
