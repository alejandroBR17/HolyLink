import {MonitorHelp} from './MonitorHelp';
import {MonitorPreview} from './MonitorPreview';
import {selectProjectionVerse} from '../../utils/verse-selection';
import {nextQueueItem,describeQueueItem} from '../../utils/monitor-queue';
import {ShortcutsGuide} from './ShortcutsGuide';
import {useDialogFocus} from '../../hooks/useDialogFocus';
import React, { useRef, useState, useEffect } from 'react';
import {X,SkipForward,Keyboard} from '../ui/icons';
import { ProjectionContent } from '../ProjectionContent';
import { CHURCH_INFO, ALERTS, VERSES } from '../../data';
import { Meeting } from '../../types';
import { HardwareBenchmarkModal } from '../HardwareBenchmarkModal';
import { usePerformanceDiagnostics } from '../../utils/performance';

interface MonitorPanelProps {
  onNavigate: (tab:'slides'|'texts'|'agenda'|'controls'|'sync') => void;
  onFullscreen: () => void;
  projectionMode: 'pre'|'post';
  projectionTheme?:'auto'|'fju'|'regular';
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
  manualSlideOverride:string|null;

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
  projectionTheme='auto',
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
  manualSlideOverride,

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

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const shortcutsRef = useDialogFocus(showShortcutsModal, () => setShowShortcutsModal(false));
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [ramCleared, setRamCleared] = useState(false);
  const cacheFeedbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(cacheFeedbackTimer.current)clearTimeout(cacheFeedbackTimer.current);},[]);
  const { fps, effectiveMode, report, purgeCache } = usePerformanceDiagnostics();

  const handleClearRam = () => {
    purgeCache();
    setRamCleared(true);
    if(cacheFeedbackTimer.current)clearTimeout(cacheFeedbackTimer.current);
    cacheFeedbackTimer.current=setTimeout(() => setRamCleared(false), 3000);
  };

  const nextMedia=nextQueueItem(activeSlides,currentSlideId,customMediaList,customMeetings);
  const verseOverlay=!!customVerseText||activeVerseIndex!==null;
  const advanceQueue=()=>{
    if(!nextMedia.id)return;
    updateStateAndBroadcast('customVerseText','');updateStateAndBroadcast('customVerseRef','');
    updateStateAndBroadcast('activeVerseIndex',null);updateStateAndBroadcast('manualSlideOverride',null);
    if(isJustStarted)updateStateAndBroadcast('dismissedJustStarted',true);
    updateStateAndBroadcast('advanceToSlide',nextMedia.id);
  };

  const countdownActive=isFinalFiveMinutes||isFinalMinute;
  const verseVisible=!!customVerseText&&(verseDisplayPriority==='verse_over_video'||!countdownActive);
  const verse=selectProjectionVerse(VERSES,{text:customVerseText,ref:customVerseRef,index:activeVerseIndex,loop:isJustStarted?undefined:loopIteration,offset:!isJustStarted&&currentSlideId.startsWith('verse_')?Number(currentSlideId.slice(6))||0:0,timeMs:currentTime.getTime()}).verse;
  const current=describeQueueItem(currentSlideId,customMediaList,customMeetings);
  const liveTitle=blackoutEnabled?'Tela preta':verseVisible?verse.ref:isFinalMinute||isFinalFiveMinutes?`${formatMinutesPart}:${formatSecondsPart}`:isJustStarted?verse.ref:clearContentEnabled?'Conteúdo da fila oculto':currentSlideId.startsWith('verse_')?verse.ref:current.title;
  const liveDetail=blackoutEnabled?'Blackout ativo. O restante da composição permanece preparado.':verseVisible?'Passagem bíblica sobre a fila.':countdownActive?'Contagem para a próxima reunião.':isJustStarted?'Passagem do modo de reunião.':clearContentEnabled?'Limpar tela está ativo; avisos e letreiro podem continuar.':manualSlideOverride?'Conteúdo fixado pelo operador.':'Sequência automática.';
  const resumeSequence=()=>{updateStateAndBroadcast('customVerseText',null);updateStateAndBroadcast('customVerseRef',null);updateStateAndBroadcast('activeVerseIndex',null);updateStateAndBroadcast('manualSlideOverride',null);if(isJustStarted)updateStateAndBroadcast('dismissedJustStarted',true);};

  return (
    <div className="monitor-workspace console-area flex flex-col gap-5 w-full text-left">

      <MonitorPreview title={liveTitle} detail={liveDetail}
        badges={<>{blackoutEnabled&&<span>Tela preta</span>}{clearContentEnabled&&<span>Conteúdo oculto</span>}{activeAlert&&<span>Aviso na tela</span>}{tickerText&&<span>Letreiro ativo</span>}{!blackoutEnabled&&!clearContentEnabled&&!activeAlert&&!tickerText&&<span>{verseVisible||isJustStarted?'Bíblia':countdownActive?'Contagem':manualSlideOverride?'Fixado':'Em sequência'}</span>}</>}
        actions={<><button type="button" onClick={()=>onNavigate('slides')}>Ver sequência</button>{(manualSlideOverride||verseOverlay)&&<button type="button" onClick={resumeSequence}>Retomar fila automática</button>}</>}
        tools={<><button type="button" onClick={()=>setShowShortcutsModal(true)} title="Atalhos e Comandos" aria-label="Atalhos da projeção"><Keyboard size={20}/></button></>}
      >
              <ProjectionContent
                projectionMode={projectionMode}
                projectionTheme={projectionTheme}
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
      </MonitorPreview>

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

      <MonitorHelp fps={fps} mode={effectiveMode} report={report} blackout={blackoutEnabled} clear={clearContentEnabled}
        onBlackout={()=>updateStateAndBroadcast('blackoutEnabled',false)} onClear={()=>updateStateAndBroadcast('clearContentEnabled',false)}
        onConnection={()=>onNavigate('sync')} onSettings={()=>onNavigate('controls')} onShortcuts={()=>setShowShortcutsModal(true)}
        onPerformance={()=>setShowBenchmarkModal(true)} onClearCache={handleClearRam} cacheCleared={ramCleared}/>

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

    </div>
  );
}
