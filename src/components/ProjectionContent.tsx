import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Armchair, DoorOpen, Smartphone, MessageSquareOff, Clock, Instagram, Globe, Flame, Users2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ParticlesBackground } from './ParticlesBackground';
import { ThreeBackground3D, BackgroundStyleOption } from './ThreeBackground3D';
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
  finalMinuteDisplayMode?: 'split' | 'full_video';
  verseDisplayPriority?: 'verse_over_video' | 'video_over_verse';
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
  const isFJU = (() => {
    const ongoingTheme = (ongoingMeeting?.theme || '').toLowerCase();
    if (
      ongoingTheme.includes('encontro jovem') ||
      ongoingTheme.includes('fju') ||
      ongoingTheme.includes('força jovem') ||
      ongoingTheme.includes('jovem')
    ) {
      return true;
    }

    const nextTheme = (nextMeeting?.theme || '').toLowerCase();
    if (
      nextTheme.includes('encontro jovem') ||
      nextTheme.includes('fju') ||
      nextTheme.includes('força jovem') ||
      nextTheme.includes('jovem')
    ) {
      if (nextMeetingDate) {
        const diffMs = nextMeetingDate.getTime() - currentTime.getTime();
        const diffMins = diffMs / (1000 * 60);
        return diffMins <= 240 && diffMins >= -90;
      }
      return true;
    }

    return false;
  })();

  const themeColor = isFJU ? 'text-amber-500' : 'text-yellow-500';
  const borderColor = isFJU ? 'border-amber-500/40' : 'border-white/10';
  const shadowColor = isFJU ? 'shadow-[0_40px_120px_rgba(180,83,9,0.5)]' : 'shadow-[0_40px_120px_rgba(0,0,0,0.9)]';

  // Performance diagnostics hook
  const { isLightModeActive, isHighModeActive, effectiveMode } = usePerformanceDiagnostics();

  const getTransitionVariants = (slideId: string) => {
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
        return (
          <div className="text-stone-400 text-2xl font-bold flex flex-col items-center justify-center h-full w-full bg-black/60 p-8 text-center">
            <span className="text-amber-500 font-extrabold text-3xl mb-2">Mídia Não Encontrada</span>
            <p className="text-stone-300 text-lg">A mídia associada a este slide não está disponível na lista atual.</p>
          </div>
        );
      }

      // Validação do caminho/URL da mídia
      const isMediaUrlValid = Boolean(
        media.url && 
        typeof media.url === 'string' && 
        media.url.trim().length > 0
      );

      if (!isMediaUrlValid) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/70 text-white p-8 text-center">
            <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center max-w-lg">
              <span className="text-amber-400 font-extrabold text-2xl mb-2">Aguardando Mídia / URL Inválida</span>
              <p className="text-stone-300 text-base mb-4">{media.name || 'Arquivo de mídia com URL ausente ou em sincronização'}</p>
              <span className="text-xs text-amber-500/80 bg-black/40 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                {media.type === 'video' ? 'Vídeo' : 'Imagem'} • ID: {media.id}
              </span>
            </div>
          </div>
        );
      }

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
                  <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-zinc-900 to-black opacity-90 pointer-events-none" />
                )
              )}
              <img 
                src={media.url} 
                alt={media.name} 
                className={`w-full h-full relative z-10 ${isCover ? 'object-cover' : isFullScreen ? 'object-fill' : 'object-contain'}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  console.warn("Erro ao carregar imagem de projeção:", media.name, media.url);
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent && !parent.querySelector('.img-error-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'img-error-fallback absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 text-amber-400 p-6 text-center';
                    fallback.innerHTML = `<span class="font-bold text-xl mb-1">Erro de Carregamento</span><span class="text-stone-300 text-sm">${media.name}</span>`;
                    parent.appendChild(fallback);
                  }
                }}
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
                isHighModeActive ? (
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
                  /* Balanced & Light Mode: Zero duplicate video decoders, lightweight dark vignette */
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
              icon={DoorOpen} 
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
            icon={DoorOpen} 
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
    <div className="w-full h-full relative select-none font-sans overflow-hidden bg-[#050000] text-white flex flex-col justify-between">
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
        {shouldShowVerse ? (
          <motion.div
            key="verse-active"
            initial={{ opacity: 0 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex w-full h-full bg-[#030201] relative overflow-hidden"
          >
            {/* Ambient Background Glows */}
            {!isLightModeActive && (
              <>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none blur-[180px] ${
                  isFJU ? 'bg-amber-600/15' : 'bg-yellow-500/10'
                }`} />
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black pointer-events-none" />
              </>
            )}

            {!isCurrentSlideVideo ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative z-20 px-8 select-none">
                {/* Header Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className={`inline-flex items-center gap-3 px-8 py-3 rounded-full mb-8 ${
                    isFJU 
                      ? 'bg-amber-500/10 border border-amber-500/30' 
                      : 'bg-white/[0.04] border border-amber-500/25'
                  } backdrop-blur-md`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400'
                  }`} />
                  <span className={`text-xl xl:text-2xl font-black tracking-[0.3em] uppercase font-mono ${
                    isFJU ? 'text-amber-400' : 'text-amber-300/95'
                  }`}>
                    {isFJU ? 'CONTAGEM REGRESSIVA • FJU' : 'CONTAGEM REGRESSIVA'}
                  </span>
                </motion.div>

                {/* Main Title */}
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-sans font-black text-[4.5rem] xl:text-[5.8rem] text-white uppercase tracking-tight leading-none mb-10 text-center drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]"
                >
                  {isFJU ? 'O Encontro Vai Começar!' : 'A Reunião Vai Começar'}
                </motion.h1>

                {/* Monumental Circular Gauge & Number */}
                <div className="relative w-[340px] h-[340px] xl:w-[420px] xl:h-[420px] flex items-center justify-center my-2">
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
                      ? 'bg-black/60 border border-amber-500/30' 
                      : 'bg-zinc-950/80 border border-amber-500/25'
                  } backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl overflow-hidden`}>
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={diffSeconds}
                        initial={{ opacity: 0, scale: 0.75, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.25, y: -15 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`font-mono text-[9.5rem] xl:text-[12.5rem] font-black leading-none tracking-tighter tabular-nums ${
                          diffSeconds <= 10 
                            ? (isFJU 
                                ? 'text-amber-400 drop-shadow-[0_0_60px_rgba(245,158,11,0.85)]' 
                                : 'text-yellow-400 drop-shadow-[0_0_55px_rgba(234,179,8,0.7)]')
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
                  <span className="text-amber-400/90 text-2xl xl:text-3xl font-mono uppercase tracking-[0.35em] font-extrabold mb-3">
                    {diffSeconds === 1 ? "Segundo Restante" : "Segundos Restantes"}
                  </span>
                  <p className="text-stone-300 text-2xl xl:text-3xl font-normal max-w-3xl leading-relaxed">
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
                  isFJU ? 'border-amber-500/20 bg-[#080400]/90' : 'border-amber-500/20 bg-[#060402]/95'
                } backdrop-blur-2xl z-20 px-8 select-none`}>
                  <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full mb-6 ${
                    isFJU ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/[0.04] border border-amber-500/25'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400'}`} />
                    <span className={`text-base xl:text-lg font-black tracking-[0.25em] uppercase font-mono ${
                      isFJU ? 'text-amber-400' : 'text-amber-300'
                    }`}>
                      {isFJU ? 'FJU AO VIVO' : 'CONTAGEM REGRESSIVA'}
                    </span>
                  </div>

                  <span className="text-white text-3xl xl:text-4xl font-extrabold uppercase tracking-tight mb-8 text-center">
                    {isFJU ? 'O Encontro Começa Em' : 'A Reunião Começa Em'}
                  </span>

                  <div className="relative w-[260px] h-[260px] xl:w-[300px] xl:h-[300px] flex items-center justify-center">
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
                      isFJU ? 'bg-black/60 border border-amber-500/30' : 'bg-zinc-950/80 border border-amber-500/25'
                    } flex flex-col items-center justify-center`}>
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={diffSeconds}
                          initial={{ opacity: 0, scale: 0.75, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 1.25, y: -12 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className={`font-mono text-[7rem] xl:text-[8.5rem] font-black leading-none tracking-tighter tabular-nums ${
                            diffSeconds <= 10 
                              ? (isFJU ? 'text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.8)]' : 'text-yellow-400 drop-shadow-[0_0_35px_rgba(234,179,8,0.7)]')
                              : 'text-white'
                          }`}
                        >
                          {diffSeconds}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  <span className="text-amber-400/90 text-xl xl:text-2xl font-mono uppercase tracking-[0.3em] font-extrabold mt-6">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex w-full h-full bg-[#030201] relative overflow-hidden"
          >
            {/* Left Pod: 38% Width */}
            <div className={`w-[38%] h-full flex flex-col items-center justify-between border-r ${
              isFJU ? 'border-amber-500/20 bg-[#080400]/90' : 'border-amber-500/20 bg-[#060402]/95'
            } backdrop-blur-2xl z-20 px-10 py-16 select-none`}>
              {/* Top Badge */}
              <div className={`inline-flex items-center gap-3 px-7 py-2.5 rounded-full ${
                isFJU ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/[0.04] border border-amber-500/25'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isFJU ? 'bg-amber-400 animate-ping' : 'bg-amber-400'}`} />
                <span className={`text-lg xl:text-xl font-black tracking-[0.25em] uppercase font-mono ${
                  isFJU ? 'text-amber-400' : 'text-amber-300/95'
                }`}>
                  {isFJU ? 'FALTAM 5 MINUTOS • FJU' : 'PREPARAÇÃO PARA A REUNIÃO'}
                </span>
              </div>

              {/* Center Countdown Unit */}
              <div className="flex flex-col items-center w-full">
                <span className="text-white text-3xl xl:text-4xl font-extrabold uppercase tracking-tight mb-8 text-center">
                  {isFJU ? 'O Encontro Começa em' : 'A Reunião Começa em'}
                </span>

                {/* Digital Pod Boxes */}
                <div className="flex items-center justify-center gap-5 xl:gap-7 w-full max-w-md">
                  <div className={`flex-1 flex flex-col items-center ${
                    isFJU ? 'bg-black/60 border border-amber-500/30' : 'bg-zinc-950/80 border border-amber-500/25'
                  } rounded-3xl py-7 shadow-2xl relative overflow-hidden`}>
                    <span className="font-mono text-[6.5rem] xl:text-[7.8rem] font-black text-white leading-none tabular-nums">
                      {formatMinutesPart}
                    </span>
                    <span className="text-amber-400/90 text-sm xl:text-base font-mono uppercase tracking-[0.25em] font-extrabold mt-3">
                      Minutos
                    </span>
                  </div>

                  <span className="text-amber-400 font-mono text-5xl font-black mb-6">:</span>

                  <div className={`flex-1 flex flex-col items-center ${
                    isFJU ? 'bg-black/60 border border-amber-500/30' : 'bg-zinc-950/80 border border-amber-500/25'
                  } rounded-3xl py-7 shadow-2xl relative overflow-hidden`}>
                    <span className="font-mono text-[6.5rem] xl:text-[7.8rem] font-black text-white leading-none tabular-nums">
                      {formatSecondsPart}
                    </span>
                    <span className="text-amber-400/90 text-sm xl:text-base font-mono uppercase tracking-[0.25em] font-extrabold mt-3">
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
                          ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                          : 'bg-gradient-to-r from-yellow-600 to-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, ((300 - Math.min(300, Math.max(60, diffSeconds))) / 240) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Solemn Advice */}
              <p className="text-stone-300 text-xl xl:text-2xl text-center max-w-sm font-normal leading-relaxed">
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
              variant={isFJU ? 'fju' : undefined}
              effectiveMode={effectiveMode}
              isLightModeActive={isLightModeActive}
            />
          </motion.div>
        ) : isLooping ? (
          <motion.div
            key="looping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col"
          >
            <header className={`h-[145px] shrink-0 px-24 flex items-center justify-between border-b border-white/[0.08] bg-[#050505]/70 backdrop-blur-md relative z-50`}>
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
