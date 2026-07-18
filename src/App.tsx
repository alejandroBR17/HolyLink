import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Armchair, MessageSquareOff, Globe, Flame, DoorOpen, Smartphone, Clock, Tv, Instagram, HeartHandshake, QrCode, Settings, Bell, X, CalendarDays, WifiOff, Maximize, Minimize, ExternalLink, Play, Pause, Plus, Minus, RefreshCw, AlertTriangle, Monitor, Laptop, Send, Trash2, EyeOff, Sparkles, Shuffle, BookOpen, Undo2, Search, Image, Film, Volume2, VolumeX, ArrowUp, ArrowDown, Download, Upload } from 'lucide-react';
import QRCode from "react-qr-code";
import { CHURCH_INFO, ALERTS, VERSES, SLIDE_TIMING, DONATION, CAMPAIGNS, WEEK_SCHEDULES } from './data';
import { getNextMeeting, saveMediaItem, getAllMediaItems, deleteMediaItem, getSlideDuration } from './utils';
import { ParticlesBackground } from './components/ParticlesBackground';
import { VerseSlide } from './components/VerseSlide';
import { ProjectionContent } from './components/ProjectionContent';
import { IconSlide, WorldGodSlide, AgendaDaySlide, DonationSlide, CampaignSlide, VideoSlide } from './components/slides';
import { SyncSection } from './components/SyncSection';
import { BibleSection } from './components/BibleSection';
import { ptBR } from 'date-fns/locale';

// ==========================================
// 1. DATA CONSTANTS
// ==========================================

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
  'agenda_day_6',
  'world_god'
];

interface CustomMedia {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number; // in milliseconds
  enabledInLoop: boolean;
  url: string;
  muted?: boolean;
  order?: number;
}

// ==========================================
// 1. STATE TYPES
// ==========================================




export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [manualRotateMode, setManualRotateMode] = useState<'auto' | 'force-landscape'>('auto');

  // Electron Detection & Window Toggle States
  const [isProjectionWindowShowing, setIsProjectionWindowShowing] = useState(true);
  const ipcRendererRef = useRef<any>(null);
  const [projectionWin, setProjectionWin] = useState<Window | null>(null);
  const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');

  // Monitor if window is closed
  useEffect(() => {
    if (!projectionWin) return;
    const timer = setInterval(() => {
      if (projectionWin.closed) {
        setProjectionWin(null);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [projectionWin]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).require) {
        ipcRendererRef.current = (window as any).require('electron').ipcRenderer;
      }
    } catch (e) {
      // Safe fallback when not in desktop/Electron environment
    }
  }, []);

  // Synchronized Presentation States
  const [isLocalProjection, setIsLocalProjection] = useState(false);
  const isProjectionView = (typeof window !== 'undefined' && window.location.search.includes('projection')) || isLocalProjection;

  const [manualSlideOverride, setManualSlideOverride] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_manualSlideOverride');
  });
  const [countdownOffset, setCountdownOffset] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem('projection_countdownOffset') || '0', 10);
  });
  const [countdownPaused, setCountdownPaused] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_countdownPaused') === 'true';
  });
  const [pausedSeconds, setPausedSeconds] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem('projection_pausedSeconds');
    return val ? parseInt(val, 10) : null;
  });
  const [activeAlert, setActiveAlert] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_activeAlert');
  });
  const [blackoutEnabled, setBlackoutEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_blackoutEnabled') === 'true';
  });
  const [clearContentEnabled, setClearContentEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_clearContentEnabled') === 'true';
  });
  const [activeVerseIndex, setActiveVerseIndex] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem('projection_activeVerseIndex');
    return val ? parseInt(val, 10) : null;
  });
  const [customVerseText, setCustomVerseText] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_customVerseText');
  });
  const [customVerseRef, setCustomVerseRef] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_customVerseRef');
  });
  const [videoPinBehavior, setVideoPinBehavior] = useState<'loop' | 'unpin'>(() => {
    if (typeof window === 'undefined') return 'loop';
    return (localStorage.getItem('projection_videoPinBehavior') as 'loop' | 'unpin') || 'loop';
  });
  const [dismissedJustStarted, setDismissedJustStarted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_dismissedJustStarted') === 'true';
  });

  const [slidesOrder, setSlidesOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const val = localStorage.getItem('projection_slidesOrder');
    if (val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Custom Media States
  const [mediaUpdateTrigger, setMediaUpdateTrigger] = useState<string>(() => {
    if (typeof window === 'undefined') return '0';
    return localStorage.getItem('projection_mediaUpdateTrigger') || '0';
  });
  const [customMediaList, setCustomMediaList] = useState<CustomMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);



  // Load custom media files from DB on trigger or mount
  useEffect(() => {
    let active = true;
    const loadMedia = async () => {
      try {
        const items = await getAllMediaItems();
        if (!active) return;
        
        // Revoke old object URLs to avoid memory leaks
        setCustomMediaList((prevList) => {
          prevList.forEach((m) => {
            if (m.url && m.url.startsWith('blob:')) {
              URL.revokeObjectURL(m.url);
            }
          });
          
          // Sort items by order first, then fallback to timestamp/id
          const sortedItems = [...items].sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            
            // Fallback: extract timestamp from ID if present
            const aMatch = a.id.match(/\d+$/);
            const bMatch = b.id.match(/\d+$/);
            if (aMatch && bMatch) {
              return parseInt(aMatch[0], 10) - parseInt(bMatch[0], 10);
            }
            return a.id.localeCompare(b.id);
          });

          return sortedItems.map((item) => ({
            id: item.id,
            type: item.type,
            name: item.name,
            duration: item.duration,
            enabledInLoop: item.enabledInLoop,
            url: URL.createObjectURL(item.blob),
            muted: item.muted !== undefined ? item.muted : true,
            order: item.order
          }));
        });
      } catch (err) {
        console.error("Failed to load custom media from DB", err);
      }
    };

    loadMedia();

    return () => {
      active = false;
    };
  }, [mediaUpdateTrigger]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setUploadError("Por favor, selecione apenas arquivos de imagem ou vídeo.");
      setIsUploading(false);
      return;
    }

    try {
      let duration = 10000; // default 10 seconds for images

      if (isVideo) {
        // Measure exact duration of video
        duration = await new Promise<number>((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          const objectUrl = URL.createObjectURL(file);
          video.src = objectUrl;
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(Math.round(video.duration * 1000));
          };
          video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(10000); // fallback if metadata fails
          };
        });
      }

      const currentItems = await getAllMediaItems();
      const maxOrder = currentItems.reduce((max, item) => Math.max(max, item.order ?? 0), -1);
      const order = maxOrder + 1;

      const id = `custom_${isVideo ? 'vid' : 'img'}_${Date.now()}`;
      await saveMediaItem({
        id,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        duration,
        enabledInLoop: true,
        blob: file,
        muted: isVideo ? true : undefined,
        order
      });

      // Broadcast update
      updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
    } catch (err: any) {
      console.error("Error saving uploaded file:", err);
      setUploadError("Não foi possível salvar o arquivo. Limite de armazenamento pode ter sido excedido.");
    } finally {
      setIsUploading(false);
      // Reset input value to allow uploading same file again
      e.target.value = '';
    }
  };

  const handleMoveMedia = async (mediaId: string, direction: 'up' | 'down') => {
    try {
      const items = await getAllMediaItems();
      
      // Sort items by order first, then fallback to timestamp/id
      const sortedItems = [...items].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        
        // Fallback: extract timestamp from ID if present
        const aMatch = a.id.match(/\d+$/);
        const bMatch = b.id.match(/\d+$/);
        if (aMatch && bMatch) {
          return parseInt(aMatch[0], 10) - parseInt(bMatch[0], 10);
        }
        return a.id.localeCompare(b.id);
      });

      const idx = sortedItems.findIndex(item => item.id === mediaId);
      if (idx === -1) return;

      if (direction === 'up' && idx > 0) {
        // Swap with previous
        const temp = sortedItems[idx];
        sortedItems[idx] = sortedItems[idx - 1];
        sortedItems[idx - 1] = temp;
      } else if (direction === 'down' && idx < sortedItems.length - 1) {
        // Swap with next
        const temp = sortedItems[idx];
        sortedItems[idx] = sortedItems[idx + 1];
        sortedItems[idx + 1] = temp;
      } else {
        // No move possible
        return;
      }

      // Reassign sequential order numbers
      for (let i = 0; i < sortedItems.length; i++) {
        sortedItems[i].order = i;
        await saveMediaItem(sortedItems[i]);
      }

      // Broadcast update
      updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
    } catch (err) {
      console.error("Failed to move media item:", err);
    }
  };

  const handleMoveSlide = (slideId: string, direction: 'up' | 'down') => {
    const baseActiveSlides: SlideType[] = [...DEFAULT_SLIDES];
    customMediaList.forEach((media) => {
      if (media.enabledInLoop) {
        baseActiveSlides.push(media.id);
      }
    });
    const nextMeetingDateObj = getNextMeeting(new Date()).nextMeetingDate;
    const adjustedNextMeetingDate = new Date(nextMeetingDateObj.getTime() + countdownOffset);
    const diffSecondsLocal = Math.max(0, Math.floor((adjustedNextMeetingDate.getTime() - new Date().getTime()) / 1000));
    if (diffSecondsLocal <= 15 * 60) {
      baseActiveSlides.push('soon');
    }

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
  };

  const updateStateAndBroadcast = (key: string, value: any) => {
    if (value === null || value === undefined) {
      localStorage.removeItem(`projection_${key}`);
    } else {
      localStorage.setItem(`projection_${key}`, value.toString());
    }

    if (key === 'manualSlideOverride') setManualSlideOverride(value);
    else if (key === 'countdownOffset') setCountdownOffset(value);
    else if (key === 'countdownPaused') setCountdownPaused(value);
    else if (key === 'pausedSeconds') setPausedSeconds(value);
    else if (key === 'activeAlert') setActiveAlert(value);
    else if (key === 'blackoutEnabled') setBlackoutEnabled(value === 'true' || value === true);
    else if (key === 'clearContentEnabled') setClearContentEnabled(value === 'true' || value === true);
    else if (key === 'activeVerseIndex') setActiveVerseIndex(value !== null ? parseInt(value, 10) : null);
    else if (key === 'customVerseText') setCustomVerseText(value);
    else if (key === 'customVerseRef') setCustomVerseRef(value);
    else if (key === 'dismissedJustStarted') setDismissedJustStarted(value === 'true' || value === true);
    else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(value);
    else if (key === 'videoPinBehavior') setVideoPinBehavior(value);
    else if (key === 'slidesOrder') {
      try {
        setSlidesOrder(value ? JSON.parse(value) : []);
      } catch (e) {
        setSlidesOrder([]);
      }
    }

    try {
      const bc = new BroadcastChannel('holyrics_projection_sync');
      bc.postMessage({ type: 'UPDATE_STATE', key, value });
      bc.close();
    } catch (e) {
      // Fallback to storage event when BroadcastChannel fails
    }

    // Forward to remote peer if connected (sender side)
    const peerConn = (window as any).holyrics_peer_conn;
    if (peerConn && peerConn.open) {
      peerConn.send({ type: 'UPDATE_STATE', key, value, version: 1 });
    }
  };

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('holyrics_projection_sync');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'UPDATE_STATE') {
          const { key, value } = event.data;
          updateStateLocalOnly(key, value);
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported in this frame environment. Using localStorage fallback.");
    }

    const updateStateLocalOnly = (key: string, value: any) => {
      if (key === 'manualSlideOverride') setManualSlideOverride(value);
      else if (key === 'countdownOffset') setCountdownOffset(value !== null ? parseInt(value.toString(), 10) : 0);
      else if (key === 'countdownPaused') setCountdownPaused(value === 'true' || value === true);
      else if (key === 'pausedSeconds') setPausedSeconds(value !== null ? parseInt(value.toString(), 10) : null);
      else if (key === 'activeAlert') setActiveAlert(value);
      else if (key === 'blackoutEnabled') setBlackoutEnabled(value === 'true' || value === true);
      else if (key === 'clearContentEnabled') setClearContentEnabled(value === 'true' || value === true);
      else if (key === 'activeVerseIndex') setActiveVerseIndex(value !== null ? parseInt(value.toString(), 10) : null);
      else if (key === 'customVerseText') setCustomVerseText(value);
      else if (key === 'customVerseRef') setCustomVerseRef(value);
      else if (key === 'dismissedJustStarted') setDismissedJustStarted(value === 'true' || value === true);
      else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(value);
      else if (key === 'videoPinBehavior') setVideoPinBehavior(value);
      else if (key === 'slidesOrder') {
        try {
          setSlidesOrder(value ? JSON.parse(value) : []);
        } catch (e) {
          setSlidesOrder([]);
        }
      }
    };

    const handlePeerUpdate = (e: CustomEvent) => {
      if (e.detail) {
        updateStateLocalOnly(e.detail.key, e.detail.value);
      }
    };
    
    const handleFullSync = () => {
      // Reload all state from localStorage
      setManualSlideOverride(localStorage.getItem('projection_manualSlideOverride'));
      setCountdownOffset(parseInt(localStorage.getItem('projection_countdownOffset') || '0', 10));
      setCountdownPaused(localStorage.getItem('projection_countdownPaused') === 'true');
      setPausedSeconds(localStorage.getItem('projection_pausedSeconds') ? parseInt(localStorage.getItem('projection_pausedSeconds')!, 10) : null);
      setActiveAlert(localStorage.getItem('projection_activeAlert'));
      setBlackoutEnabled(localStorage.getItem('projection_blackoutEnabled') === 'true');
      setClearContentEnabled(localStorage.getItem('projection_clearContentEnabled') === 'true');
      const idx = localStorage.getItem('projection_activeVerseIndex');
      setActiveVerseIndex(idx ? parseInt(idx, 10) : null);
      setCustomVerseText(localStorage.getItem('projection_customVerseText') || '');
      setCustomVerseRef(localStorage.getItem('projection_customVerseRef') || '');
      setDismissedJustStarted(localStorage.getItem('projection_dismissedJustStarted') === 'true');
      setMediaUpdateTrigger(localStorage.getItem('projection_mediaUpdateTrigger') || '0');
      setVideoPinBehavior((localStorage.getItem('projection_videoPinBehavior') as 'unpin' | 'loop') || 'unpin');
      try {
        const order = localStorage.getItem('projection_slidesOrder');
        setSlidesOrder(order ? JSON.parse(order) : []);
      } catch (e) {
        setSlidesOrder([]);
      }
      // Also fetch media
      getAllMediaItems().then(items => setCustomMediaList(items));
    };

    window.addEventListener('projection_sync_update', handlePeerUpdate as EventListener);
    window.addEventListener('projection_full_sync_received', handleFullSync);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('projection_')) {
        const key = e.key.replace('projection_', '');
        const val = e.newValue;
        updateStateLocalOnly(key, val);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('projection_sync_update', handlePeerUpdate as EventListener);
      window.removeEventListener('projection_full_sync_received', handleFullSync);
    };
  }, []);
  
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  // Screen resizing
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Responsive Operator's Panel states
  const [activeMobileTab, setActiveMobileTab] = useState<'slides' | 'controls' | 'monitor'>('slides');
  const monitorContainerRef = useRef<HTMLDivElement>(null);
  const [monitorScale, setMonitorScale] = useState(0.13);

  useEffect(() => {
    const updateScale = () => {
      if (monitorContainerRef.current) {
        const w = monitorContainerRef.current.clientWidth;
        setMonitorScale(w / 1920);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    const timer = setTimeout(updateScale, 200);
    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timer);
    };
  }, [activeMobileTab]);

  // Local Bible API states

  const toggleFullscreen = () => {
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
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Keyboard listener for fullscreen toggle and exiting local projection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape') {
        setIsLocalProjection(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Meeting State
  const { nextMeeting, nextMeetingDate, ongoingMeeting } = getNextMeeting(currentTime);
  
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

  // Se o cronômetro terminou (chegou a zero ou passou),
  // força a exibição dos versículos bíblicos (reunião iniciada) para evitar telas pretas ou vazias.
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
  let isLooping = !isJustStarted && diffSeconds > 300;

  if (manualSlideOverride) {
    if (isFinalMinute || isJustStarted) {
      isFinalMinute = false;
      isJustStarted = false;
      isLooping = true;
    }
  }

  // Auto-reset dismissedJustStarted when countdown is active (meaning far before a meeting)
  useEffect(() => {
    if (diffSeconds > 300 && dismissedJustStarted) {
      updateStateAndBroadcast('dismissedJustStarted', false);
    }
  }, [diffSeconds, dismissedJustStarted]);

  // Render Slide Machine
  const baseActiveSlides: SlideType[] = [...DEFAULT_SLIDES];
  customMediaList.forEach((media) => {
    if (media.enabledInLoop) {
      baseActiveSlides.push(media.id);
    }
  });
  if (diffSeconds <= 15 * 60) {
    baseActiveSlides.push('soon');
  }

  // Build activeSlides using the user's custom slidesOrder
  // 1. Start with the saved slidesOrder, but only keep slides that are in baseActiveSlides
  let activeSlides = slidesOrder.filter((id) => baseActiveSlides.includes(id));
  // 2. Add any slides from baseActiveSlides that are NOT in slidesOrder to the end
  baseActiveSlides.forEach((id) => {
    if (!activeSlides.includes(id)) {
      activeSlides.push(id);
    }
  });

  const totalDuration = activeSlides.reduce((sum, id) => sum + getSlideDuration(id, customMediaList), 0);
  const timeInLoop = currentTime.getTime() % totalDuration;
  const loopIteration = Math.floor(currentTime.getTime() / totalDuration);
  let accumulatedTime = 0;
  let currentSlideId = activeSlides[0];

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

  // Scale calculations for 16:9
  const { width, height } = dimensions;
  const shouldRotate = manualRotateMode === 'auto' && height > width;
  
  let scale = 1;
  if (shouldRotate) {
    const vWidth = height;
    const vHeight = width;
    scale = Math.min(vWidth / 1920, vHeight / 1080);
  } else {
    scale = Math.min(width / 1920, height / 1080);
  }

  // Header Counters
  const countHours = Math.floor(diffSeconds / 3600);
  const countMinutes = Math.floor((diffSeconds % 3600) / 60);
  const hoursStr = countHours.toString().padStart(2, '0');
  const minutesStr = countMinutes.toString().padStart(2, '0');

  const [isCurrentlyFullscreen, setIsCurrentlyFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsCurrentlyFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isProjectionView) {
    return (
      <div className="w-screen h-screen bg-[#0c0c0c] text-stone-200 flex flex-col font-sans select-none overflow-hidden">
        {/* TOP BAR */}
        <header className="h-auto lg:h-16 px-4 lg:px-6 py-3.5 lg:py-0 bg-[#121212] border-b border-stone-850 flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 z-10 shrink-0">
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-yellow-500" />
              <h1 className="text-white font-bold tracking-tight text-base">
                HolyLink <span className="text-stone-400 text-xs font-medium ml-1.5 sm:ml-2 border-l border-stone-800 pl-1.5 sm:pl-2">Painel do Operador</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-stone-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-stone-400 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Sincronizado
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {isElectron && (
              <button
                onClick={() => {
                  if (isProjectionWindowShowing) {
                    ipcRendererRef.current?.send('hide-projection');
                    setIsProjectionWindowShowing(false);
                  } else {
                    ipcRendererRef.current?.send('show-projection');
                    setIsProjectionWindowShowing(true);
                  }
                }}
                className={`flex-1 lg:flex-none border text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isProjectionWindowShowing
                    ? 'bg-red-500/10 border-red-500/25 hover:bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 font-bold'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{isProjectionWindowShowing ? 'Apagar Projetor' : 'Ligar Projetor'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsLocalProjection(true);
                toggleFullscreen();
              }}
              className="flex-1 lg:flex-none bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Projetar Aqui</span>
            </button>

            <button
              onClick={() => {
                const url = window.location.origin + window.location.pathname + '?projection';
                window.open(url, 'projection_window', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
              }}
              className="flex-1 lg:flex-none bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(234,179,8,0.2)] transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Projeção (2ª Tela)</span>
            </button>
          </div>
        </header>

        {/* CULTO INICIADO BANNER */}
        {isJustStartedRaw && (
          <div className={`px-4 py-3 border-b flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 transition-all z-10 ${
            dismissedJustStarted 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
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
                  : "bg-yellow-500 hover:bg-yellow-600 text-black shadow-yellow-500/10"
              }`}
            >
              {dismissedJustStarted ? "Mostrar Versículos na TV" : "Liberar Carrossel de Slides"}
            </button>
          </div>
        )}

        {/* MOBILE TABS BAR (Only visible on screens smaller than lg) */}
        <div className="lg:hidden flex bg-[#121212] border-b border-stone-850 sticky top-0 z-20 shrink-0">
          <button
            onClick={() => setActiveMobileTab('slides')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
              activeMobileTab === 'slides'
                ? "text-yellow-500 border-b-2 border-yellow-500 bg-stone-900/40"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Slides ({activeSlides.length})</span>
          </button>
          <button
            onClick={() => setActiveMobileTab('controls')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
              activeMobileTab === 'controls'
                ? "text-yellow-500 border-b-2 border-yellow-500 bg-stone-900/40"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Controles</span>
          </button>
          <button
            onClick={() => setActiveMobileTab('monitor')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all ${
              activeMobileTab === 'monitor'
                ? "text-yellow-500 border-b-2 border-yellow-500 bg-stone-900/40"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Monitor</span>
          </button>
        </div>

        {/* CONTAINER */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* LEFT: SLIDES MATRIX */}
          <div className={`w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-stone-800 bg-[#0d0d0d] p-4 lg:p-6 overflow-y-auto flex flex-col ${activeMobileTab === 'slides' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider">Playlists / Slides</h2>
              {manualSlideOverride ? (
                <button
                  onClick={() => updateStateAndBroadcast('manualSlideOverride', null)}
                  className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-yellow-500/20 transition-all font-bold cursor-pointer animate-pulse"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Voltar ao Automático
                </button>
              ) : (
                <span className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Modo Automático Ativo
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:gap-3 pb-8">
              {activeSlides.map((slideId, idx) => {
                const isActive = currentSlideId === slideId;
                const isOverridden = manualSlideOverride === slideId;
                
                let name = slideId;
                let desc = "";
                if (slideId.startsWith("agenda_day_")) {
                  const dayIdx = parseInt(slideId.replace("agenda_day_", ""), 10);
                  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
                  name = `Agenda: ${days[dayIdx]}`;
                  desc = "Programação semanal";
                } else if (slideId.startsWith("verse_")) {
                  const offset = parseInt(slideId.replace("verse_", ""), 10) || 0;
                  name = `Versículo ${offset}`;
                  desc = "Leitura de versículo bíblico";
                } else if (slideId.startsWith("custom_")) {
                  const media = customMediaList.find(m => m.id === slideId);
                  name = media ? media.name : "Mídia Customizada";
                  desc = media ? `Mídia: ${media.type === 'image' ? 'Imagem' : 'Vídeo'}` : "Mídia da fila";
                } else {
                  switch (slideId) {
                    case 'seat': name = "Fique à vontade"; desc = "Procurar assento"; break;
                    case 'bathroom': name = "Vá ao banheiro"; desc = "Ir antes de começar"; break;
                    case 'phone': name = "Celular no Silencioso"; desc = "Evitar interrupções"; break;
                    case 'no_chat': name = "Silêncio / Concentração"; desc = "Desligar de conversas"; break;
                    case 'soon': name = "Começa em Instantes"; desc = "Contador curto final"; break;
                    case 'social': name = "Redes Sociais"; desc = "@universaljardimosasco"; break;
                    case 'donations': name = "Doações / Dízimos"; desc = "QR Code e dados PIX"; break;
                    case 'campaigns': name = "Campanhas da Igreja"; desc = "Fogueira Santa e Jejum"; break;
                    case 'world_god': name = "Universal pelo Mundo"; desc = "Fotos de templos globais"; break;
                  }
                }

                return (
                  <div
                    key={slideId}
                    onClick={() => updateStateAndBroadcast('manualSlideOverride', slideId)}
                    className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group cursor-pointer ${
                      isActive
                        ? "bg-stone-900 border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.1)]"
                        : "bg-stone-900/40 border-stone-850 hover:bg-stone-900 hover:border-stone-700"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl uppercase tracking-wider">
                        No Ar
                      </div>
                    )}
                    <h3 className={`font-bold text-sm ${isActive ? "text-yellow-500" : "text-white group-hover:text-yellow-500/80"}`}>
                      {name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">{desc}</p>
                    
                    <div className="flex items-center justify-between mt-3 text-[10px] text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-stone-800 px-2 py-1 rounded text-stone-400 text-[10px]">
                          {getSlideDuration(slideId, customMediaList) / 1000}s
                        </span>
                        {isOverridden && (
                          <span className="text-yellow-500 font-bold uppercase tracking-wider text-[9px] bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">
                            Fixo
                          </span>
                        )}
                      </div>

                      {/* Tactile slide reorder controls */}
                      <div className="flex items-center gap-1.5 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSlide(slideId, 'up');
                          }}
                          disabled={idx === 0}
                          title="Mover para Cima"
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg border text-stone-300 transition-all flex items-center justify-center cursor-pointer ${
                            idx === 0
                              ? "opacity-25 cursor-not-allowed border-stone-850 bg-stone-900/20 text-stone-600"
                              : "bg-stone-800 border-stone-700 hover:bg-stone-700 hover:border-stone-600 active:scale-90 shadow-md"
                          }`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSlide(slideId, 'down');
                          }}
                          disabled={idx === activeSlides.length - 1}
                          title="Mover para Baixo"
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg border text-stone-300 transition-all flex items-center justify-center cursor-pointer ${
                            idx === activeSlides.length - 1
                              ? "opacity-25 cursor-not-allowed border-stone-850 bg-stone-900/20 text-stone-600"
                              : "bg-stone-800 border-stone-700 hover:bg-stone-700 hover:border-stone-600 active:scale-90 shadow-md"
                          }`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GERENCIADOR DE IMAGENS E VÍDEOS */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 mb-4 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Film className="w-4 h-4 text-yellow-500" />
                  Mídias Customizadas (Fila)
                </h2>
                <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  IndexedDB Ativo
                </span>
              </div>

              {/* UPLOAD BOX */}
              <div className="relative border-2 border-dashed border-stone-850 hover:border-stone-700 rounded-xl p-4 transition-all bg-stone-950/20 text-center group cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <Plus className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-white">Clique para Adicionar Imagem ou Vídeo</p>
                    <p className="text-[10px] text-stone-500 mt-1">Imagens (JPG/PNG) ou Vídeos (MP4)</p>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center justify-center gap-2.5 text-xs text-yellow-500 bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando e salvando arquivo de mídia...</span>
                </div>
              )}

              {uploadError && (
                <div className="text-red-500 text-[11px] leading-tight bg-red-950/20 border border-red-900/30 p-3 rounded-xl text-left">
                  {uploadError}
                </div>
              )}

              {/* COMPORTAMENTO DE VÍDEO FIXO */}
              <div className="flex flex-col gap-1.5 bg-stone-950/40 p-3 rounded-xl border border-stone-850">
                <span className="text-stone-500 text-[10px] font-bold uppercase tracking-wider block text-left">Quando um vídeo estiver Fixo:</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => updateStateAndBroadcast('videoPinBehavior', 'loop')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      videoPinBehavior === 'loop'
                        ? "bg-yellow-500 text-black shadow-[0_2px_8px_rgba(234,179,8,0.15)]"
                        : "bg-stone-900 border border-stone-850 hover:border-stone-700 text-stone-300"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Repetir em Loop
                  </button>
                  <button
                    onClick={() => updateStateAndBroadcast('videoPinBehavior', 'unpin')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      videoPinBehavior === 'unpin'
                        ? "bg-yellow-500 text-black shadow-[0_2px_8px_rgba(234,179,8,0.15)]"
                        : "bg-stone-900 border border-stone-850 hover:border-stone-700 text-stone-300"
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Desafixar ao Finalizar
                  </button>
                </div>
              </div>

              {/* MEDIA LIST */}
              {customMediaList.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4 italic">Nenhuma imagem ou vídeo adicionado ainda.</p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {customMediaList.map((media, index) => {
                    const isSlideActive = currentSlideId === media.id;
                    const isSlideOverridden = manualSlideOverride === media.id;

                    return (
                      <div
                        key={media.id}
                        className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900/60 ${
                          isSlideActive
                            ? "border-yellow-500/50 shadow-[0_2px_10px_rgba(234,179,8,0.05)]"
                            : "border-stone-850"
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
                          {/* Preview / Icon */}
                          <div className="w-12 h-12 rounded-lg bg-stone-950/80 flex items-center justify-center overflow-hidden flex-shrink-0 relative border border-stone-800">
                            <div className="absolute top-0 left-0 bg-yellow-500 text-black font-extrabold text-[9px] px-1 rounded-br z-10">
                              #{index + 1}
                            </div>
                            {media.type === 'image' ? (
                              <img src={media.url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <Film className="w-5 h-5 text-yellow-500" />
                            )}
                            <div className="absolute bottom-0 right-0 bg-stone-950/80 px-1 py-0.5 text-[8px] font-bold text-stone-400 uppercase rounded-tl border-t border-l border-stone-800">
                              {media.type === 'image' ? 'Img' : 'Vid'}
                            </div>
                          </div>

                          {/* Info & Controls */}
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="text-xs font-bold text-white truncate" title={media.name}>
                              {media.name}
                            </h4>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              {/* Duration control for images, read-only for videos */}
                              {media.type === 'image' ? (
                                <div className="flex items-center gap-1 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-850">
                                  <span className="text-[10px] text-stone-500 font-medium">Tempo:</span>
                                  <span className="text-[10px] text-yellow-500 font-bold font-mono">{media.duration / 1000}s</span>
                                  <div className="flex flex-col ml-1">
                                    <button
                                      onClick={async () => {
                                        const newDur = Math.max(2000, media.duration + 1000);
                                        const dbItems = await getAllMediaItems();
                                        const target = dbItems.find(item => item.id === media.id);
                                        if (target) {
                                          target.duration = newDur;
                                          await saveMediaItem(target);
                                          updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                        }
                                      }}
                                      className="text-stone-500 hover:text-stone-300 hover:scale-110 active:scale-95 cursor-pointer leading-none"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const newDur = Math.max(2000, media.duration - 1000);
                                        const dbItems = await getAllMediaItems();
                                        const target = dbItems.find(item => item.id === media.id);
                                        if (target) {
                                          target.duration = newDur;
                                          await saveMediaItem(target);
                                          updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                        }
                                      }}
                                      className="text-stone-500 hover:text-stone-300 hover:scale-110 active:scale-95 cursor-pointer leading-none"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <div className="bg-stone-950 px-2 py-0.5 rounded border border-stone-850 text-[10px] text-stone-400 font-medium font-mono">
                                    🎬 {(media.duration / 1000).toFixed(1)}s
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const dbItems = await getAllMediaItems();
                                      const target = dbItems.find(item => item.id === media.id);
                                      if (target) {
                                        target.muted = target.muted === undefined ? false : !target.muted;
                                        await saveMediaItem(target);
                                        updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                      }
                                    }}
                                    title={media.muted ? "Ativar som para este vídeo" : "Mudar para mudo"}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                                      media.muted
                                        ? "bg-stone-950 border-stone-850 text-stone-500 hover:text-stone-350"
                                        : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/25"
                                    }`}
                                  >
                                    {media.muted ? (
                                      <>
                                        <VolumeX className="w-2.5 h-2.5" />
                                        <span>Mudo</span>
                                      </>
                                    ) : (
                                      <>
                                        <Volume2 className="w-2.5 h-2.5" />
                                        <span>Com Som</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* Enabled in loop checkbox */}
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-stone-400 select-none">
                                <input
                                  type="checkbox"
                                  checked={media.enabledInLoop}
                                  onChange={async (e) => {
                                    const dbItems = await getAllMediaItems();
                                    const target = dbItems.find(item => item.id === media.id);
                                    if (target) {
                                      target.enabledInLoop = e.target.checked;
                                      await saveMediaItem(target);
                                      updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                    }
                                  }}
                                  className="rounded border-stone-800 bg-stone-950 text-yellow-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                                />
                                <span>Fila Automática</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons - Spacious touch-targets for mobile, neat on desktop */}
                        <div className="flex gap-2 w-full md:w-auto justify-end border-t border-stone-850/60 md:border-t-0 pt-3 md:pt-0">
                          <button
                            onClick={() => handleMoveMedia(media.id, 'up')}
                            disabled={index === 0}
                            title="Mover para Cima"
                            className={`w-9 h-9 md:w-7.5 md:h-7.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                              index === 0
                                ? "bg-stone-900/40 text-stone-700 border-stone-850 cursor-not-allowed opacity-30"
                                : "bg-stone-800 border-stone-700 hover:bg-stone-750 text-stone-300 hover:text-white"
                            }`}
                          >
                            <ArrowUp className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleMoveMedia(media.id, 'down')}
                            disabled={index === customMediaList.length - 1}
                            title="Mover para Baixo"
                            className={`w-9 h-9 md:w-7.5 md:h-7.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                              index === customMediaList.length - 1
                                ? "bg-stone-900/40 text-stone-700 border-stone-850 cursor-not-allowed opacity-30"
                                : "bg-stone-800 border-stone-700 hover:bg-stone-750 text-stone-300 hover:text-white"
                            }`}
                          >
                            <ArrowDown className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              updateStateAndBroadcast('manualSlideOverride', isSlideOverridden ? null : media.id);
                            }}
                            title={isSlideOverridden ? "Voltar ao Automático" : "Projetar esta mídia agora"}
                            className={`w-9 h-9 md:w-7.5 md:h-7.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                              isSlideOverridden
                                ? "bg-yellow-500 border-yellow-500 text-black hover:bg-yellow-600"
                                : "bg-stone-800 border-stone-700 hover:bg-stone-750 text-yellow-500 hover:text-yellow-400"
                            }`}
                          >
                            <Send className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          </button>
                          
                          <button
                            onClick={async () => {
                              if (confirm(`Tem certeza que deseja excluir "${media.name}"?`)) {
                                if (currentSlideId === media.id || manualSlideOverride === media.id) {
                                  updateStateAndBroadcast('manualSlideOverride', null);
                                }
                                await deleteMediaItem(media.id);
                                updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                              }
                            }}
                            title="Excluir Mídia"
                            className="w-9 h-9 md:w-7.5 md:h-7.5 bg-stone-800 border border-stone-700 hover:bg-red-950/40 text-stone-400 hover:text-red-500 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GERENCIADOR DE VERSÍCULOS E MENSAGENS CUSTOMIZADAS */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 mt-1 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-yellow-500" />
                  Controle de Versículos e Textos
                </h2>
                
                {(activeVerseIndex !== null || customVerseText) && (
                  <button
                    onClick={() => {
                      updateStateAndBroadcast('activeVerseIndex', null);
                      updateStateAndBroadcast('customVerseText', null);
                      updateStateAndBroadcast('customVerseRef', null);
                    }}
                    className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 hover:bg-yellow-500/20 transition-all cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Resetar Versículo
                  </button>
                )}
              </div>

              {/* Status information */}
              <div className="text-xs border-b border-stone-850/50 pb-3">
                {customVerseText ? (
                  <div>
                    <span className="text-stone-500">Exibindo Texto Livre:</span>
                    <p className="font-bold text-yellow-500 italic mt-0.5">"{customVerseText}"</p>
                    <p className="text-stone-400 text-[10px] mt-0.5">— {customVerseRef || "Sem ref"}</p>
                  </div>
                ) : activeVerseIndex !== null ? (
                  <div>
                    <span className="text-stone-500">Exibindo Versículo Fixo ({activeVerseIndex + 1}/{VERSES.length}):</span>
                    <p className="font-bold text-yellow-500 italic mt-0.5">"{VERSES[activeVerseIndex].text}"</p>
                    <p className="text-stone-400 text-[10px] mt-0.5">— {VERSES[activeVerseIndex].ref}</p>
                  </div>
                ) : (
                  <span className="text-stone-500 font-medium">🔄 Versículos rotacionando automaticamente de 15 em 15 segundos.</span>
                )}
              </div>

              {/* SHUFFLE BUTTON AND AUTOMATIC TOGGLE */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const randomIdx = Math.floor(Math.random() * VERSES.length);
                    updateStateAndBroadcast('customVerseText', null);
                    updateStateAndBroadcast('customVerseRef', null);
                    updateStateAndBroadcast('activeVerseIndex', randomIdx);
                  }}
                  className="bg-stone-900 border border-stone-850 hover:border-stone-700 hover:bg-stone-850 text-stone-200 text-xs font-bold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Shuffle className="w-4 h-4 text-yellow-500" />
                  Embaralhar Versículo
                </button>
                
                <button
                  onClick={() => {
                    updateStateAndBroadcast('activeVerseIndex', null);
                    updateStateAndBroadcast('customVerseText', null);
                    updateStateAndBroadcast('customVerseRef', null);
                  }}
                  disabled={activeVerseIndex === null && !customVerseText}
                  className={`border text-xs font-bold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all ${
                    activeVerseIndex === null && !customVerseText
                      ? "bg-stone-950 border-stone-900 text-stone-600 cursor-not-allowed"
                      : "bg-stone-900 border-stone-850 hover:border-stone-700 hover:bg-stone-850 text-stone-200"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-500" />
                  Voltar ao Automático
                </button>
              </div>

              {/* BÍBLIA SECTION */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">Versículos Favoritos (Selecionar)</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1 border border-stone-850/60 bg-stone-950/40 p-2 rounded-xl">
                    {VERSES.map((verse, idx) => {
                      const isSelected = activeVerseIndex === idx && !customVerseText;
                      return (
                        <button
                          key={idx}
                          title={verse.ref}
                          onClick={() => {
                            updateStateAndBroadcast('customVerseText', null);
                            updateStateAndBroadcast('customVerseRef', null);
                            updateStateAndBroadcast('activeVerseIndex', idx);
                          }}
                          className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? "bg-yellow-500 text-black font-black scale-105 shadow-[0_2px_8px_rgba(234,179,8,0.25)]"
                              : "bg-stone-900 text-stone-300 border border-stone-850 hover:bg-stone-800 hover:text-white"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <BibleSection 
                  onShowVerse={(text, ref) => {
                    updateStateAndBroadcast('activeVerseIndex', null);
                    updateStateAndBroadcast('customVerseText', text);
                    updateStateAndBroadcast('customVerseRef', ref);
                  }} 
                />
              </div>

              {/* CUSTOM TEXT TRANSMITTER FORM */}
              <div className="border-t border-stone-850 pt-4 flex flex-col gap-3">
                <div>
                  <label className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">Projetar Texto / Versículo Personalizado</label>
                  <textarea
                    id="operator-custom-verse-textarea"
                    placeholder="Digite qualquer texto para projetar imediatamente..."
                    rows={2}
                    className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-700 font-sans resize-none"
                  />
                </div>
                
                <div className="flex gap-2">
                  <input
                    id="operator-custom-verse-ref"
                    type="text"
                    placeholder="Referência (ex: João 3:16)"
                    className="flex-1 bg-stone-900 border border-stone-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-700 font-sans"
                  />
                  <button
                    onClick={() => {
                      const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
                      const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
                      if (textEl && textEl.value.trim()) {
                        updateStateAndBroadcast('activeVerseIndex', null);
                        updateStateAndBroadcast('customVerseText', textEl.value.trim());
                        updateStateAndBroadcast('customVerseRef', refEl.value.trim() || null);
                      }
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" /> Projetar
                  </button>
                  {customVerseText && (
                    <button
                      onClick={() => {
                        const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
                        const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
                        if (textEl) textEl.value = "";
                        if (refEl) refEl.value = "";
                        updateStateAndBroadcast('customVerseText', null);
                        updateStateAndBroadcast('customVerseRef', null);
                      }}
                      className="bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE: TIMERS & ALERTS */}
          <div className={`flex-1 bg-[#090909] p-4 lg:p-6 overflow-y-auto flex flex-col gap-6 ${activeMobileTab === 'controls' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* CONTROLE DE PROJEÇÃO */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Tv className="w-4.5 h-4.5 text-yellow-500" />
                Ações Rápidas de Projeção (2ª Tela)
              </h2>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-2 col-span-2">
                  {!projectionWin || projectionWin.closed ? (
                    <button
                      onClick={async () => {
                        const projectionUrl = `${window.location.origin}${window.location.pathname}?projection`;
                        
                        let newWin: Window | null = null;
                        
                        // Abre a janela na tela atual
                        newWin = window.open(projectionUrl, 'holyrics_projection', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
                        setProjectionWin(newWin);
                      }}
                      className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl border border-blue-400/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir Monitor (Para enviar à 2ª Tela)
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (projectionWin) {
                          projectionWin.close();
                          setProjectionWin(null);
                        }
                      }}
                      className="w-full p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl border border-red-400/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                      <X className="w-4 h-4" />
                      Fechar Monitor Externo
                    </button>
                  )}
                </div>

                <button
                  onClick={() => updateStateAndBroadcast('blackoutEnabled', !blackoutEnabled)}
                  className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    blackoutEnabled
                      ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                      : "bg-stone-900 border-stone-850 text-stone-300 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <EyeOff className={`w-6 h-6 ${blackoutEnabled ? "animate-pulse text-white" : "text-stone-400"}`} />
                  <div className="text-center">
                    <p className="font-bold text-xs sm:text-sm">{blackoutEnabled ? "Tela Preta Ativa" : "Tela Preta"}</p>
                    <p className="text-[9px] sm:text-[10px] text-stone-400 font-normal mt-0.5">Oculta toda a saída HDMI</p>
                  </div>
                </button>

                <button
                  onClick={() => updateStateAndBroadcast('clearContentEnabled', !clearContentEnabled)}
                  className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    clearContentEnabled
                      ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                      : "bg-stone-900 border-stone-850 text-stone-300 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <Sparkles className={`w-6 h-6 ${clearContentEnabled ? "text-black" : "text-stone-400"}`} />
                  <div className="text-center">
                    <p className="font-bold text-xs sm:text-sm">{clearContentEnabled ? "Slides Ocultados" : "Limpar Slide"}</p>
                    <p className="text-[9px] sm:text-[10px] text-stone-400 font-normal mt-0.5">Mantém apenas o fundo</p>
                  </div>
                </button>
              </div>
            </div>
            
            {/* TIMERS SECTION */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5">
              <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider mb-3">Cronômetro de Reunião</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 sm:items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 font-medium">Horário da Próxima Reunião:</p>
                  <p className="text-sm sm:text-lg font-bold text-white mt-1 leading-snug">
                    <span className="text-yellow-500">{nextMeeting.dayName}</span> às {nextMeeting.time} — <span className="text-stone-300 font-normal">{nextMeeting.theme}</span>
                  </p>
                </div>
                
                <div className="text-center bg-[#1a1a1a] border border-stone-800 px-6 py-3 rounded-xl w-full sm:w-auto sm:min-w-[150px]">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tempo Restante</p>
                  <p className="text-3xl font-mono font-black text-yellow-500 tracking-wider mt-0.5">
                    {hoursStr}:{minutesStr}
                  </p>
                </div>
              </div>

              {/* TIMER ACTIONS */}
              <div className="grid grid-cols-4 gap-2 mt-5">
                <button
                  onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 60 * 1000)}
                  className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 1 min
                </button>
                <button
                  onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset + 5 * 60 * 1000)}
                  className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 5 min
                </button>
                <button
                  onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 60 * 1000)}
                  className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" /> 1 min
                </button>
                <button
                  onClick={() => updateStateAndBroadcast('countdownOffset', countdownOffset - 5 * 60 * 1000)}
                  className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" /> 5 min
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => {
                    if (countdownPaused) {
                      const currentDiffMs = nextMeetingDate.getTime() - new Date().getTime();
                      const currentDiffSec = Math.floor(currentDiffMs / 1000);
                      const targetDiffSec = pausedSeconds || 0;
                      const secondsToAdjust = targetDiffSec - currentDiffSec;
                      updateStateAndBroadcast('countdownOffset', secondsToAdjust * 1000);
                      updateStateAndBroadcast('countdownPaused', false);
                      updateStateAndBroadcast('pausedSeconds', null);
                    } else {
                      updateStateAndBroadcast('countdownPaused', true);
                      updateStateAndBroadcast('pausedSeconds', diffSeconds);
                    }
                  }}
                  className={`text-xs font-bold py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all ${
                    countdownPaused 
                      ? "bg-green-500 hover:bg-green-600 text-black shadow-[0_4px_12px_rgba(34,197,94,0.15)]" 
                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10"
                  }`}
                >
                  {countdownPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {countdownPaused ? "Retomar Contagem" : "Pausar Contagem"}
                </button>
                
                <button
                  onClick={() => {
                    updateStateAndBroadcast('countdownOffset', 0);
                    updateStateAndBroadcast('countdownPaused', false);
                    updateStateAndBroadcast('pausedSeconds', null);
                  }}
                  className="bg-[#1a1a1a] hover:bg-stone-800 text-stone-300 text-xs font-bold py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2 border border-stone-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resetar Ajustes
                </button>
              </div>
            </div>

            {/* ALERTS SECTION */}
            <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider">Disparador de Alertas Visuais</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateStateAndBroadcast('activeAlert', activeAlert === 'baby' ? null : 'baby')}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeAlert === 'baby'
                      ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_4px_15px_rgba(234,179,8,0.25)]"
                      : "bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {ALERTS.baby.buttonTitle}
                </button>
                <button
                  onClick={() => updateStateAndBroadcast('activeAlert', activeAlert === 'car' ? null : 'car')}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                    activeAlert === 'car'
                      ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_4px_15px_rgba(234,179,8,0.25)]"
                      : "bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-900/80"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {ALERTS.car.buttonTitle}
                </button>
              </div>

              {/* CUSTOM ALERT INPUT */}
              <div className="border-t border-stone-800/80 pt-4 mt-1">
                <label className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">Alerta Personalizado</label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = (form.elements.namedItem('customAlertText') as HTMLInputElement);
                    if (input.value.trim()) {
                      updateStateAndBroadcast('activeAlert', input.value.trim());
                      input.value = "";
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="customAlertText"
                    placeholder="Ex: Mãe da Sofia comparecer à EBI..."
                    className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-stone-600 font-sans"
                  />
                  <button
                    type="submit"
                    className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar
                  </button>
                </form>
              </div>

              {activeAlert && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between text-yellow-500 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                    <span className="text-left leading-snug">
                      <strong>Alerta Ativo:</strong> {activeAlert === 'baby' ? ALERTS.baby.message : activeAlert === 'car' ? ALERTS.car.message : activeAlert}
                    </span>
                  </div>
                  <button
                    onClick={() => updateStateAndBroadcast('activeAlert', null)}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 p-1.5 rounded-full text-yellow-500 transition-colors cursor-pointer ml-3 flex-shrink-0"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </div>

            {/* SEÇÃO DE BACKUP & SINCRONIZAÇÃO */}
            <SyncSection />

          </div>

          {/* RIGHT: MINIATURE SCREEN PREVIEW */}
          <div className={`w-full lg:w-[32%] border-t lg:border-t-0 lg:border-l border-stone-800 bg-[#080808] p-4 lg:p-6 flex flex-col gap-4 overflow-y-auto ${activeMobileTab === 'monitor' ? 'flex' : 'hidden lg:flex'}`}>
            <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4 text-yellow-500" />
              Monitor de Transmissão
            </h2>

            <div 
              ref={monitorContainerRef}
              className="w-full aspect-video bg-black border border-stone-800 rounded-xl overflow-hidden relative shadow-2xl"
            >
              <div 
                className="absolute origin-top-left pointer-events-none"
                style={{
                  width: '1920px',
                  height: '1080px',
                  transform: `scale(${monitorScale})`
                }}
              >
                <ProjectionContent
                  currentTime={currentTime}
                  isLooping={isLooping}
                  isFinalFiveMinutes={isFinalFiveMinutes}
                  isFinalMinute={isFinalMinute}
                  isJustStarted={isJustStartedRaw}
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
                />
              </div>
            </div>

              <p className="text-xs text-stone-500 leading-relaxed mt-2 border-t border-stone-850 pt-4">
                <strong>Guia de Transmissão:</strong>
                <br />
                1. Conecte o projetor ou TV na saída HDMI da sua máquina.
                <br />
                2. Use o botão <strong>"Abrir Monitor na 2ª Tela"</strong> acima. O sistema tentará detectar seu monitor HDMI automaticamente.
                <br />
                3. Na janela que abrir na TV, clique em qualquer lugar para ativar a <strong>Tela Cheia</strong> automática.
                <br />
                4. Use este painel para monitorar, trocar slides e disparar alertas instantâneos!
              </p>
          </div>

        </div>
      </div>
    );
  }

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
          // Fallback
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }}
      className={`w-screen h-screen bg-black overflow-hidden relative select-none font-sans flex items-center justify-center ${isCurrentlyFullscreen ? 'cursor-none' : 'cursor-pointer'}`}
    >
      
      {!isCurrentlyFullscreen && (
        <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-10 text-center animate-in fade-in duration-500">
          <div className="bg-yellow-500 text-black p-6 rounded-full mb-6 shadow-[0_0_50px_rgba(234,179,8,0.4)] animate-bounce">
            <Maximize className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Clique para Enviar à 2ª Tela</h2>
          <p className="text-stone-300 text-xl font-medium">Ele detectará o projetor/TV automaticamente e ficará em tela cheia.</p>
        </div>
      )}
      
      {/* MAIN 16:9 SCREEN FRAME */}
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
          isJustStarted={isJustStartedRaw}
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
          onVideoEnded={() => {
            if (manualSlideOverride && videoPinBehavior === 'unpin') {
              updateStateAndBroadcast('manualSlideOverride', null);
            }
          }}
        />
      </div>

      {/* HIDDEN PRELOAD CONTAINER FOR IMAGES AND VIDEOS */}
      <div className="hidden absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {customMediaList.map((media) => {
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
        <div className="absolute top-6 left-6 z-50 bg-black/95 text-white border border-stone-800 rounded-xl px-5 py-3 text-sm flex items-center gap-2 font-medium pointer-events-none tracking-wide shadow-xl backdrop-blur-md animate-pulse">
          <Tv className="w-5 h-5 text-yellow-500" />
          <span>📺 Modo Widescreen Bloqueado. Deite a tela.</span>
        </div>
      )}

      {/* FULLSCREEN FLOATING TOGGLE BUTTON */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-6 right-6 z-50 bg-black/80 hover:bg-black/95 text-white border border-stone-800 hover:border-stone-600 rounded-full p-4 shadow-xl backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-2 group lg:hidden"
        aria-label="Alternar Tela Cheia"
      >
        {isFullscreen ? (
          <Minimize className="w-6 h-6 text-yellow-500" />
        ) : (
          <Maximize className="w-6 h-6 text-yellow-500" />
        )}
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap text-stone-200 text-sm font-semibold pr-0 group-hover:pr-2">
          {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        </span>
      </button>

    </div>
  );
}
