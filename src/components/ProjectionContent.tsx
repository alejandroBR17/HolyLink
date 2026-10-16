import {ProjectedImage,ProjectionMediaFallback} from './ProjectionMedia';
import {Smartphone,Bell,Armchair,Restroom,MessageSquareOff,Clock,Instagram,Flame,RefreshCw} from './ui/icons';
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
  const isFJU = isYouthProjection(ongoingMeeting, nextMeeting, nextMeetingDate, currentTime);

  const themeColor = isFJU ? 'text-hl-gold' : 'text-hl-gold';
  const borderColor = isFJU ? 'border-hl-gold/40' : 'border-white/10';
  const shadowColor = isFJU ? 'shadow-[0_40px_120px_rgba(180,83,9,0.5)]' : 'shadow-[0_40px_120px_rgba(0,0,0,0.9)]';

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
        if (isFJU) {
          return (
            <IconSlide
              icon={Armchair}
              title="Cola aí!"
              subtitle="Encontre seu lugar e chega mais, o Encontro Jovem vai começar!"
              layout="split-left"
              variant="fju"
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
          );
        }
        return (
          <IconSlide
            icon={Armchair}
            title="Fique à vontade"
            subtitle="Procure um assento e acomode-se para o início da reunião."
            layout="split-left"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'bathroom':
        if (isFJU) {
          return (
            <IconSlide
              icon={Restroom}
              title="Pit Stop"
              subtitle="Aproveite agora para ir ao banheiro. Depois que começar, ninguém quer sair!"
              layout="split-right"
              variant="fju"
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
          );
        }
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
        if (isFJU) {
          return (
            <IconSlide
              icon={Smartphone}
              title="Foco Total"
              subtitle="Desliga as notificações aí! Vamos focar 100% no que vai rolar no Encontro Jovem."
              layout="center"
              variant="fju"
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
          );
        }
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
        if (isFJU) {
          return (
            <IconSlide
              icon={MessageSquareOff}
              title="Fica Ligado"
              subtitle="O Encontro Jovem está quase começando. Encerre os papos e prepare-se, não perde nada!"
              layout="split-left"
              variant="fju"
              category="FORÇA JOVEM UNIVERSAL"
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
          );
        }
        return (
          <IconSlide
            icon={MessageSquareOff}
            title="Momento de Concentração"
            subtitle="À medida que a reunião se aproxima, vá diminuindo as conversas e concentre-se na presença de Deus."
            layout="split-left"
            category="CONCENTRAÇÃO"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
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
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
          );
        }
        return (
          <IconSlide
            icon={Clock}
            title="A reunião começa"
            subtitle="em instantes..."
            pulse
            layout="center"
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'social':
        if (isFJU) {
          return (
            <IconSlide
              icon={Instagram}
              title="FJU no Story"
              subtitle={`Siga a gente e marque o ${SOCIAL.instagram}`}
              layout="split-left"
              variant="fju"
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
          );
        }
        return (
          <IconSlide
            icon={Instagram}
            title="Siga nosso Instagram"
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
            variant={isFJU ? 'fju' : undefined}
            effectiveMode={effectiveMode}
            isLightModeActive={isLightModeActive}
          />
        );
      case 'baptism':
        return (
          <BaptismSlide
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
    <MotionConfig reducedMotion="user"><div className="holy-theme holy-projection w-full h-full relative select-none font-sans overflow-hidden bg-hl-canvas text-white flex flex-col justify-between">
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
      <ParticlesBackground disabled={background3DStyle !== 'particles_2d'} />

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
            className={`absolute inset-0 w-full h-full z-40 flex items-center justify-center ${
              isLightModeActive ? 'bg-black/50' : 'bg-black/20 backdrop-blur-[2px]'
            }`}
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
        ) : isFinalMinute ? (
          <motion.div
            key="final-minute"
            initial={reducedMotion?false:{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex w-full h-full bg-hl-canvas relative overflow-hidden"
          >
            {/* Ambient Background Glows */}
            {!isLightModeActive && (
              <>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none blur-[180px] ${
                  isFJU ? 'bg-hl-gold-strong/15' : 'bg-hl-gold/10'
                }`} />
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black pointer-events-none" />
              </>
            )}

            {!isCurrentSlideVideo ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative z-20 px-8 select-none">
                {/* Header Badge */}
                <motion.div
                  initial={reducedMotion?false:{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-8 ${
                    isFJU
                      ? 'bg-hl-gold/10 border border-hl-gold/30'
                      : 'bg-white/[0.04] border border-hl-gold/25'
                  } backdrop-blur-md`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright'
                  }`} />
                  <span className={`text-xl @[1280px]:text-2xl font-black tracking-[0.3em] uppercase font-mono ${
                    isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'
                  }`}>
                    {isFJU ? 'CONTAGEM REGRESSIVA • FJU' : 'CONTAGEM REGRESSIVA'}
                  </span>
                </motion.div>

                {/* Main Title */}
                <motion.h1
                  initial={reducedMotion?false:{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-sans font-black text-[4.5rem] @[1280px]:text-[5.8rem] text-white uppercase tracking-tight leading-none mb-10 text-center drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]"
                >
                  {isFJU ? 'O Encontro Vai Começar!' : 'A Reunião Vai Começar'}
                </motion.h1>

                {/* Monumental Circular Gauge & Number */}
                <div className="relative w-[340px] h-[340px] @[1280px]:w-[420px] @[1280px]:h-[420px] flex items-center justify-center my-2">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 400 400">
                    {/* Background Track */}
                    <circle
                      cx="200"
                      cy="200"
                      r="175"
                      className="stroke-white/[0.06]"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Glowing Progress Ring */}
                    <circle
                      cx="200"
                      cy="200"
                      r="175"
                      className={`${isFJU ? 'stroke-amber-400' : 'stroke-yellow-400'} transition-all duration-1000 ease-linear`}
                      strokeWidth="12"
                      strokeDasharray={2 * Math.PI * 175}
                      strokeDashoffset={(2 * Math.PI * 175) * (1 - (diffSeconds / 60))}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>

                  {/* Inner Glass Disc */}
                  <div className={`absolute inset-6 rounded-full ${
                    isFJU
                      ? 'bg-black/60 border border-hl-gold/30'
                      : 'bg-hl-canvas/80 border border-hl-gold/25'
                  } backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl overflow-hidden`}>
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={diffSeconds}
                        initial={reducedMotion?false:{ opacity: 0, scale: 0.75, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.25, y: -15 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`font-mono text-[9.5rem] @[1280px]:text-[12.5rem] font-black leading-none tracking-tighter tabular-nums ${
                          diffSeconds <= 10
                            ? (isFJU
                                ? 'text-hl-gold-bright drop-shadow-[0_0_60px_rgba(255,211,79,0.85)]'
                                : 'text-hl-gold-bright drop-shadow-[0_0_55px_rgba(255,211,79,0.7)]')
                            : 'text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                        }`}
                      >
                        {diffSeconds}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Subtitle / Reverence Guidance */}
                <div className="flex flex-col items-center text-center mt-8">
                  <span className="text-hl-gold-bright/90 text-2xl @[1280px]:text-3xl font-mono uppercase tracking-[0.35em] font-extrabold mb-3">
                    {diffSeconds === 1 ? "Segundo Restante" : "Segundos Restantes"}
                  </span>
                  <p className="text-hl-soft text-2xl @[1280px]:text-3xl font-normal max-w-3xl leading-relaxed">
                    {isFJU
                      ? "Vem pra FJU! Desliga as notificações e chega mais!"
                      : "Em oração e reverência, prepare-se para ouvir a voz do Senhor."
                    }
                  </p>
                </div>
              </div>
            ) : finalMinuteDisplayMode === 'full_video' ? (
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-black">
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
            ) : (
              <>
                <div className={`w-[36%] h-full flex flex-col items-center justify-center border-r ${
                  isFJU ? 'border-hl-gold/20 bg-hl-panel/90' : 'border-hl-gold/20 bg-hl-canvas/95'
                } backdrop-blur-2xl z-20 px-8 select-none`}>
                  <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full mb-6 ${
                    isFJU ? 'bg-hl-gold/10 border border-hl-gold/30' : 'bg-white/[0.04] border border-hl-gold/25'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright'}`} />
                    <span className={`text-base @[1280px]:text-lg font-black tracking-[0.25em] uppercase font-mono ${
                      isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright'
                    }`}>
                      {isFJU ? 'FJU AO VIVO' : 'CONTAGEM REGRESSIVA'}
                    </span>
                  </div>

                  <span className="text-white text-3xl @[1280px]:text-4xl font-extrabold uppercase tracking-tight mb-8 text-center">
                    {isFJU ? 'O Encontro Começa Em' : 'A Reunião Começa Em'}
                  </span>

                  <div className="relative w-[260px] h-[260px] @[1280px]:w-[300px] @[1280px]:h-[300px] flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 300 300">
                      <circle
                        cx="150"
                        cy="150"
                        r="130"
                        className="stroke-white/[0.06]"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="150"
                        cy="150"
                        r="130"
                        className={`${isFJU ? 'stroke-amber-400' : 'stroke-yellow-400'} transition-all duration-1000 ease-linear`}
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 130}
                        strokeDashoffset={(2 * Math.PI * 130) * (1 - (diffSeconds / 60))}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>

                    <div className={`absolute inset-4 rounded-full ${
                      isFJU ? 'bg-black/60 border border-hl-gold/30' : 'bg-hl-canvas/80 border border-hl-gold/25'
                    } flex flex-col items-center justify-center`}>
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={diffSeconds}
                          initial={reducedMotion?false:{ opacity: 0, scale: 0.75, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 1.25, y: -12 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className={`font-mono text-[7rem] @[1280px]:text-[8.5rem] font-black leading-none tracking-tighter tabular-nums ${
                            diffSeconds <= 10
                              ? (isFJU ? 'text-hl-gold-bright drop-shadow-[0_0_40px_rgba(255,211,79,0.8)]' : 'text-hl-gold-bright drop-shadow-[0_0_35px_rgba(255,211,79,0.7)]')
                              : 'text-white'
                          }`}
                        >
                          {diffSeconds}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  <span className="text-hl-gold-bright/90 text-xl @[1280px]:text-2xl font-mono uppercase tracking-[0.3em] font-extrabold mt-6">
                    {diffSeconds === 1 ? "Segundo" : "Segundos"}
                  </span>
                </div>

                <div className="w-[64%] h-full flex items-center justify-center relative overflow-hidden bg-transparent">
                  <div
                    className="absolute origin-center flex flex-col items-center justify-center transform scale-[0.64]"
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
              </>
            )}
          </motion.div>
        ) : isFinalFiveMinutes ? (
          <motion.div
            key="final-five"
            initial={reducedMotion?false:{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex w-full h-full bg-hl-canvas relative overflow-hidden"
          >
            {/* Left Pod: 38% Width */}
            <div className={`w-[38%] h-full flex flex-col items-center justify-between border-r ${
              isFJU ? 'border-hl-gold/20 bg-hl-panel/90' : 'border-hl-gold/20 bg-hl-canvas/95'
            } backdrop-blur-2xl z-20 px-10 py-16 select-none`}>
              {/* Top Badge */}
              <div className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full ${
                isFJU ? 'bg-hl-gold/10 border border-hl-gold/30' : 'bg-white/[0.04] border border-hl-gold/25'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-hl-gold-bright animate-ping' : 'bg-hl-gold-bright'}`} />
                <span className={`text-lg @[1280px]:text-xl font-black tracking-[0.25em] uppercase font-mono ${
                  isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright/95'
                }`}>
                  {isFJU ? 'FALTAM 5 MINUTOS • FJU' : 'PREPARAÇÃO PARA A REUNIÃO'}
                </span>
              </div>

              {/* Center Countdown Unit */}
              <div className="flex flex-col items-center w-full">
                <span className="text-white text-3xl @[1280px]:text-4xl font-extrabold uppercase tracking-tight mb-8 text-center">
                  {isFJU ? 'O Encontro Começa em' : 'A Reunião Começa em'}
                </span>

                {/* Digital Pod Boxes */}
                <div className="flex items-center justify-center gap-5 @[1280px]:gap-7 w-full max-w-md">
                  <div className={`flex-1 flex flex-col items-center ${
                    isFJU ? 'bg-black/60 border border-hl-gold/30' : 'bg-hl-canvas/80 border border-hl-gold/25'
                  } rounded-3xl py-7 shadow-2xl relative overflow-hidden`}>
                    <span className="font-mono text-[6.5rem] @[1280px]:text-[7.8rem] font-black text-white leading-none tabular-nums">
                      {formatMinutesPart}
                    </span>
                    <span className="text-hl-gold-bright/90 text-sm @[1280px]:text-base font-mono uppercase tracking-[0.25em] font-extrabold mt-3">
                      Minutos
                    </span>
                  </div>

                  <span className="text-hl-gold-bright font-mono text-5xl font-black mb-6">:</span>

                  <div className={`flex-1 flex flex-col items-center ${
                    isFJU ? 'bg-black/60 border border-hl-gold/30' : 'bg-hl-canvas/80 border border-hl-gold/25'
                  } rounded-3xl py-7 shadow-2xl relative overflow-hidden`}>
                    <span className="font-mono text-[6.5rem] @[1280px]:text-[7.8rem] font-black text-white leading-none tabular-nums">
                      {formatSecondsPart}
                    </span>
                    <span className="text-hl-gold-bright/90 text-sm @[1280px]:text-base font-mono uppercase tracking-[0.25em] font-extrabold mt-3">
                      Segundos
                    </span>
                  </div>
                </div>

                {/* Progress Bar (5 min to 1 min window) */}
                <div className="w-full max-w-md mt-10">
                  <div className="w-full h-2.5 bg-white/[0.08] rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isFJU
                          ? 'bg-gradient-to-r from-hl-gold to-hl-gold-bright shadow-[0_0_15px_rgba(255,211,79,0.5)]'
                          : 'bg-gradient-to-r from-hl-gold-strong to-hl-gold-bright shadow-[0_0_15px_rgba(255,211,79,0.4)]'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, ((300 - Math.min(300, Math.max(60, diffSeconds))) / 240) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Solemn Advice */}
              <p className="text-hl-soft text-xl @[1280px]:text-2xl text-center max-w-sm font-normal leading-relaxed">
                {isFJU
                  ? "Aquece aí que estamos nos preparativos finais!"
                  : "Mantenha sua mente em oração e expectativa pela Palavra de Deus."
                }
              </p>
            </div>

            {/* Right Slide Stage: 62% Width */}
            <div className="w-[62%] h-full flex items-center justify-center relative overflow-hidden bg-transparent">
              <div
                className="absolute origin-center flex flex-col items-center justify-center transform scale-[0.62]"
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
        ) : isJustStarted ? (
          <motion.div
            key="just-started"
            initial={reducedMotion?false:{ opacity: 0 }}
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
              variant={isFJU ? 'fju' : undefined}
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
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
              <div className="flex flex-col justify-center">
                <div>
                  <h1 className="font-sans font-black text-[3rem] @[1280px]:text-[3.3rem] tracking-[0.12em] text-white leading-none uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    {churchInfo.name}
                  </h1>
                  <p className={`text-2xl font-black tracking-[0.25em] uppercase mt-1.5 ${isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright'}`}>
                    {churchInfo.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-sm @[1280px]:text-base font-black text-hl-gold-bright/90 tracking-[0.2em] uppercase block mb-1">
                      {nextMeetingDate ? isFJU ? 'O Encontro Começa em:' : 'A Reunião Começa em:' : 'Agenda'}
                    </span>
                    {nextMeetingDate ? <div className="flex items-baseline justify-end gap-1.5 font-mono text-white text-5xl font-black tracking-tight">
                      <span>{hoursStr}</span>
                      <span className="text-xl font-sans text-hl-muted uppercase font-extrabold mr-2">h</span>
                      <span className={!isMiniature ? `${isFJU ? 'text-hl-gold-bright' : 'text-hl-gold-bright'} animate-pulse` : ""}>:</span>
                      <span>{minutesStr}</span>
                      <span className="text-xl font-sans text-hl-muted uppercase font-extrabold">m</span>
                    </div> : <p className="text-2xl text-hl-copy">Sem reunião agendada</p>}
                  </div>

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
