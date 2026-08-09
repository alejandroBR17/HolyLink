import React, { useRef, useState, useEffect } from 'react';
import { Monitor, Tv, ExternalLink, X, SkipForward, Film, Image as ImageIcon, BookOpen, Calendar, Heart, Keyboard, Smartphone, Laptop, EyeOff, Eye, Gauge, Zap, Sparkles, Cpu, HardDrive, CheckCircle2 } from 'lucide-react';
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
  finalMinuteDisplayMode?: 'split' | 'full_video';
  verseDisplayPriority?: 'verse_over_video' | 'video_over_verse';
  loopIteration: number;
  updateStateAndBroadcast: (key: string, value: any) => void;
  customMeetings: Meeting[];
  customCampaigns: any[];
  nextMeeting: Meeting;
  nextMeetingDate: Date;
  ongoingMeeting: Meeting | null;
  volume: number;
  tickerText: string | null;
  background3DStyle?: 'auto' | 'aurora' | 'veil' | 'fju_aura' | 'particles_2d' | 'off';
  background3DFps?: 30 | 60;
  background3DIntensity?: 'high' | 'medium' | 'low';
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
  finalMinuteDisplayMode = 'split',
  verseDisplayPriority = 'verse_over_video',
  loopIteration,
  updateStateAndBroadcast,
  customMeetings,
  customCampaigns,
  nextMeeting,
  nextMeetingDate,
  ongoingMeeting,
  volume,
  tickerText,
  background3DStyle = 'auto',
  background3DFps = 60,
  background3DIntensity = 'high',
  syncStatus,
  isProjectionOpen = false,
  activeSlides = []
}: MonitorPanelProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  const [ramCleared, setRamCleared] = useState(false);
  const { fps, mode, effectiveMode, report, purgeCache } = usePerformanceDiagnostics();

  const handleClearRam = () => {
    purgeCache();
    setRamCleared(true);
    setTimeout(() => setRamCleared(false), 3000);
  };

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
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm min-h-[36px]"
              title="Atalhos e Comandos"
            >
              <Keyboard className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Atalhos</span>
            </button>
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
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
              finalMinuteDisplayMode={finalMinuteDisplayMode}
              verseDisplayPriority={verseDisplayPriority}
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
              background3DStyle={background3DStyle}
              background3DFps={background3DFps}
              background3DIntensity={background3DIntensity}
              syncStatus={syncStatus}
            />
          </div>
        </div>

        {/* QUICK TOUCH CONTROL BAR FOR MOBILE / TABLET OPERATORS */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled)}
            className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md min-h-[44px] ${
              blackoutEnabled
                ? 'bg-red-600 border-red-500 text-white shadow-red-900/30 animate-pulse'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <EyeOff className={`w-4 h-4 shrink-0 ${blackoutEnabled ? 'text-white' : 'text-amber-500'}`} />
            <span>{blackoutEnabled ? 'RESTAURAR TELA' : 'BLACKOUT (B)'}</span>
          </button>

          <button
            onClick={() => updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled)}
            className={`p-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md min-h-[44px] ${
              clearContentEnabled
                ? 'bg-amber-500 border-amber-400 text-black shadow-amber-500/20'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <Eye className={`w-4 h-4 shrink-0 ${clearContentEnabled ? 'text-black' : 'text-amber-500'}`} />
            <span>{clearContentEnabled ? 'MOSTRAR TEXTO' : 'LIMPAR TEXTO (C)'}</span>
          </button>
        </div>

        {/* HDMI quick buttons */}
        <div className="flex gap-3 mt-1">
          {!isProjectionOpen ? (
            <button
              onClick={handleOpenMonitor}
              className="flex-1 p-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 min-h-[42px]"
            >
              <ExternalLink className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Projetar na 2ª Tela (HDMI)</span>
            </button>
          ) : (
            <button
              onClick={handleCloseMonitor}
              className="flex-1 p-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[42px]"
            >
              <X className="w-4 h-4 shrink-0" />
              <span>Fechar 2ª Tela</span>
            </button>
          )}
        </div>
      </div>

      {/* PRÓXIMA MÍDIA / A SEGUIR CARD - DESIGN FLUIDO E LIMPO PARA CELULAR E PC */}
      <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 shrink-0 border border-amber-500/20">
              <SkipForward className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-zinc-100 font-black text-xs sm:text-sm uppercase tracking-wider leading-snug">Fila de Transmissão: A Seguir</h4>
              <p className="text-[11px] text-zinc-400 font-medium leading-tight mt-0.5">
                {activeSlides.length > 0
                  ? `Posição ${(activeSlides.indexOf(currentSlideId) + 2) > activeSlides.length ? 1 : activeSlides.indexOf(currentSlideId) + 2} de ${activeSlides.length} do Carrossel`
                  : 'Aguardando mídias'}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold shrink-0">
            {nextMedia.typeLabel}
          </span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3.5 shadow-inner">
          <div className="flex items-start gap-3 min-w-0 w-full">
            <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 shrink-0 text-amber-500 flex items-center justify-center shadow-md">
              {nextMedia.icon}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-0.5">Próximo Conteúdo</span>
              <p className="text-sm sm:text-base font-black text-white leading-snug break-words">{nextMedia.title}</p>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-1 break-words">
                {customVerseText ? 'Aguardando encerramento do versículo ativo' : 'Pronto na fila do projetor'}
              </p>
            </div>
          </div>

          {nextMedia.id && (
            <button
              onClick={() => updateStateAndBroadcast('advanceToSlide', nextMedia.id)}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-extrabold px-4 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 w-full min-h-[44px]"
            >
              <SkipForward className="w-4 h-4 shrink-0" />
              <span>Avançar Slide</span>
            </button>
          )}
        </div>
      </div>

      {/* HARDWARE DIAGNOSTIC & AUTOMATIC OPTIMIZATION BANNER */}
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3.5 min-w-0 w-full lg:w-auto">
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400 shrink-0 shadow-md">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider">Desempenho & Memória</h4>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-extrabold border ${
                effectiveMode === 'light'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : effectiveMode === 'balanced'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {fps} FPS ({effectiveMode === 'light' ? 'Anti-Lag Ativo' : effectiveMode === 'balanced' ? 'Equilibrado' : 'Máxima Qualidade'})
              </span>
              <span className="text-[10px] font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-blue-400 font-bold">
                RAM: {report?.ramDisplay || (report?.ramGB ? `${report.ramGB} GB` : '>= 4 GB')}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Otimização contínua de GPU, CPU ({report?.cpuCores || 4} cores) e memória.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleClearRam}
            className={`flex-1 sm:flex-initial text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[40px] ${
              ramCleared
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
            title="Limpa cache de vídeos e imagens armazenados na RAM"
          >
            <HardDrive className={`w-4 h-4 ${ramCleared ? 'text-emerald-400 animate-bounce' : 'text-blue-400'}`} />
            <span>{ramCleared ? 'RAM Liberada!' : 'Limpar RAM'}</span>
          </button>

          <button
            onClick={() => setShowBenchmarkModal(true)}
            className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 min-h-[40px] active:scale-95"
          >
            <Zap className="w-4 h-4 shrink-0 fill-current" />
            <span>Testar e Otimizar</span>
          </button>
        </div>
      </div>

      {/* HARDWARE BENCHMARK MODAL */}
      <HardwareBenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
      />

      {/* SHORTCUTS & INTERACTIVE COMMANDS MODAL OVERLAY */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl max-w-lg w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-zinc-100 font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-amber-500 shrink-0" />
                Atalhos de Teclado & Comandos
              </h4>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No computador, você pode pressionar as teclas diretamente. No celular ou tablet, pode tocar em qualquer comando abaixo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => { updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled); setShowShortcutsModal(false); }}
                className="bg-zinc-950 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-left cursor-pointer transition-all active:scale-95"
              >
                <span className="font-bold text-zinc-200">Blackout (Ocultar Tela)</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">B</kbd>
              </button>

              <button
                onClick={() => { updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled); setShowShortcutsModal(false); }}
                className="bg-zinc-950 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-left cursor-pointer transition-all active:scale-95"
              >
                <span className="font-bold text-zinc-200">Limpar Texto/Versículo</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">C</kbd>
              </button>

              <button
                onClick={() => {
                  if (activeSlides.length > 0) {
                    const currentIndex = activeSlides.indexOf(currentSlideId);
                    const nextIndex = (currentIndex + 1) % activeSlides.length;
                    updateStateAndBroadcast('advanceToSlide', activeSlides[nextIndex]);
                  }
                  setShowShortcutsModal(false);
                }}
                className="bg-zinc-950 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-left cursor-pointer transition-all active:scale-95"
              >
                <span className="font-bold text-zinc-200">Próximo Slide da Fila</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">Espaço / →</kbd>
              </button>

              <button
                onClick={() => {
                  if (activeSlides.length > 0) {
                    const currentIndex = activeSlides.indexOf(currentSlideId);
                    const prevIndex = (currentIndex - 1 + activeSlides.length) % activeSlides.length;
                    updateStateAndBroadcast('advanceToSlide', activeSlides[prevIndex]);
                  }
                  setShowShortcutsModal(false);
                }}
                className="bg-zinc-950 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-left cursor-pointer transition-all active:scale-95"
              >
                <span className="font-bold text-zinc-200">Slide Anterior</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">←</kbd>
              </button>

              <button
                onClick={() => {
                  updateStateAndBroadcast('manualSlideOverride', null);
                  if (customVerseText) {
                    updateStateAndBroadcast('customVerseText', null);
                    updateStateAndBroadcast('customVerseRef', null);
                    updateStateAndBroadcast('activeVerseIndex', null);
                  }
                  if (activeAlert) updateStateAndBroadcast('activeAlert', null);
                  setShowShortcutsModal(false);
                }}
                className="bg-zinc-950 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-left cursor-pointer transition-all active:scale-95"
              >
                <span className="font-bold text-zinc-200">Resetar / Seguir Fila</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">Esc</kbd>
              </button>

              <button
                onClick={() => {
                  updateStateAndBroadcast('volume', volume > 0 ? 0 : 0.5);
                  setShowShortcutsModal(false);
                }}
                className="bg-zinc-950 hover:bg-zinc-800 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-left cursor-pointer transition-all active:scale-95"
              >
                <span className="font-bold text-zinc-200">Mudo / Ativar Som</span>
                <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">M</kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART DEVICE GUIDANCE CARD */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl text-left">
        <div className="flex items-center justify-between mb-2.5 gap-2">
          <h4 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2 min-w-0">
            {isMobileDevice ? (
              <Smartphone className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            ) : (
              <Laptop className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="truncate">Modo: {isMobileDevice ? 'Celular / Tablet' : 'Computador / Mesa'}</span>
          </h4>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
            {isMobileDevice ? 'Controle Remoto' : 'HDMI + Teclado'}
          </span>
        </div>

        {isMobileDevice ? (
          <div className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span>Seu celular opera como <strong>Controle Remoto Sem Fio</strong> do projetor.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span>Abra este mesmo link no PC da igreja conectado à TV/HDMI.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span>Use os botões <strong>BLACKOUT</strong>, <strong>LIMPAR TEXTO</strong> e a <strong>FILA DE TRANSMISSÃO</strong> para controlar tudo em tempo real!</span>
            </p>
          </div>
        ) : (
          <div className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span>Conecte a TV ou Projetor na saída HDMI do computador.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span>Clique em <strong>"Projetar na 2ª Tela (HDMI)"</strong>.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-mono bg-zinc-950 border border-zinc-800 px-1.5 rounded text-amber-500 text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span>Atalhos: <strong>B</strong> (Blackout), <strong>C</strong> (Limpar), <strong>Espaço</strong> (Próximo) e <strong>ESC</strong> (Resetar).</span>
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
