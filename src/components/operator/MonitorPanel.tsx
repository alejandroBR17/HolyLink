import React, { useRef, useState, useEffect } from 'react';
import { Monitor, Tv, ExternalLink, X, SkipForward, Film, Image as ImageIcon, BookOpen, Calendar, Heart, Keyboard, Smartphone, Laptop, EyeOff, Eye, Gauge, Zap, Sparkles, Cpu } from 'lucide-react';
import { ProjectionContent } from '../ProjectionContent';
import { CHURCH_INFO, ALERTS } from '../../data';
import { Meeting } from '../../types';
import { HardwareBenchmarkModal } from '../HardwareBenchmarkModal';
import { usePerformanceDiagnostics } from '../../utils/performance';

interface MonitorPanelProps {
  projectionWin: Window | null;
  setProjectionWin: (w: Window | null) => void;
  currentTime: Date;
  isLooping: boolean;
  isFinalFiveMinutes: boolean;
  isFinalMinute: boolean;
  isJustStarted: boolean;
  activeAlert: string | null;
  blackoutEnabled: boolean;
  clearContentEnabled: boolean;
  currentSlideId: string;
  hoursStr: string;
  minutesStr: string;
  diffSeconds: number;
  formatMinutesPart: string;
  formatSecondsPart: string;
  customVerseText: string | null;
  customVerseRef: string | null;
  activeVerseIndex: number | null;
  customMediaList: any[];
  videoPinBehavior: 'loop' | 'unpin';
  loopIteration: number;
  updateStateAndBroadcast: (key: string, value: any) => void;
  customMeetings: Meeting[];
  customCampaigns: any[];
  nextMeeting: Meeting;
  nextMeetingDate: Date;
  ongoingMeeting: Meeting | null;
  volume: number;
  tickerText: string | null;
  syncStatus: any;
  isProjectionOpen?: boolean;
  activeSlides?: string[];
}

export function MonitorPanel({
  projectionWin,
  setProjectionWin,
  currentTime,
  isLooping,
  isFinalFiveMinutes,
  isFinalMinute,
  isJustStarted,
  activeAlert,
  blackoutEnabled,
  clearContentEnabled,
  currentSlideId,
  hoursStr,
  minutesStr,
  diffSeconds,
  formatMinutesPart,
  formatSecondsPart,
  customVerseText,
  customVerseRef,
  activeVerseIndex,
  customMediaList,
  videoPinBehavior,
  loopIteration,
  updateStateAndBroadcast,
  customMeetings,
  customCampaigns,
  nextMeeting,
  nextMeetingDate,
  ongoingMeeting,
  volume,
  tickerText,
  syncStatus,
  isProjectionOpen = false,
  activeSlides = []
}: MonitorPanelProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  const { fps, mode, report } = usePerformanceDiagnostics();

  useEffect(() => {
    const checkDevice = () => {
      const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      const isSmall = typeof window !== 'undefined' && window.innerWidth < 1024;
      setIsMobileDevice(isTouch || isSmall);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        setScale(width / 1920);
      }
    };

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);

    const currentWidth = containerRef.current.clientWidth;
    setScale(currentWidth / 1920);

    return () => resizeObserver.disconnect();
  }, []);

  const handleOpenMonitor = () => {
    const projectionUrl = `${window.location.origin}${window.location.pathname}?projection`;
    try {
      const newWin = window.open(projectionUrl, 'holyrics_projection', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
      setProjectionWin(newWin);
    } catch (e) {
      console.warn("Could not open projection window:", e);
    }
    updateStateAndBroadcast('isProjectionOpen', true);
    updateStateAndBroadcast('projectionCloseTrigger', null);
  };

  const handleCloseMonitor = () => {
    setProjectionWin(null);
    updateStateAndBroadcast('projectionCloseTrigger', Date.now().toString());
    updateStateAndBroadcast('isProjectionOpen', false);
  };

  // Compute next slide / media details
  const getNextMediaInfo = () => {
    if (customVerseText) {
      return {
        id: 'verse_next',
        title: customVerseRef ? `Próximo Versículo (${customVerseRef})` : 'Versículo Bíblico em Exibição',
        typeLabel: 'Texto Sagrado',
        icon: <BookOpen className="w-4 h-4 text-amber-500" />
      };
    }

    if (!activeSlides || activeSlides.length === 0) {
      return { id: null, title: 'Nenhum slide na fila', typeLabel: 'Vazio', icon: <Monitor className="w-4 h-4 text-zinc-500" /> };
    }

    const currentIndex = activeSlides.indexOf(currentSlideId);
    const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % activeSlides.length : 0;
    const nextId = activeSlides[nextIndex];

    if (nextId === 'agenda_day_0') {
      return { id: nextId, title: 'Agenda do Dia / Próxima Reunião', typeLabel: 'Card da Igreja', icon: <Calendar className="w-4 h-4 text-blue-400" /> };
    } else if (nextId === 'world_god') {
      return { id: nextId, title: 'Onde Tem Igreja Universal', typeLabel: 'Card Institucional', icon: <BookOpen className="w-4 h-4 text-emerald-400" /> };
    } else if (nextId === 'donation') {
      return { id: nextId, title: 'Dízimos e Ofertas (PIX)', typeLabel: 'Chave PIX', icon: <Heart className="w-4 h-4 text-yellow-400" /> };
    } else if (nextId?.startsWith('campaign_')) {
      const index = parseInt(nextId.replace('campaign_', ''), 10);
      const camp = customCampaigns[index];
      return { id: nextId, title: camp?.title || 'Campanha de Fé', typeLabel: 'Campanha', icon: <Heart className="w-4 h-4 text-red-400" /> };
    } else if (nextId?.startsWith('meeting_')) {
      return { id: nextId, title: 'Próximo Evento da Reunião', typeLabel: 'Evento', icon: <Calendar className="w-4 h-4 text-amber-400" /> };
    } else {
      const media = customMediaList.find(m => m.id === nextId);
      if (media) {
        return {
          id: nextId,
          title: media.name || 'Mídia Personalizada',
          typeLabel: media.type === 'video' ? 'Vídeo MP4' : 'Imagem JPG/PNG',
          icon: media.type === 'video' ? <Film className="w-4 h-4 text-purple-400" /> : <ImageIcon className="w-4 h-4 text-sky-400" />
        };
      }
    }

    return { id: nextId, title: 'Próximo Slide', typeLabel: 'Slide', icon: <Monitor className="w-4 h-4 text-amber-500" /> };
  };

  const nextMedia = getNextMediaInfo();

  return (
    <div className="flex flex-col gap-5 w-full h-full animate-in fade-in duration-200 text-left">
      
      {/* MONITOR CANVAS CONTAINER */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 animate-pulse">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Monitor de Transmissão</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Visualização em tempo real da 2ª tela</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcutsModal(!showShortcutsModal)}
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Atalhos de Teclado"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Atalhos</span>
            </button>
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-400 rounded-full" />
              Live
            </span>
          </div>
        </div>

        {/* Scaled Preview Frame */}
        <div 
          ref={containerRef}
          className="w-full aspect-video bg-black border border-zinc-800 rounded-xl overflow-hidden relative shadow-2xl"
        >
          <div 
            className="absolute origin-top-left pointer-events-none"
            style={{
              width: '1920px',
              height: '1080px',
              transform: `scale(${scale})`
            }}
          >
            <ProjectionContent
              currentTime={currentTime}
              isLooping={isLooping}
              isFinalFiveMinutes={isFinalFiveMinutes}
              isFinalMinute={isFinalMinute}
              isJustStarted={isJustStarted}
              activeAlert={activeAlert}
              blackoutEnabled={blackoutEnabled}
              clearContentEnabled={clearContentEnabled}
              currentSlideId={currentSlideId}
              hoursStr={hoursStr}
              minutesStr={minutesStr}
              diffSeconds={diffSeconds}
              formatMinutesPart={formatMinutesPart}
              formatSecondsPart={formatSecondsPart}
              customVerseText={customVerseText}
              customVerseRef={customVerseRef}
              activeVerseIndex={activeVerseIndex}
              churchInfo={CHURCH_INFO}
              alerts={ALERTS}
              customMediaList={customMediaList}
              videoPinBehavior={videoPinBehavior}
              loopIteration={loopIteration}
              onClearAlert={() => updateStateAndBroadcast('activeAlert', null)}
              isMiniature={true}
              customMeetings={customMeetings}
              customCampaigns={customCampaigns}
              nextMeeting={nextMeeting}
              nextMeetingDate={nextMeetingDate}
              ongoingMeeting={ongoingMeeting}
              volume={volume}
              tickerText={tickerText}
              syncStatus={syncStatus}
            />
          </div>
        </div>

        {/* QUICK TOUCH CONTROL BAR FOR MOBILE / TABLET OPERATORS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled)}
            className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              blackoutEnabled
                ? 'bg-red-600 border-red-500 text-white shadow-red-900/30 animate-pulse'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <EyeOff className="w-4 h-4 text-amber-500" />
            <span>{blackoutEnabled ? 'RESTAURAR TELA' : 'BLACKOUT (B)'}</span>
          </button>

          <button
            onClick={() => updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled)}
            className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              clearContentEnabled
                ? 'bg-amber-500 border-amber-400 text-black shadow-amber-500/20'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <Eye className="w-4 h-4 text-amber-500" />
            <span>{clearContentEnabled ? 'MOSTRAR TEXTO' : 'LIMPAR TEXTO (C)'}</span>
          </button>

          <button
            onClick={() => {
              if (activeSlides.length > 0) {
                const currentIndex = activeSlides.indexOf(currentSlideId);
                const nextIndex = (currentIndex + 1) % activeSlides.length;
                updateStateAndBroadcast('manualSlideOverride', activeSlides[nextIndex]);
              }
            }}
            className="col-span-2 sm:col-span-1 p-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl border border-amber-400 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10"
          >
            <SkipForward className="w-4 h-4" />
            <span>PRÓXIMO SLIDE</span>
          </button>
        </div>

        {/* HDMI quick buttons */}
        <div className="flex gap-3 mt-1">
          {!isProjectionOpen ? (
            <button
              onClick={handleOpenMonitor}
              className="flex-1 p-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4 text-amber-500" />
              Projetar na 2ª Tela (HDMI)
            </button>
          ) : (
            <button
              onClick={handleCloseMonitor}
              className="flex-1 p-2.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
              Fechar 2ª Tela
            </button>
          )}
        </div>
      </div>

      {/* PRÓXIMA MÍDIA / A SEGUIR CARD - AMPLO E NÃO COMPRIMIDO */}
      <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 shrink-0 border border-amber-500/20">
              <SkipForward className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-zinc-100 font-black text-sm uppercase tracking-wider truncate">Fila de Transmissão: A Seguir</h4>
              <p className="text-[11px] text-zinc-400 font-medium truncate">
                {activeSlides.length > 0
                  ? `Item na Posição ${(activeSlides.indexOf(currentSlideId) + 2) > activeSlides.length ? 1 : activeSlides.indexOf(currentSlideId) + 2} de ${activeSlides.length} do Carrossel`
                  : 'Aguardando mídias cadastradas'}
              </p>
            </div>
          </div>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono px-3 py-1 rounded-full uppercase tracking-wider font-extrabold shrink-0">
            {nextMedia.typeLabel}
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-inner">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shrink-0 text-amber-500 flex items-center justify-center shadow-md">
              {nextMedia.icon}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-0.5">Próximo Conteúdo na Fila</span>
              <p className="text-sm sm:text-base font-black text-white leading-snug break-words">{nextMedia.title}</p>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-1 break-words">
                {customVerseText ? 'Aguardando fechamento do versículo bíblico ativo' : 'Pronto para entrar na tela principal do projetor'}
              </p>
            </div>
          </div>

          {nextMedia.id && (
            <button
              onClick={() => updateStateAndBroadcast('manualSlideOverride', nextMedia.id)}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl shrink-0 transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 w-full md:w-auto min-h-[46px]"
            >
              <SkipForward className="w-4 h-4" />
              <span>Avançar para este Slide Agora</span>
            </button>
          )}
        </div>
      </div>

      {/* HARDWARE DIAGNOSTIC & AUTOMATIC OPTIMIZATION BANNER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider">Otimização de Hardware & RAM</h4>
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                {fps} FPS ({mode === 'light' ? 'Modo Economia' : 'Alto Desempenho'})
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
              Análise automática de CPU, Placa de Vídeo e Limpeza de Cache de Vídeos
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBenchmarkModal(true)}
          className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-extrabold px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto min-h-[40px]"
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Testar e Otimizar Dispositivo</span>
        </button>
      </div>

      {/* HARDWARE BENCHMARK MODAL */}
      <HardwareBenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
      />

      {/* SHORTCUTS MODAL / EXPANDABLE PANEL */}
      {showShortcutsModal && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h4 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-500" />
              Atalhos de Teclado Rápido
            </h4>
            <button onClick={() => setShowShortcutsModal(false)} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 flex items-center justify-between">
              <span>Tela Preta (Blackout)</span>
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-400">B</kbd>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 flex items-center justify-between">
              <span>Limpar Texto</span>
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-400">C</kbd>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 flex items-center justify-between">
              <span>Próximo Slide/Versículo</span>
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-400">Espaço / →</kbd>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 flex items-center justify-between">
              <span>Slide Anterior</span>
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-400">←</kbd>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 flex items-center justify-between">
              <span>Cancelar / Resetar</span>
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-400">Esc</kbd>
            </div>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 flex items-center justify-between">
              <span>Mudar Volume / Mudo</span>
              <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-400">M</kbd>
            </div>
          </div>
        </div>
      )}

      {/* SMART DEVICE GUIDANCE CARD */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl text-left">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            {isMobileDevice ? (
              <Smartphone className="w-4 h-4 text-amber-500 animate-pulse" />
            ) : (
              <Laptop className="w-4 h-4 text-amber-500" />
            )}
            Modo Inteligente: {isMobileDevice ? 'Celular / Tablet (Controle Remoto)' : 'Computador Desktop (Mesa de Som/Projeção)'}
          </h4>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
            {isMobileDevice ? 'Controle por Toque' : 'Atalhos + HDMI'}
          </span>
        </div>

        {isMobileDevice ? (
          <div className="text-[11px] text-zinc-400 space-y-2 leading-relaxed">
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold">1</span>
              Seu celular foi detectado automaticamente como <strong>Mesa de Controle Sem Fio</strong>.
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold">2</span>
              Abra este mesmo link no computador da transmissão conectado na TV/Projetor HDMI.
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold">3</span>
              Use os botões táteis de acesso rápido acima (<strong>BLACKOUT</strong>, <strong>LIMPAR TEXTO</strong> e <strong>PRÓXIMO SLIDE</strong>) para operar o culto diretamente da nave ou do altar!
            </p>
          </div>
        ) : (
          <div className="text-[11px] text-zinc-400 space-y-2 leading-relaxed">
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold">1</span>
              Conecte a TV ou Projetor na 2ª saída HDMI do seu computador.
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold">2</span>
              Clique em <strong>"Projetar na 2ª Tela (HDMI)"</strong> para abrir o projetor em nova janela.
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold">3</span>
              Use os atalhos de teclado <strong>B</strong> (Blackout), <strong>C</strong> (Clear Text), <strong>Espaço</strong> (Próximo) e <strong>ESC</strong> (Resetar) para agilidade total.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
