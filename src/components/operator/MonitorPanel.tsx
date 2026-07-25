import React, { useRef, useState, useEffect } from 'react';
import { Monitor, Tv, ExternalLink, X } from 'lucide-react';
import { ProjectionContent } from '../ProjectionContent';
import { CHURCH_INFO, ALERTS } from '../../data';
import { Meeting } from '../../types';

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
  isProjectionOpen = false
}: MonitorPanelProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        // Target base of 1920px width
        setScale(width / 1920);
      }
    };

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);

    // Initial scale calculation
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

  return (
    <div className="flex flex-col gap-5 w-full h-full animate-in fade-in duration-200">
      
      {/* MONITOR CANVAS CONTAINER */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 animate-pulse">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Monitor de Transmissão</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Visualização em tempo real do projetor de palco</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span className="w-1 h-1 bg-emerald-400 rounded-full" />
            Live
          </span>
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

        {/* HDMI quick buttons */}
        <div className="flex gap-3 mt-1">
          {!isProjectionOpen ? (
            <button
              onClick={handleOpenMonitor}
              className="flex-1 p-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4 text-amber-500" />
              Projetar na 2ª Tela
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

      {/* QUICK HDMI USER GUIDE */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl text-left">
        <h4 className="text-zinc-200 font-bold text-xs uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <Tv className="w-4 h-4 text-amber-500" />
          Guia de Projeção HDMI
        </h4>
        <div className="text-[11px] text-zinc-400 space-y-2 leading-relaxed">
          <p className="flex items-start gap-1.5">
            <span className="font-mono bg-zinc-950 border border-zinc-800 px-1 rounded text-amber-500 text-[10px]">1</span>
            Conecte o projetor ou TV na saída HDMI do PC ou Notebook.
          </p>
          <p className="flex items-start gap-1.5">
            <span className="font-mono bg-zinc-950 border border-zinc-800 px-1 rounded text-amber-500 text-[10px]">2</span>
            Clique em <strong>"Projetar na 2ª Tela"</strong> para abrir o monitor externo.
          </p>
          <p className="flex items-start gap-1.5">
            <span className="font-mono bg-zinc-950 border border-zinc-800 px-1 rounded text-amber-500 text-[10px]">3</span>
            Arraste a nova janela para a TV e clique nela para ativar <strong>Tela Cheia</strong>.
          </p>
          <p className="flex items-start gap-1.5">
            <span className="font-mono bg-zinc-950 border border-zinc-800 px-1 rounded text-amber-500 text-[10px]">4</span>
            Controle tudo sem fio do seu celular ou tablet conectados na mesma rede!
          </p>
        </div>
      </div>

    </div>
  );
}
