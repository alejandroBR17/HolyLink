import {nextQueueItem} from '../../utils/monitor-queue';
import {Smartphone} from '../ui/icons';
import {ShortcutsGuide} from './ShortcutsGuide';
import {useDialogFocus} from '../../hooks/useDialogFocus';
import {ConsoleGroupTitle} from './ConsoleIntro';
import React, { useRef, useState, useEffect } from 'react';
import { Monitor, Tv, ExternalLink, X, SkipForward, BookOpen, Keyboard, Laptop, EyeOff, Eye, Gauge, Zap, Sparkles, HardDrive, CheckCircle2, Download } from '../ui/icons';
import { ProjectionContent } from '../ProjectionContent';
import { CHURCH_INFO, ALERTS } from '../../data';
import { Meeting } from '../../types';
import { HardwareBenchmarkModal } from '../HardwareBenchmarkModal';
import { usePerformanceDiagnostics } from '../../utils/performance';
import { PWAInstallModal } from '../PWAInstallModal';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface MonitorPanelProps {
  onNavigate: (tab:'slides'|'texts'|'agenda'|'controls'|'sync') => void;
  onFullscreen: () => void;
  projectionMode: 'pre'|'post';
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
  nextMeeting: Meeting|null;
  nextMeetingDate: Date|null;
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
  onNavigate,
  onFullscreen,
  projectionMode,
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
  const shortcutsRef = useDialogFocus(showShortcutsModal, () => setShowShortcutsModal(false));
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  const [ramCleared, setRamCleared] = useState(false);
  const cacheFeedbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(cacheFeedbackTimer.current)clearTimeout(cacheFeedbackTimer.current);},[]);
  const { fps, mode, effectiveMode, report, purgeCache } = usePerformanceDiagnostics();
  const { isInstalled } = usePWAInstall();

  const handleClearRam = () => {
    purgeCache();
    setRamCleared(true);
    if(cacheFeedbackTimer.current)clearTimeout(cacheFeedbackTimer.current);
    cacheFeedbackTimer.current=setTimeout(() => setRamCleared(false), 3000);
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

  const nextMedia=nextQueueItem(activeSlides,currentSlideId,customMediaList,customMeetings);
  const verseOverlay=!!customVerseText||activeVerseIndex!==null;
  const advanceQueue=()=>{
    if(!nextMedia.id)return;
    updateStateAndBroadcast('customVerseText','');updateStateAndBroadcast('customVerseRef','');
    updateStateAndBroadcast('activeVerseIndex',null);updateStateAndBroadcast('manualSlideOverride',null);
    updateStateAndBroadcast('advanceToSlide',nextMedia.id);
  };

  return (
    <div className="monitor-workspace console-area flex flex-col gap-5 w-full text-left">

      {/* MONITOR CANVAS CONTAINER - COMPLEX SKEUOMORPHIC MONITOR FRAME */}
      <section aria-label="Monitor de Transmissão" className="console-monitor-card relative bg-hl-panel border border-hl-line rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden flex flex-col gap-4 group">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        {/* CABEÇALHO DO MONITOR */}
        <div className="relative z-10 flex items-center justify-between border-b border-hl-line pb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-hl-raised border border-hl-line-strong/50 rounded-xl text-hl-gold shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative">
              <Monitor className="w-4 h-4 drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider font-sans">Monitor da saída</h3>
                <span className="bg-hl-gold-well/80 border border-hl-line-strong/50 text-hl-gold text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                  Composição 16:9
                </span>
              </div>
              <p className="text-[11px] text-hl-muted font-medium mt-0.5">A composição da sua reunião, com a próxima tela logo abaixo. Confira também o telão.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {!isInstalled && (
              <button
                type="button"
                onClick={() => setShowPwaModal(true)}
                className="p-1.5 bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-hl-gold/50 text-hl-gold-bright rounded-xl text-xs font-bold flex items-center justify-center transition-all active:translate-y-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
                title="Instalar App HolyLink (PWA)"
              >
                <Download className="w-3.5 h-3.5 text-hl-gold shrink-0" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowShortcutsModal(!showShortcutsModal)}
              className="px-2.5 py-1.5 bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-hl-line-strong text-hl-soft hover:text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:translate-y-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              title="Atalhos e Comandos"
            >
              <Keyboard className="w-3.5 h-3.5 text-hl-gold shrink-0" />
              <span className="font-sans">Atalhos</span>
            </button>
            <span className="bg-emerald-950/80 border border-emerald-900/60 text-emerald-400 text-[9px] font-mono font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              Prévia local
            </span>
          </div>
        </div>

        {/* PHYSICAL MONITOR FRAME WITH BEZEL, REFLECTION AND LED STATUS */}
        <div className="relative z-10 bg-hl-canvas p-3 sm:p-4 rounded-2xl border-2 border-hl-line-soft shadow-[0_20px_50px_rgba(0,0,0,1),inset_0_2px_8px_rgba(255,255,255,0.04)]">

          {/* BEZEL TOP BAR WITH PHYSICAL LOGO & POWER LED */}
          <div className="flex items-center justify-between px-2 pb-2.5 mb-1 text-[10px] text-hl-dim font-mono border-b border-hl-line-soft">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-hl-muted tracking-widest">Saída preparada · 16:9</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-hl-muted">{Math.round(fps)} FPS locais</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-hl-gold/80" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Scaled Preview Frame with TV Bezel */}
          <div
            ref={containerRef}
            className="w-full aspect-video bg-black rounded-lg overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] border border-hl-line-soft"
          >
            {/* Screen Glass Surface Reflection */}
            <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06]" />

            <div
              className="console-projection-surface absolute origin-top-left pointer-events-none"
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
        </div>

      </section>

      {/* PRÓXIMA MÍDIA / A SEGUIR CARD - DESIGN SKEUOMÓRFICO TÁTICO */}
      <section aria-label="A Seguir na Fila" className="console-monitor-card relative bg-hl-panel border border-hl-line rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-3.5 group">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        <div className="relative z-10 flex items-center justify-between border-b border-hl-line pb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-hl-raised border border-hl-line-strong/50 rounded-xl text-hl-gold shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <SkipForward className="w-4 h-4 drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider font-sans leading-snug">A Seguir na Fila</h4>
              <p className="text-[10px] text-hl-muted font-medium leading-tight mt-0.5">
                {activeSlides.length > 0
                  ? `Posição ${nextMedia.position} de ${activeSlides.length}`
                  : 'Aguardando mídias'}
              </p>
            </div>
          </div>
          <span className="bg-hl-gold-well/80 border border-hl-line-strong/50 text-hl-gold text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] shrink-0">
            {nextMedia.typeLabel}
          </span>
        </div>

        <div className="relative z-10 bg-hl-canvas border border-hl-line-soft rounded-xl p-3 sm:p-3.5 flex flex-col gap-3 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-2.5 min-w-0 w-full">
            <div className="p-2.5 bg-hl-raised rounded-xl border border-hl-line shrink-0 text-hl-gold flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <SkipForward className="w-4 h-4 text-hl-gold"/>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[9px] font-mono font-extrabold text-hl-gold uppercase tracking-widest block mb-0.5">PRÓXIMO CONTEÚDO</span>
              <p className="text-xs sm:text-sm font-sans font-extrabold text-hl-copy leading-snug break-words">{nextMedia.title}</p>
              <p className="text-[11px] text-hl-muted font-medium leading-relaxed mt-0.5 break-words">
                {blackoutEnabled?'Tela preta ativa: retire o blackout para ver o conteúdo.':clearContentEnabled?'Conteúdo oculto: retire Limpar tela para ver a fila.':verseOverlay?'Há uma passagem sobre a fila. Avançar retira a passagem e retoma este conteúdo.':isFinalFiveMinutes||isFinalMinute||isJustStarted?'O cronômetro ou modo de reunião pode estar sobre a fila.':'Próximo conteúdo da sequência deste operador.'}
              </p>
            </div>
          </div>

          {nextMedia.id && (
            <button
              type="button"
              onClick={advanceQueue}
              className="bg-hl-gold hover:bg-hl-gold-bright text-black text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(255,211,79,0.3)] flex items-center justify-center gap-2 active:translate-y-[1px] w-full min-h-[40px]"
            >
              <SkipForward className="w-3.5 h-3.5 shrink-0" />
              <span>Avançar Slide</span>
            </button>
          )}
        </div>
      </section>

<details className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Gauge} title="Ajuda de projeção e diagnóstico" description="Atalhos, desempenho e orientações para cada aparelho." badge={`${Math.round(fps)} FPS locais`}/></summary><div>
      {/* HARDWARE DIAGNOSTIC & AUTOMATIC OPTIMIZATION BANNER */}
      <section aria-label="Desempenho e Memória" className="console-monitor-card relative bg-hl-panel border border-hl-line rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-3.5 text-left group">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        <div className="relative z-10 flex items-start gap-3 min-w-0 w-full">
          <div className="p-2 bg-hl-raised border border-hl-line-strong/50 rounded-xl text-hl-gold shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            <Gauge className="w-4 h-4 drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider font-sans">Desempenho & Memória</h4>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] ${
                effectiveMode === 'light'
                  ? 'bg-hl-gold-well/80 border-hl-line-strong/50 text-hl-gold-bright'
                  : effectiveMode === 'balanced'
                  ? 'bg-blue-950/80 border-blue-900/50 text-blue-400'
                  : 'bg-emerald-950/80 border-emerald-900/50 text-emerald-400'
              }`}>
                {fps} FPS ({effectiveMode === 'light' ? 'Anti-Lag' : effectiveMode === 'balanced' ? 'Equilibrado' : 'Máxima Qualidade'})
              </span>
              <span className="text-[9px] font-mono bg-hl-canvas px-2 py-0.5 rounded border border-hl-line-soft text-hl-gold-bright font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                RAM: {report?.ramDisplay || 'Não informada'}
              </span>
            </div>
            <p className="text-[10px] text-hl-muted mt-1 leading-relaxed font-medium">
              Diagnóstico desta aba e deste aparelho. Não mede o PC remoto; RAM e GPU dependem das informações que o navegador libera.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-2 w-full pt-1">
          <button
            type="button"
            onClick={handleClearRam}
            className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[38px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] active:translate-y-[1px] ${
              ramCleared
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                : 'bg-gradient-to-b from-hl-raised to-hl-raised border-hl-line hover:border-hl-line-strong text-hl-soft'
            }`}
            title="Limpa o cache de pré-carregamento; não controla a RAM do aparelho"
          >
            <HardDrive className={`w-3.5 h-3.5 ${ramCleared ? 'text-emerald-400 animate-bounce' : 'text-hl-gold'}`} />
            <span className="truncate">{ramCleared ? 'Cache limpo' : 'Limpar cache'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBenchmarkModal(true)}
            className="bg-hl-gold hover:bg-hl-gold-bright text-black text-xs font-black px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,211,79,0.3)] min-h-[38px] active:translate-y-[1px]"
          >
            <Zap className="w-3.5 h-3.5 shrink-0 fill-current" />
            <span className="truncate">Testar & Otimizar</span>
          </button>
        </div>
      </section>

      {/* SMART DEVICE GUIDANCE CARD */}
      <section aria-label="Modo de Dispositivo" className="console-monitor-card relative bg-hl-panel border border-hl-line rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden text-left group">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between mb-3 gap-2 border-b border-hl-line pb-3">
          <h4 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider font-sans flex items-center gap-2 min-w-0">
            {isMobileDevice ? (
              <Smartphone className="w-4 h-4 text-hl-gold animate-pulse shrink-0" />
            ) : (
              <Laptop className="w-4 h-4 text-hl-gold shrink-0" />
            )}
            <span className="break-words">Orientação: {isMobileDevice ? 'Tela portátil' : 'Computador'}</span>
          </h4>
          <span className="bg-hl-gold-well/80 border border-hl-line-strong/50 text-hl-gold text-[9px] font-mono px-2.5 py-1 rounded uppercase tracking-wider font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] shrink-0">
            {localStorage.getItem('projection_deviceRole')==='phone'?'Controle escolhido':localStorage.getItem('projection_deviceRole')==='pc'?'Projeção escolhida':'Orientação de uso'}
          </span>
        </div>

        {isMobileDevice ? (
          <div className="relative z-10 text-[11px] text-hl-muted space-y-2 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="font-mono bg-hl-canvas border border-hl-line-soft px-2 py-0.5 rounded text-hl-gold text-[10px] font-bold shrink-0 mt-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">1</span>
              <span>Para controlar outro aparelho, escolha <strong>Celular de controle</strong> em Conexão e autorize no PC.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-mono bg-hl-canvas border border-hl-line-soft px-2 py-0.5 rounded text-hl-gold text-[10px] font-bold shrink-0 mt-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">2</span>
              <span>Abra este mesmo link no PC da igreja conectado à TV/HDMI.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-mono bg-hl-canvas border border-hl-line-soft px-2 py-0.5 rounded text-hl-gold text-[10px] font-bold shrink-0 mt-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">3</span>
              <span>Use os botões <strong>BLACKOUT</strong>, <strong>LIMPAR TEXTO</strong> e a <strong>FILA DE TRANSMISSÃO</strong> para controlar tudo em tempo real!</span>
            </p>
          </div>
        ) : (
          <div className="relative z-10 text-[11px] text-hl-muted space-y-2 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="font-mono bg-hl-canvas border border-hl-line-soft px-2 py-0.5 rounded text-hl-gold text-[10px] font-bold shrink-0 mt-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">1</span>
              <span>Conecte a TV ou Projetor na saída HDMI do computador.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-mono bg-hl-canvas border border-hl-line-soft px-2 py-0.5 rounded text-hl-gold text-[10px] font-bold shrink-0 mt-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">2</span>
              <span>Use <strong>Abrir telão</strong> no topo e mova a janela para a segunda tela.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-mono bg-hl-canvas border border-hl-line-soft px-2 py-0.5 rounded text-hl-gold text-[10px] font-bold shrink-0 mt-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">3</span>
              <span>Atalhos: <strong>B</strong> (Blackout), <strong>C</strong> (Limpar), <strong>Espaço</strong> (Próximo) e <strong>ESC</strong> (Resetar).</span>
            </p>
          </div>
        )}
      </section>


</div></details>
      {/* HARDWARE BENCHMARK MODAL */}
      <HardwareBenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
      />

      {/* SHORTCUTS & INTERACTIVE COMMANDS MODAL OVERLAY */}
      {showShortcutsModal && (
        <div className="holy-theme holy-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div ref={shortcutsRef} role="dialog" aria-modal="true" aria-label="Atalhos da projeção" tabIndex={-1} className="holy-dialog bg-hl-panel border border-hl-line rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95)] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="flex items-center justify-between border-b border-hl-line pb-3.5">
              <h4 className="text-hl-copy font-extrabold text-sm uppercase tracking-wider font-sans flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-hl-gold shrink-0 drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
                Atalhos de Teclado & Comandos
              </h4>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                aria-label="Fechar atalhos" className="p-1.5 text-hl-muted hover:text-white bg-hl-raised hover:bg-hl-raised border border-hl-line rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ShortcutsGuide onCommand={id => {
              if (id === 'blackout') updateStateAndBroadcast('blackoutEnabled',!blackoutEnabled);
              else if (id === 'clear') updateStateAndBroadcast('clearContentEnabled',!clearContentEnabled);
              else if (id === 'mute') updateStateAndBroadcast('volume',volume > 0 ? 0 : 0.5);
              else if (id === 'resume') {updateStateAndBroadcast('manualSlideOverride',null); updateStateAndBroadcast('customVerseText',null); updateStateAndBroadcast('customVerseRef',null); updateStateAndBroadcast('activeVerseIndex',null); updateStateAndBroadcast('activeAlert',null);}
              else if (id === 'next' || id === 'previous') {const index=activeSlides.indexOf(currentSlideId); const next=(index+(id === 'next' ? 1 : -1)+activeSlides.length)%activeSlides.length; if (activeSlides[next]) updateStateAndBroadcast('advanceToSlide',activeSlides[next]);}
              else if (id === 'fullscreen') onFullscreen();
              else if (id === 'mode') {updateStateAndBroadcast('projectionMode',projectionMode === 'pre' ? 'post' : 'pre'); updateStateAndBroadcast('manualSlideOverride',null);}
              else if (['slides','texts','agenda','controls','sync'].includes(id)) onNavigate(id as 'slides'|'texts'|'agenda'|'controls'|'sync');
              setShowShortcutsModal(false);
            }}/>

          </div>
        </div>
      )}

      <PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
}
