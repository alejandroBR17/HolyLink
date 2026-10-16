import {FJU_CARDS,isFjuProject} from '../utils/fju-content';
import {FjuAgendaSlide} from './FjuAgendaSlide';
import {FjuProjectsSlide} from './FjuProjectsSlide';
import {FjuSlide} from './FjuSlide';
import {CountdownReadout,ProjectionCountdown,ProjectionMeetingStart} from './ProjectionCountdown';
import {ProjectedImage,ProjectionMediaFallback} from './ProjectionMedia';
import {Smartphone,Bell,ChurchBench,PrayingHands,Restroom,MessageSquareOff,Instagram,Flame,RefreshCw,Hand,HeartHandshake,CalendarDays,MessageSquareText} from './ui/icons';
import {isYouthProjection} from '../utils/projection-theme';
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, MotionConfig } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ParticlesBackground } from './ParticlesBackground';
import { ThreeBackground3D, BackgroundStyleOption } from './ThreeBackground3D';
import { VerseSlide } from './VerseSlide';
import { IconSlide, WorldGodSlide, AgendaDaySlide, DonationSlide, CampaignSlide, VideoSlide, MeetingEventSlide, BaptismSlide, BlessingSlide } from './slides';
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
  projectionMode?:'pre'|'post';
  projectionTheme?:'auto'|'fju'|'regular';
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
  finalMinuteDisplayMode?: 'split' | 'full_video';
  verseDisplayPriority?: 'verse_over_video' | 'video_over_verse';
  loopIteration?: number;
  onClearAlert: () => void;
  onVideoEnded?: () => void;
  isMiniature?: boolean;
  customMeetings?: Meeting[];
  customCampaigns?: any[];
  nextMeeting?: Meeting|null;
  nextMeetingDate?: Date|null;
  ongoingMeeting?: Meeting | null;
  volume?: number;
  tickerText?: string | null;
  background3DStyle?: BackgroundStyleOption;
  background3DFps?: 30 | 60;
  background3DIntensity?: 'high' | 'medium' | 'low';
  syncStatus?: { active: boolean; message: string; progress?: number } | null;
}

export const ProjectionContent: React.FC<ProjectionContentProps> = ({
  projectionMode='pre',
  projectionTheme='auto',
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
  finalMinuteDisplayMode = 'split',
  verseDisplayPriority = 'verse_over_video',
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
  background3DStyle = 'auto',
  background3DFps = 60,
  background3DIntensity = 'high',
  syncStatus = null
}) => {
  // Logic to detect FJU mode:
  // 1. If ongoing meeting is FJU / Encontro Jovem / Força Jovem
  // 2. If next meeting is FJU / Encontro Jovem / Força Jovem (active during pre-service loop and countdown)
  const reducedMotion=useReducedMotion();
  const isFJU = isYouthProjection(ongoingMeeting, nextMeeting, nextMeetingDate, currentTime, projectionTheme);

  const themeColor = isFJU ? 'text-hl-gold' : 'text-hl-gold';
  const borderColor = isFJU ? 'border-hl-gold/40' : 'border-white/10';
  const shadowColor = isFJU ? 'shadow-[0_40px_120px_rgba(24,73,138,0.5)]' : 'shadow-[0_40px_120px_rgba(0,0,0,0.9)]';

  // Performance diagnostics hook
  const { isLightModeActive, isHighModeActive, effectiveMode } = usePerformanceDiagnostics();

  const getTransitionVariants = (slideId: string) => {
    if(reducedMotion)return {initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.08}};
    if (isLightModeActive) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.35, ease: "easeInOut" as const }
      };
    }
    if (effectiveMode === 'balanced') {
      return {
        initial: { opacity: 0, scale: 0.99 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.01 },
        transition: { duration: 0.35, ease: "easeInOut" as const }
      };
    }
    if (slideId.startsWith('verse_') || slideId === 'world_god') {
      return {
        initial: { opacity: 0, scale: 0.97, filter: "blur(4px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 1.03, filter: "blur(4px)" },
        transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }
      };
    }
    return {
      initial: { opacity: 0, scale: 1.03, y: 10 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.97, y: -10 },
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }
    };
  };

  const renderSlide = (slideId: string) => {
    if(isFJU){
      if(isFjuProject(slideId))return <FjuProjectsSlide slideId={slideId}/>;
      if(slideId==='fju_agenda')return <FjuAgendaSlide meetings={customMeetings} now={currentTime}/>;
      if(slideId.startsWith('meeting_event_')){const meeting=customMeetings.find(m=>m.id===slideId.slice('meeting_event_'.length));if(meeting)return <FjuSlide label="PRÓXIMO ENCONTRO" title={meeting.theme} subtitle={`${meeting.date?format(new Date(meeting.date+'T12:00:00'),'dd/MM',{locale:ptBR}):meeting.dayName} · ${meeting.time}`} symbol={<CalendarDays/>}/>;}

      const card=FJU_CARDS[slideId];
      if(card){const symbols={hand:<Hand/>,seat:<ChurchBench/>,door:<Restroom/>,phone:<Smartphone/>,chat:<MessageSquareText/>,mute:<MessageSquareOff/>,fire:<Flame/>,social:<Instagram/>,heart:<HeartHandshake/>};return <FjuSlide {...card} symbol={symbols[card.symbol]}/>;}
    }

    if (slideId.startsWith("custom_")) {
      const media = customMediaList.find(m => m.id === slideId);
      if (!media) {
        return <ProjectionMediaFallback preview={isMiniature} id={currentSlideId} name="Arquivo não disponível neste aparelho"/>;
      }

      // Validação do caminho/URL da mídia
      const isMediaUrlValid = Boolean(
        media.url &&
        typeof media.url === 'string' &&
        media.url.trim().length > 0
      );

      if (!isMediaUrlValid) {
        return <ProjectionMediaFallback preview={isMiniature} id={media.id} kind={media.type} name={media.name}/>;
      }

      if (media.type === 'image') {
        const fitMode = media.fit || 'contain';
        const isCover = fitMode === 'cover';
        const isFullScreen = fitMode === 'fill';

        // Base padding and rounded corners logic
        const containerPadding = isFullScreen ? 'p-0' : 'p-12 @[768px]:p-20';
        const innerRounded = isFullScreen ? 'rounded-none' : 'rounded-[3.5rem]';
        const innerBg = isFullScreen ? 'bg-black' : 'bg-black/40';
        const innerBorder = isFullScreen ? 'border-none' : borderColor;
        const innerShadow = isFullScreen ? '' : shadowColor;

        const safeBgUrl = `url("${media.url.replace(/"/g, '\\"')}")`;

        return (
          <div className={`w-full h-full ${containerPadding} flex items-center justify-center bg-black/20`}>
            <div className={`w-full h-full relative ${innerRounded} overflow-hidden ${innerShadow} border ${innerBorder} ${innerBg}`}>
              {/* Background for non-matching aspect ratios */}
              {fitMode === 'contain' && (
                !isLightModeActive ? (
                  <div
                    className={`absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110 pointer-events-none`}
                    style={{ backgroundImage: safeBgUrl }}
                  />
                ) : (
                  /* Light Mode: Lightweight dark vignette, no blur filter pass */
                  <div className="absolute inset-0 bg-gradient-to-tr from-hl-canvas via-hl-panel to-black opacity-90 pointer-events-none" />
                )
              )}
              <ProjectedImage media={media} preview={isMiniature}/>
              {!isFullScreen && (
                <div className={`absolute inset-0 z-20 ring-1 ring-inset ${isFJU ? 'ring-hl-gold/20' : 'ring-white/20'} shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] pointer-events-none`} />
              )}
            </div>
          </div>
        );
      } else if (media.type === 'video') {
        const fitMode = media.fit || 'contain';
        const isCover = fitMode === 'cover';
        const isFullScreen = fitMode === 'fill';

        // Base padding and rounded corners logic
        const containerPadding = isFullScreen ? 'p-0' : 'p-12 @[768px]:p-20';
        const innerRounded = isFullScreen ? 'rounded-none' : 'rounded-[3.5rem]';
        const innerBg = isFullScreen ? 'bg-black' : 'bg-black/40';
        const innerBorder = isFullScreen ? 'border-none' : borderColor;
        const innerShadow = isFullScreen ? '' : shadowColor;

        return (
          <div className={`w-full h-full ${containerPadding} flex items-center justify-center bg-black/20`}>
            <div className={`w-full h-full relative ${innerRounded} overflow-hidden ${innerShadow} border ${innerBorder} ${innerBg}`}>
              {/* Background for videos */}
              {fitMode==='contain'&&<div className="projection-video-backdrop absolute inset-0 pointer-events-none"/>}
              <div className="w-full h-full relative z-10">
                <VideoSlide
                  media={media}
                  currentSlideId={currentSlideId}
                  videoPinBehavior={videoPinBehavior}
                  onVideoEnded={onVideoEnded}
                  preview={isMiniature}
                  volume={isMiniature ? 0 : volume}
                  fit={isFullScreen ? 'fill' : isCover ? 'cover' : 'contain'}
                />
              </div>
              {!isFullScreen && (
                <div className={`absolute inset-0 z-20 ring-1 ring-inset ${isFJU ? 'ring-hl-gold/20' : 'ring-white/20'} shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] pointer-events-none`} />
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
        return (
          <MeetingEventSlide
            meeting={meeting}
            variant={isFJU ? 'fju' : undefined}
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
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
      return (
        <AgendaDaySlide
          dayIndex={dayIndex}
          subType={subType}
          currentTime={currentTime}
          meetings={customMeetings}
          variant={isFJU ? 'fju' : undefined}
          effectiveMode={effectiveMode}
          isLightModeActive={isLightModeActive}
        />
      );
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
          variant={isFJU ? 'fju' : undefined}
          effectiveMode={effectiveMode}
          isLightModeActive={isLightModeActive}
        />
      );
    }

    switch (slideId) {
      case 'seat':
        return (
          <IconSlide
            icon={ChurchBench}
            title="Fique à vontade"
            subtitle="Procure um assento e acomode-se para o início da reunião."
            layout="split-left"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'bathroom':
        return (
          <IconSlide
            icon={Restroom}
            title="Vá ao banheiro"
            subtitle="Aproveite para ir antes da reunião começar."
            layout="split-right"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'phone':
        return (
          <IconSlide
            icon={Smartphone}
            title="Celular no Silencioso"
            subtitle="Mantenha o celular no silencioso para evitar interrupções."
            layout="center"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'no_chat':
        return (
          <IconSlide
            icon={MessageSquareOff}
            title="Momento de Concentração"
            subtitle="Evite conversas. Concentre-se em Deus."
            layout="split-left"
            category="CONCENTRAÇÃO"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'soon':
        return (
          <IconSlide
            icon={PrayingHands}
            title="Use a sua fé"
            subtitle="Mantenha seus pensamentos em Deus."
            pulse
            layout="center"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'social':
        return (
          <IconSlide
            icon={Instagram}
            title="Universal Jardim Osasco"
            subtitle={SOCIAL.instagram}
            layout="split-left"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'donations':
        return (
          <DonationSlide
            variant={isFJU ? 'fju' : undefined}
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'campaigns':
        return (
          <CampaignSlide
            campaigns={customCampaigns}
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'world_god':
        return (
          <WorldGodSlide
            backgroundStyle={background3DStyle} fps={background3DFps} detail={background3DIntensity}
            variant={isFJU ? 'fju' : undefined}
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'baptism':
        return (
          <BaptismSlide
            post={projectionMode==='post'}
            variant={isFJU ? 'fju' : undefined}
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'blessing':
        return (
          <BlessingSlide
            variant={isFJU ? 'fju' : undefined}
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      default:
        return null;
    }
  };
  const activeMedia = customMediaList.find(m => m.id === currentSlideId);
  const isCurrentSlideVideo = Boolean(activeMedia && activeMedia.type === 'video');
  const isCountdownActive = isFinalFiveMinutes || isFinalMinute;

  const shouldShowVerse = Boolean(
    customVerseText && (
      verseDisplayPriority === 'verse_over_video' ||
      !isCountdownActive
    )
  );

  return (
    <MotionConfig reducedMotion="user"><div data-projection-theme={isFJU?'fju':'regular'} className={`holy-theme holy-projection ${isFJU?'projection-fju':''} w-full h-full relative select-none font-sans overflow-hidden bg-hl-canvas text-white flex flex-col justify-between`}>
      {/* 3D Volumetric Background Engine */}
      <ThreeBackground3D
        disabled={background3DStyle === 'off' || background3DStyle === 'particles_2d'}
        isFJU={isFJU}
        diffSeconds={diffSeconds}
        stylePreset={background3DStyle}
        fpsLimit={background3DFps}
        intensity={background3DIntensity}
      />
      {/* Efeitos 2D Clássicos */}
      <ParticlesBackground youth={isFJU} disabled={background3DStyle !== 'particles_2d'} />

      {isFJU&&(!isLooping||shouldShowVerse)&&!clearContentEnabled&&<div className="projection-fju-signature"><img src="/brand/fju-white-v2.png" alt="Força Jovem Universal"/><span>Encontro Jovem</span></div>}
      {/* BLACKOUT OVERLAY */}
      {blackoutEnabled && (
        <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center">
          {isMiniature && (
            <span className="text-hl-dim font-bold uppercase tracking-[0.25em] text-4xl">
              Blackout Ativo
            </span>
          )}
        </div>
      )}

      {/* ALERT OVERLAY */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={reducedMotion?false:{ opacity: 0, y: isMiniature ? -50 : -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMiniature ? -50 : -100 }}
            className={`projection-notice ${isLooping&&!shouldShowVerse?'projection-notice-below-header':''} absolute ${isMiniature ? 'top-10' : 'top-12'} left-1/2 -translate-x-1/2 z-[90] bg-hl-gold text-black ${isMiniature ? 'px-10 py-6 rounded-[2rem] border-2' : 'px-12 py-7 rounded-[2rem] border-2 shadow-[0_25px_60px_rgba(0,0,0,0.6)] min-w-[700px]'} border-hl-gold flex items-center gap-8 max-w-[90%]`}
          >
            <Bell className={`${isMiniature ? 'w-12 h-12' : 'w-14 h-14 animate-[bounce_2s_infinite]'} text-black`} />
            <div className="text-left flex-1">
              <h2 className={`font-black ${isMiniature ? 'text-2xl' : 'text-2xl'} uppercase tracking-widest leading-none text-black`}>Aviso Importante</h2>
              <p className={`font-bold ${isMiniature ? 'text-3xl' : 'text-3xl'} mt-2 text-black leading-snug`}>
                {activeAlert === 'baby' ? alerts.baby.message : activeAlert === 'car' ? alerts.car.message : activeAlert}
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {shouldShowVerse ? (
          <motion.div
            key="verse-active"
            initial={reducedMotion?false:{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isLightModeActive ? 0.35 : 0.4 }}
            className="absolute inset-0 w-full h-full z-40 flex items-center justify-center"
          >
            <VerseSlide
              currentTime={currentTime}
              customVerseText={customVerseText}
              customVerseRef={customVerseRef}
              activeVerseIndex={activeVerseIndex}
              variant={isFJU ? 'fju' : undefined}
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
          </motion.div>
        ) : isFinalMinute || isFinalFiveMinutes ? (
          <motion.div key={isFinalMinute?'final-minute':'final-five'} initial={reducedMotion?false:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}} className="absolute inset-0">
            <ProjectionCountdown youth={isFJU} seconds={diffSeconds} final={isFinalMinute} video={isCurrentSlideVideo} fullVideo={finalMinuteDisplayMode==='full_video'}>
              <AnimatePresence><motion.div key={currentSlideId} {...getTransitionVariants(currentSlideId)} className="absolute inset-0 flex items-center justify-center">{clearContentEnabled?null:renderSlide(currentSlideId)}</motion.div></AnimatePresence>
            </ProjectionCountdown>
          </motion.div>
        ) : isJustStarted ? (
          <motion.div key="just-started" initial={reducedMotion?false:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.3}} className="absolute inset-0">
            <ProjectionMeetingStart><VerseSlide currentTime={currentTime} customVerseText={customVerseText} customVerseRef={customVerseRef} activeVerseIndex={activeVerseIndex} variant={isFJU?'fju':undefined} effectiveMode={effectiveMode} isLightModeActive={isLightModeActive}/></ProjectionMeetingStart>
          </motion.div>
        ) : isLooping ? (
          <motion.div
            key="looping"
            initial={reducedMotion?false:{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col"
          >
            <header className={`h-[145px] shrink-0 px-20 flex items-center justify-between border-b border-white/[0.08] bg-hl-canvas/75 backdrop-blur-md relative z-50`}>
              <div className={`flex justify-center ${isFJU?'projection-fju-heading':'flex-col'}`}>
                {isFJU&&<img src="/brand/fju-white-v2.png" alt="Força Jovem Universal"/>}
                <div>
                  <h1 className="font-sans font-black text-[3rem] @[1280px]:text-[3.3rem] tracking-[0.12em] text-white leading-none uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    {isFJU?'Encontro Jovem':churchInfo.name}
                  </h1>
                  <p className={`text-2xl font-black tracking-[0.25em] uppercase mt-1.5 ${isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright'}`}>
                    {churchInfo.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="flex items-center gap-8">
                  {projectionMode==='post'?<span className="projection-post-label">{isFJU?'Após o encontro':'Após a reunião'}</span>:nextMeetingDate?<CountdownReadout hours={hoursStr} minutes={minutesStr}/>:<span className="projection-post-label">{isFJU?'Sem encontro agendado':'Sem reunião agendada'}</span>}

                  {!isMiniature && (
                    <>
                      <div className="h-14 w-[1px] bg-white/[0.15]" />
                      <div className={`border-2 px-7 py-3 rounded-2xl flex flex-col items-center justify-center ${isFJU ? 'bg-hl-gold-strong/15 border-hl-gold/40 shadow-lg' : 'bg-white/[0.06] border-white/[0.15] shadow-lg'}`}>
                        <span className={`font-mono text-3xl @[1280px]:text-4xl font-black tracking-wider ${isFJU ? 'text-hl-gold-bright' : 'text-hl-copy'}`}>
                          {format(currentTime, 'HH:mm:ss')}
                        </span>
                        <span className={`font-sans text-sm @[1280px]:text-base font-bold tracking-[0.15em] uppercase mt-1 ${isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/90'}`}>
                          {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 relative w-full overflow-hidden bg-transparent">
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
        ) : null}
      </AnimatePresence>

      {/* TICKER (LETREIRO DIGITAL) */}
      <AnimatePresence>
        {tickerText && !blackoutEnabled && (
          <motion.div
            initial={reducedMotion?false:{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-0 left-0 w-full h-20 bg-hl-gold-strong/90 backdrop-blur-md z-[100] flex items-center overflow-hidden border-t border-hl-gold/50"
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
        {isMiniature && syncStatus?.active && (
          <motion.div
            initial={reducedMotion?false:{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-10 right-10 z-[200] bg-black/80 backdrop-blur-md border border-hl-gold/30 px-6 py-4 rounded-2xl flex items-center gap-4"
          >
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-2 border-hl-gold/10 rounded-full" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-transparent border-t-yellow-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-hl-gold animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-hl-gold font-black text-xs uppercase tracking-[0.2em]">Sincronizando</span>
              <span className="text-white text-[1rem] font-medium tracking-tight opacity-80">{syncStatus.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div></MotionConfig>
  );
};
