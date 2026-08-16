import { useSlideManager } from "./hooks/useSlideManager";
import { useWakeLock } from "./hooks/useWakeLock";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Monitor, Smartphone, RefreshCw, Layout, BookOpen, 
  CalendarDays, Settings, ExternalLink, Maximize, Minimize, Download, Sparkles
} from 'lucide-react';
import { CHURCH_INFO, ALERTS, CAMPAIGNS, MEETINGS } from './data';
import { getNextMeeting, getSlideDuration } from './utils';
import { mediaPreloader } from './utils/preloader';
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { SmartSplashLoader } from './components/SmartSplashLoader';
import { Meeting } from './types';
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
    setProjectionWin
  } = useProjectionState();

  const {
    manualSlideOverride,
    slidesOrder,
    disabledSlides,
    customVerseText,
    customVerseRef,
    activeVerseIndex,
    activeAlert,
    blackoutEnabled,
    clearContentEnabled,
    pausedSeconds,
    countdownPaused,
    countdownOffset,
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
    syncStatus
  } = state;

  // Custom media management hook
  const {
    customMediaList,
    isMediaLoaded,
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
  const { isInstalled, hasUpdateAvailable, forceAppUpdate, isUpdating } = usePWAInstall();

  // Time ticker (updates currentTime every second) & global audio unlock
  useEffect(() => {
    setupGlobalAudioUnlock();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Meeting & Countdown calculation logic
  const { nextMeeting, nextMeetingDate, ongoingMeeting } = getNextMeeting(currentTime, customMeetings);

  let isJustStartedRaw = false;
  if (ongoingMeeting) {
    const mStart = new Date(currentTime);
    mStart.setHours(ongoingMeeting.hours, ongoingMeeting.minutes, 0, 0);
    const elapsedSinceStart = currentTime.getTime() - mStart.getTime();
    if (elapsedSinceStart >= 0 && elapsedSinceStart <= 30 * 60 * 1000) {
      isJustStartedRaw = true;
    }
  }

  const adjustedNextMeetingDate = new Date(nextMeetingDate.getTime() + countdownOffset);
  const diffMs = adjustedNextMeetingDate.getTime() - currentTime.getTime();

  if (!isJustStartedRaw && diffMs <= 0) {
    isJustStartedRaw = true;
  }

  let isJustStarted = isJustStartedRaw && !dismissedJustStarted;
  let diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  
  if (countdownPaused && pausedSeconds !== null) {
    diffSeconds = pausedSeconds;
  }

  const formatMinutesPart = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
  const formatSecondsPart = (diffSeconds % 60).toString().padStart(2, '0');

  let isFinalMinute = !isJustStarted && diffSeconds <= 60 && diffSeconds > 0;
  let isFinalFiveMinutes = !isJustStarted && diffSeconds <= 300 && diffSeconds > 60;
  let isLooping = !isJustStarted && !isFinalFiveMinutes && !isFinalMinute;

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

  const defaultBaseSlides = projectionMode === 'post' ? POST_MEETING_DEFAULT_SLIDES : DEFAULT_SLIDES;
  const allAvailableSlides: string[] = [...defaultBaseSlides];
  customMediaList.forEach((media) => {
    if (!allAvailableSlides.includes(media.id)) {
      allAvailableSlides.push(media.id);
    }
  });
  customMeetings.forEach((meet) => {
    if (meet.date && meet.date >= todayStr) {
      const meetSlideId = `meeting_event_${meet.id}`;
      if (!allAvailableSlides.includes(meetSlideId)) {
        allAvailableSlides.push(meetSlideId);
      }
    }
  });
  if (projectionMode !== 'post' && diffSeconds <= 15 * 60 && !allAvailableSlides.includes('soon')) {
    allAvailableSlides.push('soon');
  }

  const baseActiveSlides: SlideType[] = allAvailableSlides.filter((id) => {
    if (disabledSlides && disabledSlides.includes(id)) return false;
    if (id.startsWith('custom_')) {
      const media = customMediaList.find((m) => m.id === id);
      return media ? media.enabledInLoop : false;
    }
    return true;
  }) as SlideType[];

  let activeSlides = slidesOrder.filter((id) => baseActiveSlides.includes(id));
  baseActiveSlides.forEach((id) => {
    if (!activeSlides.includes(id)) {
      activeSlides.push(id);
    }
  });

  const totalDuration = activeSlides.reduce((sum, id) => sum + getSlideDuration(id, customMediaList), 0);
  const adjustedTime = currentTime.getTime() - carouselStartTimeOffset;
  const timeInLoop = ((adjustedTime % (totalDuration || 1)) + (totalDuration || 1)) % (totalDuration || 1);
  const loopIteration = Math.floor(adjustedTime / (totalDuration || 1));
  let accumulatedTime = 0;
  let currentSlideId = activeSlides[0] || 'agenda_day_0';

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
    handleResetCampaigns,
    handleMoveSlide,
    handleReorderGrouped,
    handleReorderInterleaved,
    handleResetSlidesOrder
  } = useSlideManager(
    updateStateAndBroadcast,
    disabledSlides || [],
    slidesOrder || DEFAULT_SLIDES,
    DEFAULT_SLIDES,
    allAvailableSlides,
    customMediaList,
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
  const [activeMobileTab, setActiveMobileTab] = useState<'slides' | 'texts' | 'agenda' | 'controls' | 'sync' | 'monitor'>('slides');

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
  const hoursStr = countHours.toString().padStart(2, '0');
  const minutesStr = countMinutes.toString().padStart(2, '0');

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
        const exists = customMeetings.some((m) => m.id === meetId);
        if (!exists) {
          updateStateAndBroadcast('manualSlideOverride', null);
        }
      }
    }
  }, [manualSlideOverride, customMediaList, customMeetings, isMediaLoaded, isProjectionView, updateStateAndBroadcast]);

  const handleVideoEnded = useCallback(() => {
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

  const [isCurrentlyFullscreen, setIsCurrentlyFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsCurrentlyFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (isSmartBooting) {
    return (
      <SmartSplashLoader 
        customMediaList={customMediaList} 
        onComplete={() => setIsSmartBooting(false)} 
      />
    );
  }

  if (!isProjectionView && !isLocalProjection) {
    return (
      <div className="w-full h-full bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
        
        {/* GLOBAL SYNC OVERLAY */}
        <AnimatePresence>
          {syncStatus?.active && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">Sincronizando Dados</h2>
              <p className="text-zinc-400 font-medium tracking-wide max-w-md mx-auto leading-relaxed">
                {syncStatus.message}
              </p>
              
              {syncStatus.progress !== undefined && (
                <div className="w-full max-w-xs bg-zinc-900 h-1.5 rounded-full mt-6 overflow-hidden border border-zinc-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${syncStatus.progress}%` }}
                    className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA UPDATE NOTIFICATION BANNER */}
        {hasUpdateAvailable && (
          <div className="bg-amber-500 text-zinc-950 px-4 py-2 flex items-center justify-between text-xs font-bold shrink-0 z-50 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-950 animate-bounce" />
              <span>Nova versão do HolyLink disponível! Atualize para ter acesso aos recursos mais recentes.</span>
            </div>
            <button
              onClick={forceAppUpdate}
              disabled={isUpdating}
              className="bg-zinc-950 hover:bg-zinc-900 text-amber-400 px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer shadow flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Atualizando...' : 'Atualizar PWA Agora'}</span>
            </button>
          </div>
        )}

        {/* TOP BAR / NAVIGATION - SKEUOMORPHIC RACK-MOUNT FRAME */}
        <header className="h-auto lg:h-16 px-4 lg:px-6 py-3 lg:py-0 bg-[#08080a] border-b border-[#27272a] flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 z-20 shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.05)] relative">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] shrink-0 bg-[#111113] flex items-center justify-center p-1 group">
                <img 
                  src="/icon-192.png" 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  alt="HolyLink Símbolo" 
                  className="w-full h-full object-contain rounded-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                <div className="flex items-center h-6">
                  <img 
                    src="/logo-text.png" 
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = document.getElementById('holylink-text-fallback');
                      if (fallback) fallback.style.display = 'inline-block';
                    }}
                    alt="HolyLink" 
                    className="h-6 w-auto max-w-[130px] object-contain shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" 
                  />
                  <span 
                    id="holylink-text-fallback" 
                    className="hidden font-sans font-black text-lg tracking-wider text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  >
                    HOLYLINK
                  </span>
                </div>
                <span className="text-zinc-300 text-xs font-black sm:border-l sm:border-[#333] sm:pl-2.5 font-sans uppercase tracking-wider">
                  Painel do Operador
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#0d0d0f] border border-[#2a2a2e] px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-zinc-300 uppercase tracking-wider shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
                {localStorage.getItem('projection_deviceRole') === 'phone' ? (
                  <span className="flex items-center gap-1 text-amber-400 font-black">
                    <Smartphone className="w-3.5 h-3.5" />
                    Controle Móvel
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Monitor className="w-3.5 h-3.5 text-amber-500" />
                    Console Principal
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            {isElectron && (
              <button
                type="button"
                aria-label={isProjectionWindowShowing ? 'Apagar Projetor' : 'Ligar Projetor'}
                onClick={() => {
                  if (isProjectionWindowShowing) {
                    ipcRendererRef.current?.send('hide-projection');
                    setIsProjectionWindowShowing(false);
                  } else {
                    ipcRendererRef.current?.send('show-projection');
                    setIsProjectionWindowShowing(true);
                  }
                }}
                className={`flex-1 sm:flex-none min-h-[38px] border text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${
                  isProjectionWindowShowing
                    ? 'bg-red-950/80 border-red-800/80 hover:bg-red-900/80 text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.2)]'
                    : 'bg-emerald-950/80 border-emerald-800/80 hover:bg-emerald-900/80 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                }`}
              >
                <Tv className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{isProjectionWindowShowing ? 'Apagar Projetor' : 'Ligar Projetor'}</span>
              </button>
            )}

            <button
              type="button"
              aria-label="Projetar neste navegador"
              onClick={() => {
                setIsLocalProjection(true);
                toggleFullscreen();
              }}
              className="flex-1 sm:flex-none min-h-[38px] bg-gradient-to-b from-[#1c1c1f] to-[#121214] border border-[#333] hover:border-[#444] text-zinc-200 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]"
            >
              <Monitor className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">Projetar Aqui</span>
            </button>

            <button
              type="button"
              aria-label="Sincronizar ou conectar celular"
              onClick={() => setActiveMobileTab('sync')}
              className={`flex-1 sm:flex-none min-h-[38px] border text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${
                activeMobileTab === 'sync'
                  ? 'bg-amber-500 border-amber-400 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] hover:border-[#444] text-zinc-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Conectar Celular</span>
            </button>

            {!isInstalled && (
              <button
                type="button"
                aria-label="Instalar App HolyLink"
                onClick={() => setShowPwaModal(true)}
                className="flex-1 sm:flex-none min-h-[38px] bg-gradient-to-b from-[#1c1c1f] to-[#121214] border border-amber-900/50 hover:border-amber-500/50 text-amber-400 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              >
                <Download className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">Instalar App</span>
              </button>
            )}

            {!isProjectionOpen ? (
              <button
                type="button"
                aria-label="Abrir janela do monitor em segunda tela"
                onClick={() => {
                  try {
                    const url = window.location.origin + window.location.pathname + '?projection';
                    const newWin = window.open(url, 'projection_window', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
                    if (newWin) {
                      setProjectionWin(newWin);
                      updateStateAndBroadcast('isProjectionOpen', true);
                      updateStateAndBroadcast('projectionCloseTrigger', null);
                    } else {
                      showAlert('A janela de projeção foi bloqueada pelo navegador. Permita pop-ups nas configurações e tente novamente.', 'error');
                    }
                  } catch (err) {
                    showAlert('Erro ao tentar abrir a janela de projeção. Verifique permissões de pop-up.', 'error');
                  }
                }}
                className="w-full sm:w-auto min-h-[38px] bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:translate-y-[1px]"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span className="whitespace-nowrap">Monitor 2ª Tela</span>
              </button>
            ) : (
              <button
                type="button"
                aria-label="Fechar janela do monitor em segunda tela"
                onClick={() => {
                  setProjectionWin(null);
                  updateStateAndBroadcast('projectionCloseTrigger', Date.now().toString());
                  updateStateAndBroadcast('isProjectionOpen', false);
                }}
                className="w-full sm:w-auto min-h-[38px] bg-red-600 hover:bg-red-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.35)] transition-all cursor-pointer active:translate-y-[1px]"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span className="whitespace-nowrap">Fechar 2ª Tela</span>
              </button>
            )}
          </div>
        </header>

        {/* ACTIVE BROADCAST HEADER BANNER - SKEUOMORPHIC LED DISPLAY */}
        {isJustStartedRaw && (
          <div className={`px-4 py-2.5 border-b flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 transition-all z-10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] ${
            dismissedJustStarted 
              ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400" 
              : "bg-amber-950/40 border-amber-800/50 text-amber-400"
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
                  <BookOpen className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <span><strong>Modo Reunião Ativo:</strong> Exibindo Bíblia (Carrossel Pausado).</span>
                </>
              )}
            </div>
            
            <button
              onClick={() => updateStateAndBroadcast('dismissedJustStarted', !dismissedJustStarted)}
              className={`text-xs font-black px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] shrink-0 w-full md:w-auto text-center active:translate-y-[1px] ${
                dismissedJustStarted 
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.3)]" 
                  : "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              }`}
            >
              {dismissedJustStarted ? "Exibir Bíblia" : "Liberar Carrossel"}
            </button>
          </div>
        )}

        {/* MOBILE NAVIGATION TABS (Skeuomorphic hardware console tabs) */}
        <nav aria-label="Navegação Principal do Operador" className="lg:hidden flex overflow-x-auto no-scrollbar bg-[#050507] border-b border-[#222] sticky top-0 z-20 shrink-0 p-2 gap-2 shadow-[0_6px_20px_rgba(0,0,0,0.95)]">
          {[
            { id: 'slides', label: 'Mídias', icon: Layout },
            { id: 'texts', label: 'Bíblia', icon: BookOpen },
            { id: 'agenda', label: 'Agenda', icon: CalendarDays },
            { id: 'controls', label: 'Ações', icon: Settings },
            { id: 'sync', label: 'Celular', icon: RefreshCw },
            { id: 'monitor', label: 'Monitor', icon: Monitor },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMobileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Aba ${tab.label}`}
                onClick={() => setActiveMobileTab(tab.id as any)}
                className={`flex-none min-w-[72px] py-2 px-1 text-[10px] font-extrabold uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer rounded-xl relative overflow-hidden active:translate-y-[1px] ${
                  isActive
                    ? "bg-amber-500 border border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] font-black"
                    : "bg-[#111113] text-zinc-400 border border-[#27272a] hover:text-white hover:border-[#333]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 relative z-10 transition-colors ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span className="truncate max-w-full relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* MAIN PANEL CONTENT GRID */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* DESKTOP SIDEBAR PANEL - SKEUOMORPHIC RACK DECK */}
          <aside className="hidden lg:flex flex-col w-[240px] bg-[#070709] border-r border-[#27272a] py-6 px-4 shrink-0 justify-between shadow-[inset_-10px_0_20px_rgba(0,0,0,0.8)] relative">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#222] pb-3 px-1">
                <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest font-mono">NAVEGAÇÃO DECK</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
              </div>
              
              <nav aria-label="Navegação Lateral" className="flex flex-col gap-2">
                {[
                  { id: 'slides', label: 'Playlists & Mídias', icon: Layout },
                  { id: 'texts', label: 'Textos & Bíblia', icon: BookOpen },
                  { id: 'agenda', label: 'Agenda & Eventos', icon: CalendarDays },
                  { id: 'controls', label: 'Controles Gerais', icon: Settings },
                  { id: 'sync', label: 'Sincronizar Celular', icon: RefreshCw },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeMobileTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveMobileTab(item.id as any)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all text-left cursor-pointer active:translate-y-[1px] relative overflow-hidden group ${
                        isActive
                          ? "bg-amber-500 border border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.35)] font-black"
                          : "bg-[#0d0d0f] text-zinc-400 border border-[#222] hover:bg-[#141417] hover:border-[#333] hover:text-zinc-200"
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 relative z-10 transition-colors ${isActive ? "text-black" : "text-amber-500/80 group-hover:text-amber-400"}`} />
                      <span className="relative z-10 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer status */}
            <div className="relative z-10 border-t border-[#222] pt-4 px-2 flex flex-col gap-1.5 text-left bg-[#030304] p-3 rounded-xl border">
              <span className="text-[9px] text-zinc-500 font-black uppercase font-mono tracking-widest">STATUS HARDWARE</span>
              <div className="flex items-center gap-2 text-[10px] text-zinc-300 font-mono font-bold">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse shrink-0" />
                <span>OPERADOR ON-LINE</span>
              </div>
            </div>
          </aside>

          {/* ACTIVE CONTENT WORKSPACE */}
          <main className="flex-1 overflow-y-auto bg-zinc-950/20 p-4 sm:p-6 pb-36 lg:pb-28 flex flex-col gap-6 min-h-0">
            
            <div className="text-left">
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block">
                {activeMobileTab === 'slides' ? 'Mídia' : activeMobileTab === 'texts' ? 'Escrituras' : activeMobileTab === 'agenda' ? 'Programação' : activeMobileTab === 'controls' ? 'Broadcasting' : 'Segurança'}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-100 uppercase tracking-tight mt-0.5">
                {activeMobileTab === 'slides' ? 'Fila de Mídias & Slides' : activeMobileTab === 'texts' ? 'Bíblia & Textos' : activeMobileTab === 'agenda' ? 'Programação & Agenda' : activeMobileTab === 'controls' ? 'Controles & Stage' : 'Conexão & Backup'}
              </h2>
            </div>

            {/* Render selected panels */}
            {activeMobileTab === 'slides' && (
              <PlaylistPanel
                currentSlideId={currentSlideId}
                manualSlideOverride={manualSlideOverride}
                activeSlides={activeSlides}
                allAvailableSlides={allAvailableSlides}
                disabledSlides={disabledSlides}
                customMediaList={customMediaList}
                getSlideDuration={getSlideDuration}
                updateStateAndBroadcast={updateStateAndBroadcast}
                handleMoveSlide={handleMoveSlide}
                handleToggleDisableSlide={handleToggleDisableSlide}
                handleReorderGrouped={handleReorderGrouped}
                handleReorderInterleaved={handleReorderInterleaved}
                handleResetSlidesOrder={handleResetSlidesOrder}
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
                customMeetings={customMeetings}
              />
            )}

            {activeMobileTab === 'texts' && (
              <BiblePanel
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
                projectionWin={null}
                setProjectionWin={setProjectionWin}
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
                isProjectionOpen={isProjectionOpen}
                activeSlides={activeSlides}
              />
            )}
          </main>

          {/* DESKTOP RIGHT PREVIEW MONITOR SIDEBAR */}
          <aside className="hidden lg:flex w-[320px] xl:w-[360px] border-l border-zinc-900 bg-zinc-950/40 p-6 flex-col gap-6 overflow-y-auto shrink-0 text-left">
            <MonitorPanel
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
              isProjectionOpen={isProjectionOpen}
              activeSlides={activeSlides}
            />

            <div className="text-xs text-zinc-500 leading-relaxed mt-4 border-t border-zinc-900 pt-4">
              <strong>Guia de Transmissão:</strong>
              <br />
              1. Conecte o projetor ou TV na saída HDMI da sua máquina.
              <br />
              2. Use o botão <strong>"Abrir Monitor"</strong> acima.
              <br />
              3. Na janela que abrir na TV, clique em qualquer lugar para ativar a <strong>Tela Cheia</strong> automática.
              <br />
              4. Use este painel para monitorar, trocar slides e disparar alertas instantâneos!
            </div>
          </aside>
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

  // MAIN HDMI 16:9 DUAL-SCREEN VIEWPORT
  return (
    <div 
      onClick={async () => {
        if (!isCurrentlyFullscreen) {
          try {
            if ('getScreenDetails' in window) {
              const screenDetails = await (window as any).getScreenDetails();
              const secondaryScreen = screenDetails.screens.find((s: any) => s.isExtended || !s.isPrimary);
              
              if (secondaryScreen) {
                await (document.documentElement as any).requestFullscreen({ screen: secondaryScreen });
                return;
              }
            }
          } catch (e) {
            console.warn("Window Management API failed:", e);
          }
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }}
      className={`w-screen h-screen bg-black overflow-hidden relative select-none font-sans flex items-center justify-center ${isCurrentlyFullscreen ? 'cursor-none' : 'cursor-pointer'}`}
    >
      
      {!isCurrentlyFullscreen && (
        <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-10 text-center animate-in fade-in duration-500">
          <div className="bg-amber-500 text-black p-6 rounded-full mb-6 shadow-[0_0_50px_rgba(245,158,11,0.4)] animate-bounce">
            <Maximize className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Clique para Enviar à 2ª Tela</h2>
          <p className="text-zinc-300 text-xl font-medium">Ele detectará o projetor/TV automaticamente e ficará em tela cheia.</p>
        </div>
      )}
      
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
        className="bg-[#050000] text-white shadow-[0_0_250px_rgba(0,0,0,0.99)] overflow-hidden flex flex-col z-10"
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
          onVideoEnded={handleVideoEnded}
        />
      </div>

      {/* PRELOAD SYSTEM */}
      <div className="hidden absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {customMediaList.map((media) => {
          if (!media.url) return null;
          if (media.type === 'image') {
            return (
              <img 
                key={`preload-${media.id}`} 
                src={media.url} 
                alt="" 
                referrerPolicy="no-referrer" 
              />
            );
          } else {
            return (
              <video 
                key={`preload-${media.id}`} 
                src={media.url} 
                preload="auto" 
                muted 
              />
            );
          }
        })}
      </div>

      {shouldRotate && (
        <div className="absolute top-6 left-6 z-50 bg-black/95 text-white border border-zinc-800 rounded-xl px-5 py-3 text-sm flex items-center gap-2 font-medium pointer-events-none tracking-wide shadow-xl backdrop-blur-md animate-pulse">
          <Tv className="w-5 h-5 text-amber-500" />
          <span>Modo Widescreen Bloqueado. Deite a tela.</span>
        </div>
      )}

      <button
        onClick={toggleFullscreen}
        className="absolute top-6 right-6 z-50 bg-black/80 hover:bg-black/95 text-white border border-zinc-800 hover:border-zinc-600 rounded-full p-4 shadow-xl backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-2 group lg:hidden"
        aria-label="Alternar Tela Cheia"
      >
        {isFullscreen ? (
          <Minimize className="w-6 h-6 text-amber-500" />
        ) : (
          <Maximize className="w-6 h-6 text-amber-500" />
        )}
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap text-zinc-200 text-sm font-semibold pr-0 group-hover:pr-2">
          {isFullscreen ? "Sair" : "Tela Cheia"}
        </span>
      </button>

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
    </div>
  );
}
