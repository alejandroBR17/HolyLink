import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Armchair, DoorOpen, Smartphone, MessageSquareOff, Clock, Instagram, Globe, Flame, Users2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ParticlesBackground } from './ParticlesBackground';
import { VerseSlide } from './VerseSlide';
import { IconSlide, WorldGodSlide, AgendaDaySlide, DonationSlide, CampaignSlide, VideoSlide, MeetingEventSlide } from './slides';
import { SOCIAL } from '../data';
import { Meeting } from '../types';
import { usePerformanceDiagnostics } from '../utils/performance';

interface CustomMedia {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number;
  enabledInLoop: boolean;
  url: string;
  muted?: boolean;
  fit?: 'contain' | 'cover' | 'fill';
}

interface ProjectionContentProps {
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
  churchInfo: { name: string; location: string };
  alerts: Record<string, { message: string }>;
  customMediaList?: CustomMedia[];
  videoPinBehavior?: string;
  loopIteration?: number;
  onClearAlert: () => void;
  onVideoEnded?: () => void;
  isMiniature?: boolean;
  customMeetings?: Meeting[];
  customCampaigns?: any[];
  nextMeeting?: Meeting;
  nextMeetingDate?: Date;
  ongoingMeeting?: Meeting | null;
  volume?: number;
  tickerText?: string | null;
  syncStatus?: { active: boolean; message: string; progress?: number } | null;
}

export const ProjectionContent: React.FC<ProjectionContentProps> = ({
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
  churchInfo,
  alerts,
  customMediaList = [],
  videoPinBehavior = 'loop',
  loopIteration = 0,
  onClearAlert,
  onVideoEnded,
  isMiniature = false,
  customMeetings = [],
  customCampaigns = [],
  nextMeeting,
  nextMeetingDate,
  ongoingMeeting,
  volume = 1,
  tickerText = null,
  syncStatus = null
}) => {
  // Logic to detect FJU mode: 
  // 1. If ongoing meeting is FJU
  // 2. If next meeting is FJU AND starts in less than 30 minutes
  const isFJU = (() => {
    if (ongoingMeeting?.theme?.toLowerCase().includes('encontro jovem') || 
        ongoingMeeting?.theme?.toLowerCase().includes('fju')) return true;
    
    if (nextMeetingDate && (nextMeeting?.theme?.toLowerCase().includes('encontro jovem') || 
        nextMeeting?.theme?.toLowerCase().includes('fju'))) {
      const diffMs = nextMeetingDate.getTime() - currentTime.getTime();
      const diffMins = diffMs / (1000 * 60);
      return diffMins <= 30 && diffMins > 0;
    }
    
    return false;
  })();

  const themeColor = isFJU ? 'text-amber-500' : 'text-yellow-500';
  const borderColor = isFJU ? 'border-amber-500/40' : 'border-white/10';
  const shadowColor = isFJU ? 'shadow-[0_40px_120px_rgba(180,83,9,0.5)]' : 'shadow-[0_40px_120px_rgba(0,0,0,0.9)]';

  // Performance diagnostics hook
  const { isLightModeActive } = usePerformanceDiagnostics();

  const getTransitionVariants = (slideId: string) => {
    if (isLightModeActive) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15, ease: "linear" as const }
      };
    }
    if (slideId.startsWith('verse_') || slideId === 'world_god') {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 1.2, ease: "easeInOut" as const }
      };
    }
    return {
      initial: { opacity: 0, scale: 1.03 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.97 },
      transition: { duration: 0.5, ease: "easeInOut" as const }
    };
  };

  const renderSlide = (slideId: string) => {
    if (slideId.startsWith("custom_")) {
      const media = customMediaList.find(m => m.id === slideId);
      if (!media) return <div className="text-stone-500 text-3xl font-bold flex items-center justify-center h-full w-full bg-black">Mídia não encontrada</div>;
      if (media.type === 'image') {
        const fitMode = media.fit || 'contain';
        const isCover = fitMode === 'cover';
        const isFullScreen = fitMode === 'fill';
        
        // Base padding and rounded corners logic
        const containerPadding = isFullScreen ? 'p-0' : 'p-12 md:p-20';
        const innerRounded = isFullScreen ? 'rounded-none' : 'rounded-[3.5rem]';
        const innerBg = isFullScreen ? 'bg-black' : 'bg-black/40';
        const innerBorder = isFullScreen ? 'border-none' : borderColor;
        const innerShadow = isFullScreen ? '' : shadowColor;

        return (
          <div className={`w-full h-full ${containerPadding} flex items-center justify-center bg-black/20`}>
            <div className={`w-full h-full relative ${innerRounded} overflow-hidden ${innerShadow} border ${innerBorder} ${innerBg}`}>
              {/* Background for non-matching aspect ratios */}
              {fitMode === 'contain' && (
                !isLightModeActive ? (
                  <div 
                    className={`absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110 pointer-events-none`}
                    style={{ backgroundImage: `url(${media.url})` }}
                  />
                ) : (
                  /* Light Mode: Lightweight dark vignette, no blur filter pass */
                  <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-zinc-900 to-black opacity-90 pointer-events-none" />
                )
              )}
              <img 
                src={media.url || null} 
                alt={media.name} 
                className={`w-full h-full relative z-10 ${isCover ? 'object-cover' : isFullScreen ? 'object-fill' : 'object-contain'}`}
                referrerPolicy="no-referrer"
              />
              {!isFullScreen && (
                <div className={`absolute inset-0 z-20 ring-1 ring-inset ${isFJU ? 'ring-amber-500/20' : 'ring-white/20'} shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] pointer-events-none`} />
              )}
            </div>
          </div>
        );
      } else if (media.type === 'video') {
        const fitMode = media.fit || 'contain';
        const isCover = fitMode === 'cover';
        const isFullScreen = fitMode === 'fill';

        // Base padding and rounded corners logic
        const containerPadding = isFullScreen ? 'p-0' : 'p-12 md:p-20';
        const innerRounded = isFullScreen ? 'rounded-none' : 'rounded-[3.5rem]';
        const innerBg = isFullScreen ? 'bg-black' : 'bg-black/40';
        const innerBorder = isFullScreen ? 'border-none' : borderColor;
        const innerShadow = isFullScreen ? '' : shadowColor;

        return (
          <div className={`w-full h-full ${containerPadding} flex items-center justify-center bg-black/20`}>
            <div className={`w-full h-full relative ${innerRounded} overflow-hidden ${innerShadow} border ${innerBorder} ${innerBg}`}>
              {/* Background for videos */}
              {fitMode === 'contain' && (
                !isLightModeActive ? (
                  /* High Performance: Dual-layer video background blur ambient illumination */
                  <div className={`absolute inset-0 blur-3xl opacity-35 scale-110 pointer-events-none overflow-hidden`}>
                    <div className="w-full h-full scale-[2]">
                      <VideoSlide 
                        media={media} 
                        currentSlideId={currentSlideId} 
                        videoPinBehavior={videoPinBehavior}
                        onVideoEnded={undefined}
                        isBackgroundBlur
                        volume={0}
                      />
                    </div>
                  </div>
                ) : (
                  /* Light Mode: Zero duplicate video decoders, lightweight dark vignette */
                  <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-zinc-900 to-black opacity-90 pointer-events-none" />
                )
              )}
              <div className="w-full h-full relative z-10">
                <VideoSlide 
                  media={media} 
                  currentSlideId={currentSlideId} 
                  videoPinBehavior={videoPinBehavior}
                  onVideoEnded={onVideoEnded}
                  volume={isMiniature ? 0 : volume}
                  fit={isFullScreen ? 'fill' : isCover ? 'cover' : 'contain'}
                />
              </div>
              {!isFullScreen && (
                <div className={`absolute inset-0 z-20 ring-1 ring-inset ${isFJU ? 'ring-amber-500/20' : 'ring-white/20'} shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] pointer-events-none`} />
              )}
            </div>
          </div>
        );
      }
    }
    if (slideId.startsWith("meeting_event_")) {
      const meetId = slideId.replace("meeting_event_", "");
      const meeting = (customMeetings || []).find(m => m.id === meetId);
      if (meeting) {
        return <MeetingEventSlide meeting={meeting} variant={isFJU ? 'fju' : undefined} />;
      }
    }
    if (slideId.startsWith("agenda_day_")) {
      const cleanId = slideId.replace("agenda_day_", "");
      const dayIndex = parseInt(cleanId, 10);
      let subType: 'causas' | 'fju' | 'all' = 'all';
      if (cleanId.includes("causas")) {
        subType = 'causas';
      } else if (cleanId.includes("fju")) {
        subType = 'fju';
      }
      return <AgendaDaySlide dayIndex={dayIndex} subType={subType} currentTime={currentTime} meetings={customMeetings} variant={isFJU ? 'fju' : undefined} />;
    }
    if (slideId.startsWith("verse_")) {
      const verseIndexOffset = parseInt(slideId.replace("verse_", ""), 10) || 0;
      return (
        <VerseSlide 
          currentTime={currentTime} 
          verseIndexOffset={verseIndexOffset} 
          loopIteration={loopIteration} 
          customVerseText={customVerseText}
          customVerseRef={customVerseRef}
          activeVerseIndex={activeVerseIndex}
          
        />
      );
    }

    switch (slideId) {
      case 'seat':
        if (isFJU) {
          return <IconSlide icon={Armchair} title="Cola aí!" subtitle="Encontre seu lugar e chega mais, o Encontro Jovem vai começar!" layout="split-left" variant="fju" />;
        }
        return <IconSlide icon={Armchair} title="Fique à vontade" subtitle="Procure um assento e acomode-se para o início da reunião." layout="split-left" />;
      case 'bathroom':
        if (isFJU) {
          return <IconSlide icon={DoorOpen} title="Pit Stop" subtitle="Aproveite agora para ir ao banheiro. Depois que começar, ninguém quer sair!" layout="split-right" variant="fju" />;
        }
        return <IconSlide icon={DoorOpen} title="Vá ao banheiro" subtitle="Aproveite para ir antes da reunião começar." layout="split-right" />;
      case 'phone':
        if (isFJU) {
          return <IconSlide icon={Smartphone} title="Foco Total" subtitle="Desliga as notificações aí! Vamos focar 100% no que vai rolar no Encontro Jovem." layout="center" variant="fju" />;
        }
        return <IconSlide icon={Smartphone} title="Celular no Silencioso" subtitle="Mantenha o celular no silencioso para evitar interrupções." layout="center" />;
      case 'no_chat':
        if (isFJU) {
          return <IconSlide icon={MessageSquareOff} title="Preste Atenção" subtitle="O Encontro Jovem está só começando. Fica ligado e não perde nada!" layout="split-left" variant="fju" />;
        }
        return <IconSlide icon={MessageSquareOff} title="Silêncio" subtitle="Desligue-se das conversas e concentre-se na reunião." layout="split-left" />;
      case 'soon':
        if (isFJU) {
          return (
            <IconSlide 
              icon={Flame} 
              title="Vem pra FJU" 
              subtitle="O encontro que vai mudar a sua história. Começamos em instantes!" 
              pulse 
              layout="center"
              variant="fju"
            />
          );
        }
        return <IconSlide icon={Clock} title="A reunião começa" subtitle="em instantes..." pulse layout="center" />;
      case 'social':
        if (isFJU) {
          return <IconSlide icon={Instagram} title="FJU no Story" subtitle={`Siga a gente e marque o ${SOCIAL.instagram}`} layout="split-left" variant="fju" />;
        }
        return <IconSlide icon={Instagram} title="Siga nosso Instagram" subtitle={SOCIAL.instagram} layout="split-left" />;
      case 'donations':
        return <DonationSlide variant={isFJU ? 'fju' : undefined} />;
      case 'campaigns':
        return <CampaignSlide campaigns={customCampaigns} />;
      case 'world_god':
        return <WorldGodSlide variant={isFJU ? 'fju' : undefined} />;
      default:
        return null;
    }
  };
  return (
    <div className="w-full h-full relative select-none font-sans overflow-hidden bg-[#050000] text-white flex flex-col justify-between">
      <ParticlesBackground disabled={isMiniature || isLightModeActive} />
      
      {/* BLACKOUT OVERLAY */}
      {blackoutEnabled && (
        <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center">
          {isMiniature && (
            <span className="text-stone-700 font-bold uppercase tracking-[0.25em] text-4xl">
              Blackout Ativo
            </span>
          )}
        </div>
      )}

      {/* ALERT OVERLAY */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: isMiniature ? -50 : -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMiniature ? -50 : -100 }}
            className={`absolute ${isMiniature ? 'top-10' : 'top-12'} left-1/2 -translate-x-1/2 z-[90] bg-yellow-500 text-black ${isMiniature ? 'px-10 py-6 rounded-[2rem] border-2' : 'px-12 py-7 rounded-[2rem] border-2 shadow-[0_25px_60px_rgba(0,0,0,0.6)] min-w-[700px]'} border-yellow-400 flex items-center gap-8 max-w-[90%]`}
          >
            <Bell className={`${isMiniature ? 'w-12 h-12' : 'w-14 h-14 animate-[bounce_2s_infinite]'} text-black`} strokeWidth={2.5} />
            <div className="text-left flex-1">
              <h2 className={`font-black ${isMiniature ? 'text-2xl' : 'text-2xl'} uppercase tracking-widest leading-none text-black`}>Aviso Importante</h2>
              <p className={`font-bold ${isMiniature ? 'text-3xl' : 'text-3xl'} mt-2 text-black leading-snug`}>
                {activeAlert === 'baby' ? alerts.baby.message : activeAlert === 'car' ? alerts.car.message : activeAlert}
              </p>
            </div>
            {!isMiniature && (
              <button 
                onClick={onClearAlert}
                className="bg-black/10 hover:bg-black/25 p-3 rounded-full transition-colors cursor-pointer pointer-events-auto shrink-0 flex items-center justify-center"
              >
                <X className="w-7 h-7 text-black" strokeWidth={2.5} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isLooping && (
          <motion.div
            key="looping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col"
          >
            <header className={`h-[145px] shrink-0 px-24 flex items-center justify-between border-b border-white/[0.05] bg-[#050505] relative z-50`}>
              <div className="flex flex-col gap-3">
                <div>
                  <h1 className="font-sans font-black text-[3.2rem] tracking-[0.16em] text-white leading-none uppercase">
                    {churchInfo.name}
                  </h1>
                  <p className={`text-xl font-bold tracking-[0.62em] uppercase mt-1 ${isFJU ? 'text-amber-500' : 'text-yellow-500'}`}>
                    {churchInfo.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-stone-400 tracking-[0.25em] uppercase block mb-1">
                      {isFJU ? 'O Encontro Começa em:' : 'A Reunião Começa em:'}
                    </span>
                    <div className="flex items-baseline justify-end gap-1 font-mono text-white text-4xl font-bold tracking-tighter">
                      <span>{hoursStr}</span>
                      <span className="text-base font-sans text-stone-500 uppercase font-bold mr-2">h</span>
                      <span className={!isMiniature ? `${isFJU ? 'text-amber-500' : 'text-yellow-500'} animate-pulse` : ""}>:</span>
                      <span>{minutesStr}</span>
                      <span className="text-base font-sans text-stone-500 uppercase font-bold">m</span>
                    </div>
                  </div>

                  {!isMiniature && (
                    <>
                      <div className="h-12 w-[1px] bg-white/[0.1]" />
                      <div className={`border px-6 py-3 rounded-xl flex flex-col items-center justify-center ${isFJU ? 'bg-amber-600/10 border-amber-500/30' : 'bg-white/[0.05] border-white/[0.1]'}`}>
                        <span className={`font-mono text-3xl font-bold tracking-wider ${isFJU ? 'text-amber-100' : 'text-stone-100'}`}>
                          {format(currentTime, 'HH:mm:ss')}
                        </span>
                        <span className={`font-sans text-xs tracking-[0.2em] uppercase mt-1 ${isFJU ? 'text-amber-400' : 'text-stone-400'}`}>
                          {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 relative w-full overflow-hidden bg-black">
              <AnimatePresence>
                <motion.div
                  key={currentSlideId}
                  {...getTransitionVariants(currentSlideId)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {clearContentEnabled ? null : renderSlide(currentSlideId)}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}

        {isFinalFiveMinutes && (
          <motion.div
            key="final-five"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex w-full h-full bg-black relative"
          >
            <div className={`w-[35%] h-full flex flex-col items-center justify-center border-r ${isFJU ? 'border-amber-500/20 bg-[#080400]' : 'border-white/5 bg-[#030000]'} z-20`}>
              <span className={`${isFJU ? 'text-amber-500' : 'text-yellow-500'} text-[2rem] font-bold uppercase tracking-[0.4em] mb-4`}>
                Faltam
              </span>
              <div className="relative h-[12rem] w-full flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={diffSeconds}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -25 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute font-mono text-[7.5rem] text-white font-black leading-none tracking-tighter tabular-nums ${isFJU ? 'drop-shadow-[0_0_50px_rgba(245,158,11,0.15)]' : 'drop-shadow-[0_0_50px_rgba(255,255,255,0.05)]'}`}
                  >
                    {formatMinutesPart}:{formatSecondsPart}
                  </motion.div>
                </AnimatePresence>
              </div>
              <span className="text-stone-400 text-2xl font-medium tracking-[0.25em] mt-5 uppercase">
                Minutos e Segundos
              </span>
            </div>
            <div className="w-[65%] h-full flex items-center justify-center relative overflow-hidden bg-transparent">
              <div 
                className="absolute origin-center flex flex-col items-center justify-center transform scale-[0.65]"
                style={{
                  width: '1920px',
                  height: '1080px',
                }}
              >
                <AnimatePresence>
                  <motion.div
                    key={currentSlideId}
                    {...getTransitionVariants(currentSlideId)}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {clearContentEnabled ? null : renderSlide(currentSlideId)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {isFinalMinute && (
          <motion.div
            key="final-minute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-black relative overflow-hidden"
          >
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] ${isFJU ? 'bg-amber-600/10' : 'bg-yellow-600/10'} blur-[200px] rounded-full pointer-events-none`} />
            
            <span className={`${isFJU ? 'text-amber-500' : 'text-yellow-500'} text-3xl font-bold uppercase tracking-[0.5em] mb-8 animate-pulse z-10`}>
              {isFJU ? 'O Encontro Começa Em' : 'A Reunião Começa Em'}
            </span>
            
            <div className="relative h-[24rem] w-full flex items-center justify-center overflow-hidden z-10">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={diffSeconds}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute font-sans text-[24rem] text-white font-black leading-none tracking-tighter drop-shadow-[0_0_80px_rgba(255,255,255,0.15)] tabular-nums"
                >
                  {diffSeconds}
                </motion.div>
              </AnimatePresence>
            </div>
            
            <span className="text-stone-300 text-5xl font-medium tracking-[0.3em] mt-12 uppercase z-10">
              {diffSeconds === 1 ? "Segundo" : "Segundos"}
            </span>
          </motion.div>
        )}

        {isJustStarted && (
          <motion.div
            key="just-started"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full"
          >
            <VerseSlide 
              currentTime={currentTime} 
              customVerseText={customVerseText} 
              customVerseRef={customVerseRef} 
              activeVerseIndex={activeVerseIndex} 
              
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TICKER (LETREIRO DIGITAL) */}
      <AnimatePresence>
        {tickerText && !blackoutEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-0 left-0 w-full h-20 bg-yellow-600/90 backdrop-blur-md z-[100] flex items-center overflow-hidden border-t border-yellow-400/50"
          >
            <div className="whitespace-nowrap flex items-center gap-12 animate-ticker-scroll">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-[2.2rem] font-black text-black uppercase tracking-widest flex items-center gap-6">
                  <Bell className="w-10 h-10" />
                  {tickerText}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYNC TOAST ON PROJECTION */}
      <AnimatePresence>
        {syncStatus?.active && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-10 right-10 z-[200] bg-black/80 backdrop-blur-md border border-yellow-500/30 px-6 py-4 rounded-2xl flex items-center gap-4"
          >
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-2 border-yellow-500/10 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-transparent border-t-yellow-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-yellow-500 font-black text-xs uppercase tracking-[0.2em]">Sincronizando</span>
              <span className="text-white text-[1rem] font-medium tracking-tight opacity-80">{syncStatus.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
