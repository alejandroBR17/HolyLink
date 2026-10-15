import {isYouthProjection} from './utils/projection-theme';
import { useSlideManager } from "./hooks/useSlideManager";
import { useWakeLock } from "./hooks/useWakeLock";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Monitor, Smartphone, RefreshCw, Layout, BookOpen, 
  CalendarDays, Settings, ExternalLink, Maximize, Minimize, Download, Sparkles,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, EyeOff, Eye
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

  const [isScrolledDown, setIsScrolledDown] = useState<boolean>(false);
  const lastScrollTopRef = useRef<number>(0);

  const handleMainScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const delta = currentScrollTop - lastScrollTopRef.current;
    
    // Auto-collapse header on mobile when scrolling down, restore when scrolling up or at top
    if (currentScrollTop > 40 && delta > 8) {
      setIsScrolledDown(true);
    } else if (delta < -10 || currentScrollTop <= 15) {
      setIsScrolledDown(false);
    }
    lastScrollTopRef.current = currentScrollTop;
  }, []);

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

  const activeCampaignsFiltered = (customCampaigns || []).filter((c) => {
    if (!c.endDate) return true;
    return c.endDate >= todayStr;
  });
  const hasActiveCampaigns = activeCampaignsFiltered.length > 0;

  const defaultBaseSlides = (projectionMode === 'post' ? POST_MEETING_DEFAULT_SLIDES : DEFAULT_SLIDES).filter(id => {
    if (id === 'campaigns' && !hasActiveCampaigns) return false;
    return true;
  });
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

  const navigateOutput = (direction: number) => {
    if (!activeSlides.length) return;
    const index = activeSlides.indexOf(currentSlideId);
    const next = ((index < 0 ? 0 : index) + direction + activeSlides.length) % activeSlides.length;
    updateStateAndBroadcast('customVerseText', null);
    updateStateAndBroadcast('customVerseRef', null);
    updateStateAndBroadcast('activeVerseIndex', null);
    updateStateAndBroadcast('manualSlideOverride', activeSlides[next]);
  };
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
      <div className="operator-shell w-full h-full text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
        
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

        <header className="holy-topbar">
          <div className="holy-brand"><img src={LOGO_URLS.symbol} alt="Símbolo HolyLink" width={44} height={44} /><div><h1>HolyLink</h1><span>Projeção · 16:9</span></div></div>
          <div className="holy-header-actions">
            <button type="button" className="holy-output-button" onClick={() => {
              if (isProjectionOpen) {setProjectionWin(null); updateStateAndBroadcast('projectionCloseTrigger', Date.now().toString()); updateStateAndBroadcast('isProjectionOpen', false); return;}
              const win = window.open(window.location.origin + window.location.pathname + '?projection', 'projection_window', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
              if (!win) {showAlert('Permita a abertura de janelas para usar o telão.', 'error'); return;}
              setProjectionWin(win); updateStateAndBroadcast('isProjectionOpen', true); updateStateAndBroadcast('projectionCloseTrigger', null);
            }}><ExternalLink size={18} aria-hidden="true" /><span>{isProjectionOpen ? 'Fechar telão' : 'Abrir telão'}</span></button>
            <details className="holy-options"><summary aria-label="Mais opções">Opções<ChevronDown size={16} aria-hidden="true" /></summary><div>
              <button type="button" onClick={event => {setIsLocalProjection(true); toggleFullscreen(); event.currentTarget.closest('details')?.removeAttribute('open');}}><Maximize size={18} />Projetar neste aparelho</button>
              <button type="button" onClick={event => {setActiveMobileTab('sync'); event.currentTarget.closest('details')?.removeAttribute('open');}}><Smartphone size={18} />Conectar celular</button>
              <button type="button" onClick={event => {setShowPwaModal(true); event.currentTarget.closest('details')?.removeAttribute('open');}}><Download size={18} />Instalar HolyLink</button>
              {isElectron && <button type="button" onClick={() => {ipcRendererRef.current?.send(isProjectionWindowShowing ? 'hide-projection' : 'show-projection'); setIsProjectionWindowShowing(!isProjectionWindowShowing);}}><Tv size={18} />Alternar janela do projetor</button>}
            </div></details>
          </div>
        </header>
        {/* ACTIVE BROADCAST HEADER BANNER - SKEUOMORPHIC LED DISPLAY */}
        {isJustStartedRaw && (
          <div className={`px-4 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 transition-all duration-300 z-10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] ${
            isScrolledDown
              ? 'max-h-0 py-0 opacity-0 overflow-hidden border-b-0 pointer-events-none lg:max-h-24 lg:py-2.5 lg:border-b lg:opacity-100 lg:pointer-events-auto'
              : 'max-h-40 py-2.5 border-b opacity-100'
          } ${
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

        <nav className="holy-navigation" role="tablist" aria-label="Áreas do operador">
          {[
            {id:'slides',label:'Sequência',icon:Layout}, {id:'texts',label:'Bíblia',icon:BookOpen},
            {id:'agenda',label:'Agenda',icon:CalendarDays}, {id:'controls',label:'Ajustes',icon:Settings},
            {id:'sync',label:'Conexão',icon:Smartphone}, {id:'monitor',label:'Monitor',icon:Monitor}
          ].map(tab => {const Icon = tab.icon; return <button type="button" role="tab" key={tab.id} aria-selected={activeMobileTab===tab.id} aria-label={'Aba '+tab.label} onClick={() => setActiveMobileTab(tab.id as any)}><Icon size={19} aria-hidden="true" /><span>{tab.label}</span></button>;})}
        </nav>
        {/* MAIN PANEL CONTENT GRID */}
        <div className="operator-workspace flex-1 flex flex-col overflow-hidden min-h-0">
          

          {/* ACTIVE CONTENT WORKSPACE */}
          <nav className="operator-quick-strip" aria-label="Controles essenciais da projeção">
            <button type="button" aria-pressed={blackoutEnabled} onClick={() => updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled)}><EyeOff size={18} aria-hidden="true" />{blackoutEnabled ? 'Restaurar tela' : 'Blackout'}</button>
            <button type="button" aria-pressed={clearContentEnabled} onClick={() => updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled)}><Eye size={18} aria-hidden="true" />{clearContentEnabled ? 'Mostrar texto' : 'Limpar texto'}</button>
            <button type="button" disabled={!activeSlides.length} onClick={() => navigateOutput(-1)}><ChevronLeft size={18} aria-hidden="true" />Slide anterior</button>
            <button type="button" disabled={!activeSlides.length} onClick={() => navigateOutput(1)}><ChevronRight size={18} aria-hidden="true" />Próximo slide</button>
          </nav>          <main onScroll={handleMainScroll} className="operator-main flex-1 overflow-y-auto flex flex-col gap-5 min-h-0">
            
            {/* Render selected panels */}
            {activeMobileTab === 'slides' && (
              <PlaylistPanel
                slidesOrder={slidesOrder}
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
                isFJU={isYouthProjection(ongoingMeeting, nextMeeting, nextMeetingDate, currentTime)}
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
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Ativar tela cheia no telão</h2>
          <p className="text-zinc-300 text-xl font-medium">Abra esta janela no telão ligado por HDMI e clique para entrar em tela cheia.</p>
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
