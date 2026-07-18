import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Armchair, DoorOpen, Smartphone, MessageSquareOff, Clock, Instagram, Globe, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ParticlesBackground } from './ParticlesBackground';
import { VerseSlide } from './VerseSlide';
import { IconSlide, WorldGodSlide, AgendaDaySlide, DonationSlide, CampaignSlide, VideoSlide, MeetingEventSlide } from './slides';
import { SOCIAL } from '../data';
import { Meeting } from '../types';

interface CustomMedia {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number;
  enabledInLoop: boolean;
  url: string;
  muted?: boolean;
  fit?: 'contain' | 'cover';
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
  customCampaigns = []
}) => {
  const getTransitionVariants = (slideId: string) => {
    if (slideId.startsWith('verse_') || slideId === 'world_god') {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 1.5, ease: "easeInOut" }
      };
    }
    return {
      initial: { opacity: 0, scale: 1.05 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.8, ease: "easeInOut" }
    };
  };

  const renderSlide = (slideId: string) => {
    if (slideId.startsWith("custom_")) {
      const media = customMediaList.find(m => m.id === slideId);
      if (!media) return <div className="text-stone-500 text-3xl font-bold flex items-center justify-center h-full w-full bg-black">Mídia não encontrada</div>;
      if (media.type === 'image') {
        const isCover = media.fit === 'cover';
        return (
          <div className={`w-full h-full flex items-center justify-center relative ${isCover ? 'p-0' : 'p-6'}`}>
            <img 
              src={media.url} 
              alt={media.name} 
              className={isCover ? "w-full h-full object-cover" : "max-w-full max-h-full object-contain rounded-2xl shadow-2xl"}
              referrerPolicy="no-referrer"
            />
          </div>
        );
      } else if (media.type === 'video') {
        return (
          <VideoSlide 
            media={media} 
            currentSlideId={currentSlideId} 
            videoPinBehavior={videoPinBehavior}
            onVideoEnded={onVideoEnded}
          />
        );
      }
    }
    if (slideId.startsWith("meeting_event_")) {
      const meetId = slideId.replace("meeting_event_", "");
      const meeting = (customMeetings || []).find(m => m.id === meetId);
      if (meeting) {
        return <MeetingEventSlide meeting={meeting} />;
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
      return <AgendaDaySlide dayIndex={dayIndex} subType={subType} currentTime={currentTime} meetings={customMeetings} />;
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
        return <IconSlide icon={Armchair} title="Fique à vontade" subtitle="Procure um assento e acomode-se para o início da reunião." layout="split-left" />;
      case 'bathroom':
        return <IconSlide icon={DoorOpen} title="Vá ao banheiro" subtitle="Aproveite para ir antes da reunião começar." layout="split-right" />;
      case 'phone':
        return <IconSlide icon={Smartphone} title="Celular no Silencioso" subtitle="Mantenha o celular no silencioso para evitar interrupções." layout="center" />;
      case 'no_chat':
        return <IconSlide icon={MessageSquareOff} title="Silêncio" subtitle="Desligue-se das conversas e concentre-se na reunião." layout="split-left" />;
      case 'soon':
        return <IconSlide icon={Clock} title="A reunião começa" subtitle="em instantes..." pulse layout="center" />;
      case 'social':
        return <IconSlide icon={Instagram} title="Siga nosso Instagram" subtitle={SOCIAL.instagram} layout="split-left" />;
      case 'donations':
        return <DonationSlide />;
      case 'campaigns':
        return <CampaignSlide campaigns={customCampaigns} />;
      case 'world_god':
        return <WorldGodSlide />;
      default:
        return null;
    }
  };
  return (
    <div className="w-full h-full relative select-none font-sans overflow-hidden bg-[#050000] text-white flex flex-col justify-between">
      <ParticlesBackground disabled={isMiniature} />
      
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
            <header className="h-[145px] shrink-0 px-24 flex items-center justify-between border-b border-white/[0.05] bg-gradient-to-b from-black to-stone-950/40 relative z-40">
              <div>
                <h1 className="font-sans font-black text-[3rem] tracking-[0.16em] text-white leading-none uppercase">
                  {churchInfo.name}
                </h1>
                <p className="text-xl font-bold tracking-[0.62em] text-yellow-500 uppercase mt-2">
                  {churchInfo.location}
                </p>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <span className="text-[11px] font-bold text-stone-400 tracking-[0.25em] uppercase block mb-1">
                    A Reunião Começa em:
                  </span>
                  <div className="flex items-baseline justify-end gap-1 font-mono text-white text-4xl font-bold tracking-tighter">
                    <span>{hoursStr}</span>
                    <span className="text-base font-sans text-stone-500 uppercase font-bold mr-2">h</span>
                    <span className={!isMiniature ? "text-yellow-500 animate-pulse" : ""}>:</span>
                    <span>{minutesStr}</span>
                    <span className="text-base font-sans text-stone-500 uppercase font-bold">m</span>
                  </div>
                </div>
                
                {!isMiniature && (
                  <>
                    <div className="h-12 w-[1px] bg-white/[0.1]" />
                    <div className="bg-white/[0.02] border border-white/[0.05] px-6 py-3 rounded-xl flex flex-col items-center justify-center">
                      <span className="font-mono text-3xl font-bold tracking-wider text-stone-200">
                        {format(currentTime, 'HH:mm:ss')}
                      </span>
                      <span className="font-sans text-xs tracking-[0.2em] text-stone-500 uppercase mt-1">
                        {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </header>

            <main className="flex-1 relative w-full overflow-hidden">
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
            <div className="w-[35%] h-full flex flex-col items-center justify-center border-r border-white/[0.05] bg-[#030000] z-20">
              <span className="text-yellow-500 text-[2rem] font-bold uppercase tracking-[0.4em] mb-4">
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
                    className="absolute font-mono text-[7.5rem] text-white font-black leading-none tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.05)]"
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-yellow-600/10 blur-[200px] rounded-full pointer-events-none" />
            
            <span className="text-yellow-500 text-3xl font-bold uppercase tracking-[0.5em] mb-8 animate-pulse z-10">
              A Reunião Começa Em
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
    </div>
  );
};
