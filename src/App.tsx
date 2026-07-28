import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Monitor, Smartphone, RefreshCw, Layout, BookOpen, 
  CalendarDays, Settings, ExternalLink, Maximize, Minimize
} from 'lucide-react';
import { CHURCH_INFO, ALERTS, CAMPAIGNS, MEETINGS } from './data';
import { getNextMeeting, getSlideDuration } from './utils';
import { mediaPreloader } from './utils/preloader';
import { SmartSplashLoader } from './components/SmartSplashLoader';
import { Meeting } from './types';
import { ProjectionContent } from './components/ProjectionContent';
import { SyncSection } from './components/SyncSection';
import { CustomModal, CustomToast } from './components/Modal';

// Redesigned modular Operator Panel components
import { PlaylistPanel } from './components/operator/PlaylistPanel';
import { BiblePanel } from './components/operator/BiblePanel';
import { AgendaPanel } from './components/operator/AgendaPanel';
import { ControlsPanel } from './components/operator/ControlsPanel';
import { MonitorPanel } from './components/operator/MonitorPanel';

import { useProjectionState } from './hooks/useProjectionState';
import { useCustomMedia } from './hooks/useCustomMedia';

type SlideType = string;

const DEFAULT_SLIDES: SlideType[] = [
  'agenda_day_0',
  'seat',
  'verse_1',
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

export default function App() {
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
    carouselStartTimeOffset,
    customMeetings,
    volume,
    tickerText,
    customCampaigns,
    isProjectionOpen,
    mediaUpdateTrigger,
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

  const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastConfig({
      isVisible: true,
      message,
      type
    });
  }, []);

  const [isSmartBooting, setIsSmartBooting] = useState<boolean>(true);

  // Time ticker (updates currentTime every second)
  useEffect(() => {
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

  if (manualSlideOverride) {
    if (isFinalMinute || isJustStarted) {
      isFinalMinute = false;
      isJustStarted = false;
      isLooping = true;
    }
  }

  useEffect(() => {
    if (!isJustStartedRaw && diffSeconds > 300 && dismissedJustStarted) {
      baseUpdateStateAndBroadcast('dismissedJustStarted', false);
    }
  }, [isJustStartedRaw, diffSeconds, dismissedJustStarted, baseUpdateStateAndBroadcast]);

  // Slides Queue Calculation
  const baseActiveSlides: SlideType[] = [...DEFAULT_SLIDES];
  customMediaList.forEach((media) => {
    if (media.enabledInLoop) {
      baseActiveSlides.push(media.id);
    }
  });
  customMeetings.forEach((meet) => {
    if (meet.date) {
      baseActiveSlides.push(`meeting_event_${meet.id}`);
    }
  });
  if (diffSeconds <= 15 * 60) {
    baseActiveSlides.push('soon');
  }

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

  // Preload upcoming slides into memory
  useEffect(() => {
    if (customMediaList.length > 0) {
      const activeSlideId = manualSlideOverride || slidesOrder[0] || 'agenda_day_0';
      mediaPreloader.preloadSlideSequence(activeSlideId, slidesOrder, customMediaList);
    }
  }, [manualSlideOverride, slidesOrder, customMediaList]);

  const handleResetCampaigns = useCallback(() => {
    updateStateAndBroadcast('customCampaigns', CAMPAIGNS);
  }, [updateStateAndBroadcast]);

  const handleMoveSlide = useCallback((slideId: string, direction: 'up' | 'down') => {
    let currentOrder = slidesOrder.filter((id) => baseActiveSlides.includes(id));
    baseActiveSlides.forEach((id) => {
      if (!currentOrder.includes(id)) {
        currentOrder.push(id);
      }
    });

    const idx = currentOrder.indexOf(slideId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const temp = currentOrder[idx];
      currentOrder[idx] = currentOrder[idx - 1];
      currentOrder[idx - 1] = temp;
    } else if (direction === 'down' && idx < currentOrder.length - 1) {
      const temp = currentOrder[idx];
      currentOrder[idx] = currentOrder[idx + 1];
      currentOrder[idx + 1] = temp;
    } else {
      return;
    }

    updateStateAndBroadcast('slidesOrder', JSON.stringify(currentOrder));
  }, [slidesOrder, baseActiveSlides, updateStateAndBroadcast]);

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

  // Global Keyboard Shortcuts for Operator agility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // B: Toggle Blackout
      if (key === 'b') {
        e.preventDefault();
        updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled);
      }
      // C: Toggle Clear Content / Hide Text
      else if (key === 'c') {
        e.preventDefault();
        updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled);
      }
      // Space or ArrowRight or PageDown: Next slide
      else if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (activeSlides.length > 0) {
          const currentIndex = activeSlides.indexOf(currentSlideId);
          const nextIndex = (currentIndex + 1) % activeSlides.length;
          updateStateAndBroadcast('advanceToSlide', activeSlides[nextIndex]);
        }
      }
      // ArrowLeft or PageUp: Previous slide
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (activeSlides.length > 0) {
          const currentIndex = activeSlides.indexOf(currentSlideId);
          const prevIndex = (currentIndex - 1 + activeSlides.length) % activeSlides.length;
          updateStateAndBroadcast('advanceToSlide', activeSlides[prevIndex]);
        }
      }
      // Escape: Reset override / clear active verse / clear alert
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (isLocalProjection) {
          setIsLocalProjection(false);
          return;
        }
        if (manualSlideOverride) updateStateAndBroadcast('manualSlideOverride', null);
        if (customVerseText) {
          updateStateAndBroadcast('customVerseText', null);
          updateStateAndBroadcast('customVerseRef', null);
          updateStateAndBroadcast('activeVerseIndex', null);
        }
        if (activeAlert) updateStateAndBroadcast('activeAlert', null);
      }
      // M: Toggle Mute
      else if (key === 'm') {
        e.preventDefault();
        updateStateAndBroadcast('volume', volume > 0 ? 0 : 0.5);
      }
      // F: Fullscreen
      else if (key === 'f') {
        toggleFullscreen();
      }
      // 1-5: Switch tab
      else if (['1', '2', '3', '4', '5'].includes(key)) {
        const tabMap: Record<string, string> = {
          '1': 'slides',
          '2': 'texts',
          '3': 'agenda',
          '4': 'controls',
          '5': 'sync'
        };
        if (tabMap[key]) {
          setActiveMobileTab(tabMap[key] as any);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blackoutEnabled, clearContentEnabled, activeSlides, currentSlideId, manualSlideOverride, customVerseText, activeAlert, volume, isLocalProjection, toggleFullscreen, updateStateAndBroadcast]);

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

        {/* TOP BAR / NAVIGATION */}
        <header className="h-auto lg:h-16 px-4 lg:px-6 py-3 lg:py-0 bg-zinc-950 border-b border-zinc-900 flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 z-10 shrink-0">
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Tv className="w-5 h-5 text-amber-500 shrink-0" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <h1 className="text-white font-black tracking-tight text-base">
                  HolyLink
                </h1>
                <span className="text-zinc-400 text-xs font-semibold sm:border-l sm:border-zinc-800 sm:pl-2">
                  Painel do Operador
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                {localStorage.getItem('projection_deviceRole') === 'phone' ? (
                  <span className="flex items-center gap-1 text-amber-400 font-extrabold">
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
          
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
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
                className={`flex-1 sm:flex-none min-h-[40px] border text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isProjectionWindowShowing
                    ? 'bg-red-500/10 border-red-500/25 hover:bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 font-bold'
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
              className="flex-1 sm:flex-none min-h-[40px] bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-800 text-zinc-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Monitor className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="whitespace-nowrap">Projetar Aqui</span>
            </button>

            <button
              type="button"
              aria-label="Sincronizar ou conectar celular"
              onClick={() => setActiveMobileTab('sync')}
              className={`flex-1 sm:flex-none min-h-[40px] border text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                activeMobileTab === 'sync'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-extrabold'
                  : 'bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 border-zinc-800 text-zinc-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">Conectar Celular</span>
            </button>

            {!isProjectionOpen ? (
              <button
                type="button"
                aria-label="Abrir janela do monitor em segunda tela"
                onClick={() => {
                  const url = window.location.origin + window.location.pathname + '?projection';
                  const newWin = window.open(url, 'projection_window', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
                  if (newWin) setProjectionWin(newWin);
                  updateStateAndBroadcast('isProjectionOpen', true);
                  updateStateAndBroadcast('projectionCloseTrigger', null);
                }}
                className="w-full sm:w-auto min-h-[40px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.35)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span className="whitespace-nowrap">Abrir Monitor (2ª Tela)</span>
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
                className="w-full sm:w-auto min-h-[40px] bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(220,38,38,0.25)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span className="whitespace-nowrap">Fechar Monitor (2ª Tela)</span>
              </button>
            )}
          </div>
        </header>

        {/* ACTIVE BROADCAST HEADER BANNER */}
        {isJustStartedRaw && (
          <div className={`px-4 py-3 border-b flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 transition-all z-10 ${
            dismissedJustStarted 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
          }`}>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              {dismissedJustStarted ? (
                <>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span><strong>Carrossel de Slides Liberado:</strong> Os anúncios, PIX e mídias estão rodando de forma automática e manual na projeção.</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 animate-pulse shrink-0" />
                  <span><strong>Modo Culto Iniciado Ativo:</strong> A TV de projeção está exibindo os Versículos Bíblicos. O carrossel automático está em pausa.</span>
                </>
              )}
            </div>
            
            <button
              onClick={() => updateStateAndBroadcast('dismissedJustStarted', !dismissedJustStarted)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-md shrink-0 w-full md:w-auto text-center ${
                dismissedJustStarted 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/10" 
                  : "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/10"
              }`}
            >
              {dismissedJustStarted ? "Mostrar Versículos na TV" : "Liberar Carrossel de Slides"}
            </button>
          </div>
        )}

        {/* MOBILE NAVIGATION TABS (Visible on mobile/tablet) */}
        <nav aria-label="Navegação Principal do Operador" className="lg:hidden flex overflow-x-auto no-scrollbar bg-zinc-950 border-b border-zinc-900 sticky top-0 z-20 shrink-0 divide-x divide-zinc-900/60">
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
                className={`flex-1 min-w-[68px] min-h-[48px] py-2.5 px-1 text-[10px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isActive
                    ? "text-amber-400 border-b-2 border-amber-500 bg-zinc-900/60 font-black"
                    : "text-zinc-400 hover:text-zinc-200 active:bg-zinc-900/30"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-500' : 'text-zinc-400'}`} />
                <span className="truncate max-w-full">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* MAIN PANEL CONTENT GRID */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* DESKTOP SIDEBAR PANEL */}
          <aside className="hidden lg:flex flex-col w-[240px] bg-zinc-950 border-r border-zinc-900 py-6 px-4 shrink-0 justify-between">
            <div className="flex flex-col gap-6">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-2">Navegação do Deck</span>
              
              <nav aria-label="Navegação Lateral" className="flex flex-col gap-1.5">
                {[
                  { id: 'slides', label: 'Playlists & Mídias', icon: Layout },
                  { id: 'texts', label: 'Textos & Bíblia', icon: BookOpen },
                  { id: 'agenda', label: 'Agenda & Campanhas', icon: CalendarDays },
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400 shadow-sm border border-amber-500/20 font-extrabold"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent"
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-500" : "text-zinc-500"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer status */}
            <div className="border-t border-zinc-900 pt-4 px-2 flex flex-col gap-1 text-left">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Status Local</span>
              <div className="flex items-center gap-2 text-[10px] text-zinc-300 font-mono mt-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                <span>Modo Operador Ativo</span>
              </div>
            </div>
          </aside>

          {/* ACTIVE CONTENT WORKSPACE */}
          <main className="flex-1 overflow-y-auto bg-zinc-950/20 p-4 sm:p-6 pb-36 lg:pb-28 flex flex-col gap-6 min-h-0">
            
            <div className="text-left">
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block">
                {activeMobileTab === 'slides' ? 'Mídia' : activeMobileTab === 'texts' ? 'Escrituras' : activeMobileTab === 'agenda' ? 'Programação' : activeMobileTab === 'controls' ? 'Broadcasting' : 'Segurança'}
              </span>
              <h2 className="text-xl font-extrabold text-zinc-100 uppercase tracking-tight mt-0.5">
                {activeMobileTab === 'slides' ? 'Fila de Slides & Carrossel' : activeMobileTab === 'texts' ? 'Bíblia Sagrada & Textos' : activeMobileTab === 'agenda' ? 'Eventos & Campanhas' : activeMobileTab === 'controls' ? 'Controle de Stage & Alertas' : 'Conexão Sem Fio & Backup'}
              </h2>
            </div>

            {/* Render selected panels */}
            {activeMobileTab === 'slides' && (
              <PlaylistPanel
                currentSlideId={currentSlideId}
                manualSlideOverride={manualSlideOverride}
                activeSlides={activeSlides}
                customMediaList={customMediaList}
                getSlideDuration={getSlideDuration}
                updateStateAndBroadcast={updateStateAndBroadcast}
                handleMoveSlide={handleMoveSlide}
                handleFileUpload={handleFileUpload}
                isUploading={isUploading}
                uploadError={uploadError}
                videoPinBehavior={videoPinBehavior}
                handleMoveMedia={handleMoveMedia}
                showConfirm={showConfirm}
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
              />
            )}

            {activeMobileTab === 'agenda' && (
              <AgendaPanel
                customMeetings={customMeetings}
                customCampaigns={customCampaigns}
                updateStateAndBroadcast={updateStateAndBroadcast}
                showConfirm={showConfirm}
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
                updateStateAndBroadcast={updateStateAndBroadcast}
                currentTime={currentTime}
                isProjectionOpen={isProjectionOpen}
              />
            )}

            {/* Persistent WebRTC & Peer Sync Section (Kept mounted in background so connection stays active) */}
            <div className={activeMobileTab === 'sync' ? 'w-full' : 'hidden'}>
              <SyncSection showAlert={showAlert} showConfirm={showConfirm} />
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
                loopIteration={loopIteration}
                updateStateAndBroadcast={updateStateAndBroadcast}
                customMeetings={customMeetings}
                customCampaigns={customCampaigns}
                nextMeeting={nextMeeting}
                nextMeetingDate={nextMeetingDate}
                ongoingMeeting={ongoingMeeting}
                volume={volume}
                tickerText={tickerText}
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
              loopIteration={loopIteration}
              updateStateAndBroadcast={updateStateAndBroadcast}
              customMeetings={customMeetings}
              customCampaigns={customCampaigns}
              nextMeeting={nextMeeting}
              nextMeetingDate={nextMeetingDate}
              ongoingMeeting={ongoingMeeting}
              volume={volume}
              tickerText={tickerText}
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
          loopIteration={loopIteration}
          onClearAlert={() => updateStateAndBroadcast('activeAlert', null)}
          customMeetings={customMeetings}
          customCampaigns={customCampaigns}
          nextMeeting={nextMeeting}
          nextMeetingDate={nextMeetingDate}
          ongoingMeeting={ongoingMeeting}
          volume={volume}
          tickerText={tickerText}
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
          <span>📺 Modo Widescreen Bloqueado. Deite a tela.</span>
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
