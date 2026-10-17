import {useProjectionWindow} from './hooks/useProjectionWindow';
import {availablePreparedMoment,preparedMomentSlides,isFjuMoment} from './utils/fju-moments';
import {FJU_PRE_SLIDES,FJU_POST_SLIDES,FJU_PROJECT_SLIDES,isFjuProject} from './utils/fju-content';
import {buildActiveQueue} from './utils/active-queue';
import {deriveCountdown} from './utils/countdown';
import {ProjectionStage} from './components/ProjectionStage';
import {HeaderScroll} from './utils/header-scroll';
import {AppUpdateNotice} from './components/AppUpdateNotice';
import {selectProjectionVerse} from './utils/verse-selection';
import {isYouthProjection,isYouthMeeting,isChurchMeeting,availableInYouthLoop,availableInChurchLoop} from './utils/projection-theme';
import { useSlideManager } from "./hooks/useSlideManager";
import { useWakeLock } from "./hooks/useWakeLock";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tv, Monitor, Smartphone, RefreshCw, Layout, BookOpen,
  CalendarDays, Settings, ExternalLink, Maximize, Minimize, Download, Sparkles,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, EyeOff, Eye
} from './components/ui/icons';
import { CHURCH_INFO, ALERTS, CAMPAIGNS, MEETINGS, VERSES } from './data';
import { getNextMeeting, getSlideDuration } from './utils';
import { mediaPreloader } from './utils/preloader';
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { SmartSplashLoader } from './components/SmartSplashLoader';
import { Meeting, type OperatorTab } from './types';
import { ProjectionContent } from './components/ProjectionContent';
import { SyncSection } from './components/SyncSection';
import { CustomModal, CustomToast } from './components/Modal';
import { PWAInstallModal } from './components/PWAInstallModal';

// Redesigned modular Operator Panel components
import { PlaylistPanel } from './components/operator/PlaylistPanel';
import { BiblePanel } from './components/operator/BiblePanel';
import { AgendaPanel } from './components/operator/AgendaPanel';
import { ControlsPanel } from './components/operator/ControlsPanel';
import { MonitorPanel } from './components/operator/MonitorPanel';

import { useProjectionState } from './hooks/useProjectionState';
import { useCustomMedia } from './hooks/useCustomMedia';
import { usePWAInstall } from './hooks/usePWAInstall';
import { usePWAIcons } from './hooks/usePWAIcons';

import { setupGlobalAudioUnlock } from './utils/permissions';
import { LOGO_URLS } from './constants/logos';

type SlideType = string;

const DEFAULT_SLIDES: SlideType[] = [
  'agenda_day_0',
  'seat',
  'verse_1',
  'baptism',
  'campaigns',
  'agenda_day_1',
  'bathroom',
  'agenda_day_2',
  'verse_2',
  'donations',
  'agenda_day_3',
  'phone',
  'agenda_day_4',
  'social',
  'verse_3',
  'agenda_day_5',
  'no_chat',
  'agenda_day_6_causas',
  'agenda_day_6_fju',
  'world_god'
];

const POST_MEETING_DEFAULT_SLIDES: SlideType[] = [
  'baptism',
  'blessing',
  'agenda_day_0',
  'donations',
  'social',
  'campaigns'
];

export default function App() {
  // Init PWA icons logic to sync head tags dynamically
  usePWAIcons();

  // Screen Wake Lock API - prevents browser sleep and keeps connection alive continuously
  useWakeLock(true);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [manualRotateMode] = useState<'auto' | 'force-landscape'>('auto');

  // Load custom state and persistence hook
  const {
    state,
    updateStateAndBroadcast: baseUpdateStateAndBroadcast,
    setProjectionWin,
    projectionWinRef
  } = useProjectionState();

  const {
    manualSlideOverride: storedManualSlideOverride,
    slidesOrder,
    disabledSlides,
    fjuProjectsEnabled,
    fjuMoments,
    customVerseText,
    customVerseRef,
    activeVerseIndex,
    activeAlert,
    blackoutEnabled,
    clearContentEnabled,
    pausedSeconds,
    countdownPaused,
    countdownOffset,
    countdownAnchor,
    dismissedJustStarted,

    videoPinBehavior,
    finalMinuteDisplayMode,
    verseDisplayPriority,
    carouselStartTimeOffset,
    customMeetings,
    volume,
    tickerText,
    customCampaigns,
    isProjectionOpen,
    mediaUpdateTrigger,
    background3DStyle,
    background3DFps,
    background3DIntensity,
    projectionMode,
    projectionTheme,
    syncStatus
  } = state;

  // Custom media management hook
  const {
    remoteMediaList,
    customMediaList,
    isMediaLoaded,
    mediaLoadError,
    isUploading,
    uploadError,
    handleFileUpload,
    handleMoveMedia,
    broadcastMediaSave,
    broadcastMediaDelete,
    deleteMediaItem,
    saveMediaItem
  } = useCustomMedia(mediaUpdateTrigger, baseUpdateStateAndBroadcast);

  // Electron Detection & Window Toggle States
  const [isProjectionWindowShowing, setIsProjectionWindowShowing] = useState(true);
  const ipcRendererRef = useRef<any>(null);

  const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).require) {
        ipcRendererRef.current = (window as any).require('electron').ipcRenderer;
      }
    } catch (e) {
      // Safe fallback when not in desktop/Electron environment
    }
  }, []);

  const [isLocalProjection, setIsLocalProjection] = useState(false);

  // Check if this window was opened as a projection view
  const [isProjectionView] = useState(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('projection') || window.location.pathname.endsWith('/projection');
  });

  // Modal Dialog global triggers
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    variant: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  });

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, variant: 'danger' | 'info' = 'info') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
      variant
    });
  }, []);

  // Toast dynamic notification feedback triggers
  const [toastConfig, setToastConfig] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastConfig({
      isVisible: true,
      message,
      type
    });
  }, []);

  const showAlert = showToast;

  const [isSmartBooting, setIsSmartBooting] = useState<boolean>(true);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  useEffect(() => {
    try { if (sessionStorage.getItem('holylink_reopen_install')) { sessionStorage.removeItem('holylink_reopen_install'); setShowPwaModal(true); } } catch { /* optional */ }
  }, []);
  const { isInstalled, hasUpdateAvailable, forceAppUpdate, isUpdating } = usePWAInstall();

  const [isScrolledDown, setIsScrolledDown] = useState<boolean>(false);
  const headerScrollRef=useRef(new HeaderScroll());
  const touchYRef=useRef<number|null>(null);
  const handleMainScroll=useCallback((event:React.UIEvent<HTMLElement>)=>{
    const el=event.currentTarget;
    if((document.activeElement?.matches(':focus-visible')&&document.activeElement.closest('.operator-chrome'))||document.querySelector('.holy-options[open]'))return;
    setIsScrolledDown(headerScrollRef.current.scroll(el.scrollTop,el.scrollHeight-el.clientHeight,performance.now()));
  },[]);

  // Time ticker (updates currentTime every second) & global audio unlock
  useEffect(() => {
    setupGlobalAudioUnlock();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const originalSchedule=getNextMeeting(currentTime,customMeetings);
  const isFJUProjection=isYouthProjection(originalSchedule.ongoingMeeting,originalSchedule.nextMeeting,originalSchedule.nextMeetingDate,currentTime,projectionTheme);
  const manualSlideOverride=storedManualSlideOverride&&!(isFjuMoment(storedManualSlideOverride)&&projectionMode==='post')&&availablePreparedMoment(storedManualSlideOverride,fjuMoments)&&(!isFjuProject(storedManualSlideOverride)||fjuProjectsEnabled)&&(isFJUProjection?availableInYouthLoop(storedManualSlideOverride,customMeetings):availableInChurchLoop(storedManualSlideOverride,customMeetings))?storedManualSlideOverride:null;
  const projectionMeetings=customMeetings.filter(isFJUProjection?isYouthMeeting:isChurchMeeting);
  const {ongoingMeeting}=getNextMeeting(currentTime,projectionMeetings);
  const countdown=deriveCountdown(currentTime,projectionMeetings,countdownOffset,countdownPaused,pausedSeconds,countdownAnchor,dismissedJustStarted);
  const {nextMeeting,nextMeetingDate,isJustStartedRaw}=countdown;
  let {isJustStarted,diffSeconds,isFinalMinute,isFinalFiveMinutes,isLooping}=countdown;
  const formatMinutesPart=Math.floor(diffSeconds/60).toString().padStart(2,'0');
  const formatSecondsPart=(diffSeconds%60).toString().padStart(2,'0');

  // No modo Pós-Reunião, desativamos contagem regressiva de início e priorizamos carrossel de saída
  if (projectionMode === 'post') {
    isFinalMinute = false;
    isFinalFiveMinutes = false;
    isJustStarted = false;
    isLooping = true;
  }

  if (manualSlideOverride) {
    if (finalMinuteDisplayMode === 'full_video') {
      if (isFinalMinute || isJustStarted) {
        isFinalMinute = false;
        isJustStarted = false;
        isLooping = true;
      }
    } else {
      // Em modo 'split' (dividido), se a mídia está fixada manualmente, mantemos isFinalMinute ativado
      // para exibir o cronômetro de 60s ao lado do vídeo fixado!
      if (isJustStarted) {
        isJustStarted = false;
        isLooping = true;
      }
    }
  }

  useEffect(() => {
    if (!isJustStartedRaw && diffSeconds > 300 && dismissedJustStarted) {
      baseUpdateStateAndBroadcast('dismissedJustStarted', false);
    }
  }, [isJustStartedRaw, diffSeconds, dismissedJustStarted, baseUpdateStateAndBroadcast]);

  // Slides Queue Calculation
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const activeCampaignsFiltered = (customCampaigns || []).filter((c) => {
    if (!c.endDate) return true;
    return c.endDate >= todayStr;
  });
  const hasActiveCampaigns = activeCampaignsFiltered.length > 0;

  const defaultBaseSlides = (isFJUProjection?(projectionMode==='post'?FJU_POST_SLIDES:FJU_PRE_SLIDES):(projectionMode === 'post' ? POST_MEETING_DEFAULT_SLIDES : DEFAULT_SLIDES)).filter(id => {
    if(!(isFJUProjection?availableInYouthLoop(id,customMeetings):availableInChurchLoop(id,customMeetings)))return false;
    if(id==='fju_agenda'&&!nextMeetingDate)return false;
    if(id==='soon'&&!nextMeetingDate)return false;
    if (id === 'campaigns' && !hasActiveCampaigns) return false;
    return true;
  });
  const allAvailableSlides: string[] = [...defaultBaseSlides,...(isFJUProjection?preparedMomentSlides(fjuMoments,projectionMode):[]),...(isFJUProjection&&fjuProjectsEnabled?FJU_PROJECT_SLIDES:[])];
  customMediaList.forEach((media) => {
    if (!allAvailableSlides.includes(media.id)) {
      allAvailableSlides.push(media.id);
    }
  });
  projectionMeetings.forEach((meet) => {
    if (meet.date && meet.date >= todayStr && (!isFJUProjection||isYouthMeeting(meet))) {
      const meetSlideId = `meeting_event_${meet.id}`;
      if (!allAvailableSlides.includes(meetSlideId)) {
        allAvailableSlides.push(meetSlideId);
      }
    }
  });
  if (nextMeetingDate && projectionMode !== 'post' && diffSeconds <= 15 * 60 && !allAvailableSlides.includes('soon')) {
    allAvailableSlides.push('soon');
  }

  const activeSlides = buildActiveQueue({
    available: allAvailableSlides,
    order: slidesOrder,
    disabled: disabledSlides || [],
    media: customMediaList,
    youth: isFJUProjection,
  });
  const totalDuration = activeSlides.reduce((sum, id) => sum + getSlideDuration(id, customMediaList), 0);
  const adjustedTime = currentTime.getTime() - carouselStartTimeOffset;
  const timeInLoop = ((adjustedTime % (totalDuration || 1)) + (totalDuration || 1)) % (totalDuration || 1);
  const loopIteration = Math.floor(adjustedTime / (totalDuration || 1));
  let accumulatedTime = 0;
  let currentSlideId = activeSlides[0] || (isFJUProjection?'seat':'agenda_day_0');

  if (manualSlideOverride) {
    currentSlideId = manualSlideOverride;
  } else {
    for (const id of activeSlides) {
      const duration = getSlideDuration(id, customMediaList);
      if (timeInLoop >= accumulatedTime && timeInLoop < accumulatedTime + duration) {
        currentSlideId = id;
        break;
      }
      accumulatedTime += duration;
    }
  }

  // Wrapper for updateStateAndBroadcast to safely handle special keys like 'advanceToSlide'
  const updateStateAndBroadcast = useCallback((key: string, value: any) => {
    if (key === 'advanceToSlide') {
      const targetSlideId = value;
      if (activeSlides.length > 0) {
        const targetIndex = activeSlides.indexOf(targetSlideId);
        if (targetIndex !== -1) {
          let targetAccumulatedTime = 0;
          for (let i = 0; i < targetIndex; i++) {
            targetAccumulatedTime += getSlideDuration(activeSlides[i], customMediaList);
          }
          const now = Date.now();
          const newOffset = now - targetAccumulatedTime;
          baseUpdateStateAndBroadcast('carouselStartTimeOffset', newOffset);
        }
      }
      baseUpdateStateAndBroadcast('manualSlideOverride', null);
      return;
    }

    baseUpdateStateAndBroadcast(key, value);
  }, [activeSlides, customMediaList, baseUpdateStateAndBroadcast]);

  useEffect(()=>{if(!localStorage.getItem('holylink_fju_moments_queue_v1')){localStorage.setItem('holylink_fju_moments_queue_v1','true');if(isFjuMoment(localStorage.getItem('projection_manualSlideOverride')||''))baseUpdateStateAndBroadcast('manualSlideOverride',null);}},[baseUpdateStateAndBroadcast]);

  const outputControl=useProjectionWindow({view:isProjectionView,windowRef:projectionWinRef,setWindow:setProjectionWin,update:baseUpdateStateAndBroadcast});

  // Preload static assets on boot
  useEffect(() => {
    mediaPreloader.preloadStaticAssets();
  }, []);

  // Preload upcoming slides into memory based on current playing slide
  useEffect(() => {
    if (customMediaList.length > 0 && activeSlides.length > 0) {
      mediaPreloader.preloadSlideSequence(currentSlideId, activeSlides, customMediaList);
    }
  }, [currentSlideId, activeSlides, customMediaList]);

  const {
    handleToggleDisableSlide,
    handleResetCampaigns
  } = useSlideManager(
    updateStateAndBroadcast,
    disabledSlides || [],
    CAMPAIGNS
  );

  // Window viewport calculations
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive Operator's Panel Navigation State
  const [activeMobileTab, setActiveMobileTab] = useState<OperatorTab>('slides');

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          console.error("Erro ao ativar tela cheia:", err);
        });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch((err) => {
            console.error("Erro ao sair de tela cheia:", err);
          });
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  useKeyboardShortcuts({
    updateStateAndBroadcast,
    blackoutEnabled,
    clearContentEnabled,
    activeSlides,
    currentSlideId,
    isLocalProjection,
    setIsLocalProjection,
    manualSlideOverride,
    customVerseText,
    activeAlert,
    volume,
    toggleFullscreen,
    setActiveMobileTab,
    projectionMode
  });

  useEffect(() => {
    if (isProjectionView) {
      updateStateAndBroadcast('isProjectionOpen', true);

      const handleBeforeUnload = () => {
        try{localStorage.setItem('holylink_projection_bounds',JSON.stringify({left:window.screenX,top:window.screenY,width:window.outerWidth,height:window.outerHeight}));}catch{}
        updateStateAndBroadcast('isProjectionOpen', false);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isProjectionView]);

  const { width, height } = dimensions;
  const shouldRotate = manualRotateMode === 'auto' && height > width;

  let scale = 1;
  if (shouldRotate) {
    scale = Math.min(height / 1920, width / 1080);
  } else {
    scale = Math.min(width / 1920, height / 1080);
  }

  const countHours = Math.floor(diffSeconds / 3600);
  const countMinutes = Math.floor((diffSeconds % 3600) / 60);
  const hoursStr = nextMeetingDate?countHours.toString().padStart(2, '0'):'--';
  const minutesStr = nextMeetingDate?countMinutes.toString().padStart(2, '0'):'--';

  // Re-sync time immediately when returning to tab from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCurrentTime(new Date());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Cleanup manualSlideOverride if the referenced custom media or meeting is deleted
  useEffect(() => {
    // Only operator window (not projection view) and only when media is loaded should clean up deleted items
    if (isProjectionView || !isMediaLoaded) return;

    if (manualSlideOverride) {
      if (manualSlideOverride.startsWith('custom_')) {
        const exists = customMediaList.some((m) => m.id === manualSlideOverride);
        if (!exists) {
          updateStateAndBroadcast('manualSlideOverride', null);
        }
      } else if (manualSlideOverride.startsWith('meeting_event_')) {
        const meetId = manualSlideOverride.replace('meeting_event_', '');
        const exists = customMeetings.some((m) => m.id === meetId && (!m.date || m.date >= todayStr));
        if (!exists) {
          updateStateAndBroadcast('manualSlideOverride', null);
        }
      }
    }
  }, [manualSlideOverride, customMediaList, customMeetings, isMediaLoaded, isProjectionView, updateStateAndBroadcast,todayStr]);

  const currentOutputRef=useRef(currentSlideId);currentOutputRef.current=currentSlideId;
  const handleVideoEnded = useCallback(() => {
    if(currentOutputRef.current!==currentSlideId)return;
    if (videoPinBehavior === 'unpin') {
      const activeSlideId = currentSlideId;
      if (activeSlides.length > 0) {
        const currentIndex = activeSlides.indexOf(activeSlideId);
        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % activeSlides.length;
          let targetAccumulatedTime = 0;
          for (let i = 0; i < nextIndex; i++) {
            targetAccumulatedTime += getSlideDuration(activeSlides[i], customMediaList);
          }
          const now = Date.now();
          const newOffset = now - targetAccumulatedTime;
          updateStateAndBroadcast('carouselStartTimeOffset', newOffset);
        }
      }
      updateStateAndBroadcast('manualSlideOverride', null);
    }
  }, [videoPinBehavior, currentSlideId, activeSlides, customMediaList, updateStateAndBroadcast]);

  const navigateOutput = (direction: number) => {
    if (!activeSlides.length) return;
    const index = activeSlides.indexOf(currentSlideId);
    const next = ((index < 0 ? 0 : index) + direction + activeSlides.length) % activeSlides.length;
    updateStateAndBroadcast('customVerseText', null);
    updateStateAndBroadcast('customVerseRef', null);
    updateStateAndBroadcast('activeVerseIndex', null);
    updateStateAndBroadcast('manualSlideOverride', activeSlides[next]);
  };
  if (isSmartBooting && !isProjectionView) {
    return (
      <SmartSplashLoader
        mediaReady={isMediaLoaded}
        mediaLoadError={mediaLoadError}
        currentSlideId={currentSlideId}
        activeSlides={activeSlides}
        customMediaList={customMediaList}
        onComplete={() => setIsSmartBooting(false)}
      />
    );
  }

  if (!isProjectionView && !isLocalProjection) {
    return (
      <div className="holy-theme operator-shell w-full h-full text-hl-copy flex flex-col font-sans select-none overflow-hidden">

        {/* GLOBAL SYNC OVERLAY */}
        <AnimatePresence>
          {syncStatus?.active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="holy-theme holy-sync-progress fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-hl-gold/20 rounded-full" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-hl-gold animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">Sincronizando Dados</h2>
              <p className="text-hl-muted font-medium tracking-wide max-w-md mx-auto leading-relaxed">
                {syncStatus.message}
              </p>

              {syncStatus.progress !== undefined && (
                <div className="w-full max-w-xs bg-hl-panel h-1.5 rounded-full mt-6 overflow-hidden border border-hl-line">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${syncStatus.progress}%` }}
                    className="h-full bg-hl-gold shadow-[0_0_10px_rgba(255,211,79,0.5)]"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {hasUpdateAvailable && <AppUpdateNotice updating={isUpdating} onUpdate={forceAppUpdate}/>}

        <div className={`operator-chrome ${isScrolledDown?'is-collapsed':''}`} data-collapsed={isScrolledDown} aria-hidden={isScrolledDown} inert={isScrolledDown}><div className="operator-chrome-body">
        <header className="holy-topbar">
          <div className="holy-brand"><img src={LOGO_URLS.symbol} alt="Símbolo HolyLink" width={44} height={44} /><div><h1>HolyLink</h1><span>Projeção · 16:9</span></div></div>
          <div className="holy-header-actions">
            <button type="button" className="holy-output-button" onClick={()=>outputControl.request(isProjectionOpen?'close':'open')}><ExternalLink size={18} aria-hidden="true"/><span>{isProjectionOpen?'Fechar telão':'Abrir telão'}</span></button>
            <details className="holy-options"><summary aria-label="Mais opções">Opções<ChevronDown size={16} aria-hidden="true" /></summary><div>
              <button type="button" onClick={event => {setIsLocalProjection(true); event.currentTarget.closest('details')?.removeAttribute('open');}}><Maximize size={18} />Projetar neste aparelho</button>
              <button type="button" onClick={event => {setActiveMobileTab('sync'); event.currentTarget.closest('details')?.removeAttribute('open');}}><Smartphone size={18} />Conectar celular</button>
              <button type="button" onClick={event => {setShowPwaModal(true); event.currentTarget.closest('details')?.removeAttribute('open');}}><Download size={18} />Instalar HolyLink</button>
              {isElectron && <button type="button" onClick={() => {ipcRendererRef.current?.send(isProjectionWindowShowing ? 'hide-projection' : 'show-projection'); setIsProjectionWindowShowing(!isProjectionWindowShowing);}}><Tv size={18} />Alternar janela do projetor</button>}
            </div></details>
          </div>
        </header>
        {/* ACTIVE BROADCAST HEADER BANNER - SKEUOMORPHIC LED DISPLAY */}
        {isJustStartedRaw && (
          <div data-operator-banner data-collapsed={isScrolledDown} className={`px-4 py-2.5 border-b flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 z-10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] ${
            dismissedJustStarted
              ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400"
              : "bg-hl-gold-well/40 border-hl-line-strong/50 text-hl-gold-bright"
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold font-sans">
              {dismissedJustStarted ? (
                <>
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.9)]"></span>
                  </span>
                  <span><strong>Carrossel Ativo:</strong> Anúncios e mídias rodando automaticamente no telão.</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-hl-gold-bright animate-pulse shrink-0" />
                  <span><strong>Modo Reunião Ativo:</strong> Exibindo Bíblia (Carrossel Pausado).</span>
                </>
              )}
            </div>

            <button
              onClick={() => updateStateAndBroadcast('dismissedJustStarted', !dismissedJustStarted)}
              className={`text-xs font-black px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] shrink-0 w-full md:w-auto text-center active:translate-y-[1px] ${
                dismissedJustStarted
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                  : "bg-hl-gold hover:bg-hl-gold-bright text-black shadow-[0_0_12px_rgba(255,211,79,0.3)]"
              }`}
            >
              {dismissedJustStarted ? "Exibir Bíblia" : "Liberar Carrossel"}
            </button>
          </div>
        )}

        </div></div>
        <nav className="holy-navigation" role="tablist" aria-label="Áreas do operador">
          {([
            {id:'slides',label:'Sequência',icon:Layout}, {id:'texts',label:'Bíblia',icon:BookOpen},
            {id:'agenda',label:'Agenda',icon:CalendarDays}, {id:'controls',label:'Ajustes',icon:Settings},
            {id:'sync',label:'Conexão',icon:Smartphone}, {id:'monitor',label:'Monitor',icon:Monitor}
          ] as const).map(tab => {const Icon = tab.icon; return <button type="button" role="tab" key={tab.id} aria-selected={activeMobileTab===tab.id} aria-label={'Aba '+tab.label} onClick={() => setActiveMobileTab(tab.id)}><Icon size={19} aria-hidden="true" /><span>{tab.label}</span></button>;})}
        </nav>
        {/* MAIN PANEL CONTENT GRID */}
        <div className="operator-workspace flex-1 flex flex-col overflow-hidden min-h-0">


          {/* ACTIVE CONTENT WORKSPACE */}
          <nav className="operator-quick-strip" aria-label="Controles essenciais da projeção">
            {isScrolledDown&&<button type="button" className="operator-reveal-top" aria-label="Mostrar topo" title="Mostrar topo" onClick={()=>{headerScrollRef.current.reveal(performance.now());setIsScrolledDown(false);requestAnimationFrame(()=>document.querySelector<HTMLElement>('.holy-options summary')?.focus({preventScroll:true}));}}><ChevronUp size={20}/></button>}
            <button type="button" aria-pressed={blackoutEnabled} onClick={() => updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled)}><EyeOff size={18} aria-hidden="true" />Blackout</button>
            <button type="button" aria-pressed={clearContentEnabled} onClick={() => updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled)}><Eye size={18} aria-hidden="true" />Limpar tela</button>
            <button type="button" disabled={!activeSlides.length} onClick={() => navigateOutput(-1)}><ChevronLeft size={18} aria-hidden="true" />Slide anterior</button>
            <button type="button" disabled={!activeSlides.length} onClick={() => navigateOutput(1)}><ChevronRight size={18} aria-hidden="true" />Próximo slide</button>
          </nav>          <main onWheelCapture={event=>headerScrollRef.current.userIntent(event.deltaY,performance.now())} onTouchStartCapture={event=>{touchYRef.current=event.touches[0]?.clientY??null;}} onTouchMoveCapture={event=>{const y=event.touches[0]?.clientY;if(y!==undefined&&touchYRef.current!==null)headerScrollRef.current.userIntent(touchYRef.current-y,performance.now());touchYRef.current=y??null;}} onKeyDownCapture={event=>{if((event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]'))return;const direction=['ArrowDown','PageDown','End'].includes(event.key)?1:['ArrowUp','PageUp','Home'].includes(event.key)?-1:0;headerScrollRef.current.userIntent(direction,performance.now());}} onScroll={handleMainScroll} className="operator-main flex-1 overflow-y-auto flex flex-col gap-5 min-h-0">

            {outputControl.message&&<div className="operator-notice" role="status">{outputControl.message}</div>}
            {mediaLoadError&&<div className="operator-notice" role="alert"><p>{mediaLoadError} Os arquivos já carregados foram mantidos.</p><button type="button" className="sequence-secondary" onClick={()=>baseUpdateStateAndBroadcast('mediaUpdateTrigger',Date.now().toString())}><RefreshCw size={17}/>Tentar ler biblioteca</button></div>}
            {/* Render selected panels */}
            {activeMobileTab === 'slides' && (
              <PlaylistPanel
                youth={isFJUProjection}
                blackoutEnabled={blackoutEnabled}
                clearContentEnabled={clearContentEnabled}
                currentVerse={currentSlideId.startsWith('verse_') ? selectProjectionVerse(VERSES,{text:customVerseText,ref:customVerseRef,index:activeVerseIndex,loop:loopIteration,offset:Number(currentSlideId.replace('verse_',''))||0,timeMs:currentTime.getTime()}).verse : null}
                liveVerse={Boolean(customVerseText && (verseDisplayPriority === 'verse_over_video' || !(isFinalMinute || isFinalFiveMinutes))) ? {text:customVerseText!,ref:customVerseRef || 'Passagem bíblica'} : null}
                countdownMode={isFinalMinute ? 'Contagem final · último minuto' : isFinalFiveMinutes ? 'Contagem final · últimos cinco minutos' : isJustStarted ? 'Horário previsto atingido' : null}
                onOpenMonitor={() => setActiveMobileTab('monitor')}
                fjuProjectsEnabled={fjuProjectsEnabled}
                fjuMoments={fjuMoments}
                projectionMode={projectionMode}
                slidesOrder={slidesOrder}
                currentSlideId={currentSlideId}
                manualSlideOverride={manualSlideOverride}
                activeSlides={activeSlides}
                allAvailableSlides={allAvailableSlides}
                disabledSlides={disabledSlides}
                customMediaList={customMediaList}
                remoteMediaList={remoteMediaList}
                getSlideDuration={getSlideDuration}
                updateStateAndBroadcast={updateStateAndBroadcast}
                handleToggleDisableSlide={handleToggleDisableSlide}
                handleFileUpload={handleFileUpload}
                isUploading={isUploading}
                uploadError={uploadError}
                videoPinBehavior={videoPinBehavior}
                finalMinuteDisplayMode={finalMinuteDisplayMode}
                verseDisplayPriority={verseDisplayPriority}
                handleMoveMedia={handleMoveMedia}
                showConfirm={showConfirm}
                showToast={showToast}
                showAlert={showAlert}
                deleteMediaItem={deleteMediaItem}
                broadcastMediaDelete={broadcastMediaDelete}
                broadcastMediaSave={broadcastMediaSave}
                saveMediaItem={saveMediaItem}
                customMeetings={projectionMeetings}
              />
            )}

            {activeMobileTab === 'texts' && (
              <BiblePanel
                isFJU={isFJUProjection}
                backgroundStyle={background3DStyle}
                activeVerseIndex={activeVerseIndex}
                customVerseText={customVerseText}
                customVerseRef={customVerseRef}
                updateStateAndBroadcast={updateStateAndBroadcast}
                showToast={showToast}
                showAlert={showAlert}
              />
            )}

            {activeMobileTab === 'agenda' && (
              <AgendaPanel
                youth={isFJUProjection}
                customMeetings={customMeetings}
                customCampaigns={customCampaigns}
                updateStateAndBroadcast={updateStateAndBroadcast}
                showConfirm={showConfirm}
                showToast={showToast}
                showAlert={showAlert}
                onResetCampaigns={handleResetCampaigns}
              />
            )}

            {activeMobileTab === 'controls' && (
              <ControlsPanel
                onToggleOutput={()=>outputControl.request(isProjectionOpen?'close':'open')}
                blackoutEnabled={blackoutEnabled}
                clearContentEnabled={clearContentEnabled}
                nextMeeting={nextMeeting}
                nextMeetingDate={nextMeetingDate}
                hoursStr={hoursStr}
                minutesStr={minutesStr}
                diffSeconds={diffSeconds}
                countdownOffset={countdownOffset}
                countdownPaused={countdownPaused}
                pausedSeconds={pausedSeconds}
                activeAlert={activeAlert}
                volume={volume}
                tickerText={tickerText}
                background3DStyle={background3DStyle}
                background3DFps={background3DFps}
                background3DIntensity={background3DIntensity}
                projectionMode={projectionMode}
                projectionTheme={projectionTheme}
                youth={isFJUProjection}
                manualSlideOverride={manualSlideOverride}
                updateStateAndBroadcast={updateStateAndBroadcast}
                currentTime={currentTime}
                isProjectionOpen={isProjectionOpen}
                showToast={showToast}
                showAlert={showAlert}
              />
            )}

            {/* Persistent WebRTC & Peer Sync Section (Kept mounted in background so connection stays active) */}
            <div className={activeMobileTab === 'sync' ? 'w-full' : 'hidden'}>
              <SyncSection showToast={showToast} showAlert={showAlert} showConfirm={showConfirm} />
            </div>

            {activeMobileTab === 'monitor' && (
              <MonitorPanel
                youth={isFJUProjection}
                onNavigate={setActiveMobileTab}
                onFullscreen={toggleFullscreen}
                projectionMode={projectionMode}
                projectionTheme={projectionTheme}
                projectionWin={null}
                setProjectionWin={setProjectionWin}
                currentTime={currentTime}
                isLooping={isLooping}
                isFinalFiveMinutes={isFinalFiveMinutes}
                isFinalMinute={isFinalMinute}
                isJustStarted={isJustStarted}
                activeAlert={activeAlert}
                blackoutEnabled={blackoutEnabled}
                clearContentEnabled={clearContentEnabled}
                currentSlideId={currentSlideId}
                manualSlideOverride={manualSlideOverride}
                hoursStr={hoursStr}
                minutesStr={minutesStr}
                diffSeconds={diffSeconds}
                formatMinutesPart={formatMinutesPart}
                formatSecondsPart={formatSecondsPart}
                customVerseText={customVerseText}
                customVerseRef={customVerseRef}
                activeVerseIndex={activeVerseIndex}
                customMediaList={customMediaList}

                videoPinBehavior={videoPinBehavior}
                finalMinuteDisplayMode={finalMinuteDisplayMode}
                verseDisplayPriority={verseDisplayPriority}
                loopIteration={loopIteration}
                updateStateAndBroadcast={updateStateAndBroadcast}
                customMeetings={projectionMeetings}
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
                isProjectionOpen={isProjectionOpen}
                activeSlides={activeSlides}
              />
            )}
          </main>


        </div>

        <CustomModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          variant={modalConfig.variant}
        />
        <CustomToast
          isVisible={toastConfig.isVisible}
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(prev => ({ ...prev, isVisible: false }))}
        />
        <PWAInstallModal
          isOpen={showPwaModal}
          onClose={() => setShowPwaModal(false)}
        />
      </div>
    );
  }

  // Preparation belongs to this output window, not to the audience composition.
  return (
    <ProjectionStage local={isLocalProjection} ready={isMediaLoaded} loadError={mediaLoadError} currentId={currentSlideId} onExit={()=>setIsLocalProjection(false)} onNext={()=>navigateOutput(1)} onRetry={()=>window.dispatchEvent(new CustomEvent('projection_sync_update',{detail:{key:'mediaUpdateTrigger',value:'retry:'+currentSlideId+':'+Date.now()}}))}>
      {/* 16:9 PROJECTION FRAME */}
      <div
        id="painel-16-9"
        style={{
          width: '1920px',
          height: '1080px',
          transform: `translate(-50%, -50%) rotate(${shouldRotate ? '90deg' : '0deg'}) scale(${scale})`,
          position: 'absolute',
          left: '50%',
          top: '50%',
        }}
        className="bg-hl-canvas text-white shadow-[0_0_250px_rgba(0,0,0,0.99)] overflow-hidden flex flex-col z-10"
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
          customMeetings={projectionMeetings}
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
          onVideoEnded={handleVideoEnded}
        />
      </div>

    </ProjectionStage>
  );
}
