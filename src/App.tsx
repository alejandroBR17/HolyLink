import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Monitor, Smartphone, RefreshCw, Layout, BookOpen, 
  CalendarDays, Settings, ExternalLink, Plus, EyeOff, 
  Sparkles, Maximize, Minimize, Flame, Trash2, Edit2, X, Film, Volume2, VolumeX, ArrowUp, ArrowDown, Send
} from 'lucide-react';
import { CHURCH_INFO, ALERTS, VERSES, CAMPAIGNS, MEETINGS } from './data';
import { getNextMeeting, saveMediaItem, getAllMediaItems, deleteMediaItem, getSlideDuration } from './utils';
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

interface CustomMedia {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number;
  enabledInLoop: boolean;
  url: string;
  muted?: boolean;
  order?: number;
  fit?: 'contain' | 'cover' | 'fill';
}

export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [manualRotateMode, setManualRotateMode] = useState<'auto' | 'force-landscape'>('auto');

  // Electron Detection & Window Toggle States
  const [isProjectionWindowShowing, setIsProjectionWindowShowing] = useState(true);
  const ipcRendererRef = useRef<any>(null);
  const projectionWinRef = useRef<Window | null>(null);

  const setProjectionWin = useCallback((win: Window | null) => {
    if (win === null && projectionWinRef.current) {
      try {
        if (!projectionWinRef.current.closed) {
          projectionWinRef.current.close();
        }
      } catch (e) {
        // Safe catch for cross-origin or closed window
      }
    }
    projectionWinRef.current = win;
  }, []);

  const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');

  // Monitor if window is closed
  useEffect(() => {
    const timer = setInterval(() => {
      if (projectionWinRef.current) {
        try {
          if (projectionWinRef.current.closed) {
            projectionWinRef.current = null;
            updateStateAndBroadcast('isProjectionOpen', false);
          }
        } catch (e) {
          // Cross-origin access error fallback
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // State Persistence from LocalStorage or Fallbacks
  const [manualSlideOverride, setManualSlideOverride] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_manualSlideOverride');
  });

  const [slidesOrder, setSlidesOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('projection_slidesOrder');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [customVerseText, setCustomVerseText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('projection_customVerseText') || '';
  });

  const [customVerseRef, setCustomVerseRef] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('projection_customVerseRef') || '';
  });

  const [activeVerseIndex, setActiveVerseIndex] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem('projection_activeVerseIndex');
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

  const [pausedSeconds, setPausedSeconds] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem('projection_pausedSeconds');
    return val ? parseInt(val, 10) : null;
  });

  const [countdownPaused, setCountdownPaused] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_countdownPaused') === 'true';
  });

  const [countdownOffset, setCountdownOffset] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem('projection_countdownOffset') || '0', 10);
  });

  const [dismissedJustStarted, setDismissedJustStarted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_dismissedJustStarted') === 'true';
  });

  const [videoPinBehavior, setVideoPinBehavior] = useState<'unpin' | 'loop'>(() => {
    if (typeof window === 'undefined') return 'unpin';
    return (localStorage.getItem('projection_videoPinBehavior') as 'unpin' | 'loop') || 'unpin';
  });

  const [carouselStartTimeOffset, setCarouselStartTimeOffset] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem('projection_carouselStartTimeOffset') || '0', 10);
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

  const showConfirm = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'info' = 'info') => {
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
  };

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

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastConfig({
      isVisible: true,
      message,
      type
    });
  };

  const [customMeetings, setCustomMeetings] = useState<Meeting[]>(() => {
    if (typeof window === 'undefined') return MEETINGS;
    const val = localStorage.getItem('projection_customMeetings');
    if (val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        console.error(e);
      }
    }
    return MEETINGS;
  });

  const [editingMeetId, setEditingMeetId] = useState<string | null>(null);

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    return parseFloat(localStorage.getItem('projection_volume') || '1');
  });


  const [tickerText, setTickerText] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_tickerText');
  });

  const [syncStatus, setSyncStatus] = useState<{ active: boolean; message: string; progress?: number } | null>(null);

  const [customCampaigns, setCustomCampaigns] = useState<any[]>(() => {
    if (typeof window === 'undefined') return CAMPAIGNS;
    const val = localStorage.getItem('projection_customCampaigns');
    if (val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        console.error(e);
      }
    }
    return CAMPAIGNS;
  });

  // UI States for Dynamic Management Panels
  const [isProjectionOpen, setIsProjectionOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('projection_isProjectionOpen') === 'true';
  });

  const [projectionCloseTrigger, setProjectionCloseTrigger] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_projectionCloseTrigger');
  });


  const [mediaUpdateTrigger, setMediaUpdateTrigger] = useState<string>(() => {
    if (typeof window === 'undefined') return '0';
    return localStorage.getItem('projection_mediaUpdateTrigger') || '0';
  });

  const [customMediaList, setCustomMediaList] = useState<CustomMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSmartBooting, setIsSmartBooting] = useState<boolean>(true);

  // Load custom media files from DB on trigger or mount
  useEffect(() => {
    let active = true;
    const loadMedia = async () => {
      try {
        const items = await getAllMediaItems();
        if (!active) return;
        
        setCustomMediaList((prevList) => {
          prevList.forEach((m) => {
            if (m.url && m.url.startsWith('blob:')) {
              URL.revokeObjectURL(m.url);
            }
          });
          
          const sortedItems = [...items].sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            
            const aMatch = a.id.match(/\d+$/);
            const bMatch = b.id.match(/\d+$/);
            if (aMatch && bMatch) {
              return parseInt(aMatch[0], 10) - parseInt(bMatch[0], 10);
            }
            return a.id.localeCompare(b.id);
          });

          return sortedItems.map((item) => {
            let itemUrl = '';
            if (item.blob instanceof Blob) {
              try {
                itemUrl = URL.createObjectURL(item.blob);
              } catch (e) {
                console.error("Error creating Object URL for item:", item.id, e);
              }
            } else if (item.blob && typeof item.blob === 'object') {
              try {
                const anyBlob = item.blob as any;
                if (anyBlob.buffer && (anyBlob.buffer instanceof ArrayBuffer || anyBlob.buffer instanceof Uint8Array)) {
                  const b = new Blob([anyBlob.buffer], { type: anyBlob.type || 'application/octet-stream' });
                  itemUrl = URL.createObjectURL(b);
                } else if (anyBlob.bytes) {
                  const b = new Blob([anyBlob.bytes], { type: anyBlob.type || 'application/octet-stream' });
                  itemUrl = URL.createObjectURL(b);
                }
              } catch (e) {
                console.error("Error reconstructing blob for item:", item.id, e);
              }
            }

            return {
              id: item.id,
              type: item.type,
              name: item.name,
              duration: item.duration,
              enabledInLoop: item.enabledInLoop,
              url: itemUrl,
              muted: item.muted !== undefined ? item.muted : true,
              order: item.order,
              fit: item.fit
            };
          });
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

  // Preload upcoming slides into memory for smooth transmission & prune stale cache
  useEffect(() => {
    if (customMediaList.length > 0) {
      const validUrls = new Set(customMediaList.map(m => m.url).filter(Boolean));
      mediaPreloader.pruneUnused(validUrls);

      const activeSlideId = manualSlideOverride || slidesOrder[0] || 'agenda_day_0';
      mediaPreloader.preloadSlideSequence(activeSlideId, slidesOrder, customMediaList);
    }
  }, [manualSlideOverride, slidesOrder, customMediaList]);

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
      let duration = 10000;

      if (isVideo) {
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
            resolve(10000);
          };
        });
      }

      const currentItems = await getAllMediaItems();
      const maxOrder = currentItems.reduce((max, item) => Math.max(max, item.order ?? 0), -1);
      const order = maxOrder + 1;

      const id = `custom_${isVideo ? 'vid' : 'img'}_${Date.now()}`;
      const mediaItemPayload = {
        id,
        type: (isVideo ? 'video' : 'image') as 'video' | 'image',
        name: file.name,
        duration,
        enabledInLoop: true,
        blob: file,
        muted: isVideo ? true : undefined,
        order
      };
      await saveMediaItem(mediaItemPayload);
      broadcastMediaSave(mediaItemPayload);

      updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
    } catch (err: any) {
      console.error("Error saving uploaded file:", err);
      setUploadError("Não foi possível salvar o arquivo. Limite de armazenamento pode ter sido excedido.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleMoveMedia = async (mediaId: string, direction: 'up' | 'down') => {
    try {
      const items = await getAllMediaItems();
      
      const sortedItems = [...items].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        
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
        const temp = sortedItems[idx];
        sortedItems[idx] = sortedItems[idx - 1];
        sortedItems[idx - 1] = temp;
      } else if (direction === 'down' && idx < sortedItems.length - 1) {
        const temp = sortedItems[idx];
        sortedItems[idx] = sortedItems[idx + 1];
        sortedItems[idx + 1] = temp;
      } else {
        return;
      }

      for (let i = 0; i < sortedItems.length; i++) {
        sortedItems[i].order = i;
        await saveMediaItem(sortedItems[i]);
        broadcastMediaSave(sortedItems[i]);
      }

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
    const nextMeetingDateObj = getNextMeeting(new Date(), customMeetings).nextMeetingDate;
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
    if (key === 'advanceToSlide') {
      const targetSlideId = value;
      const baseActive: SlideType[] = [...DEFAULT_SLIDES];
      customMediaList.forEach((media) => {
        if (media.enabledInLoop) baseActive.push(media.id);
      });
      customMeetings.forEach((meet) => {
        if (meet.date) baseActive.push(`meeting_event_${meet.id}`);
      });
      if (diffSeconds <= 15 * 60) baseActive.push('soon');

      let currentActiveSlides = slidesOrder.filter((id) => baseActive.includes(id));
      baseActive.forEach((id) => {
        if (!currentActiveSlides.includes(id)) currentActiveSlides.push(id);
      });

      if (currentActiveSlides.length > 0) {
        const targetIndex = currentActiveSlides.indexOf(targetSlideId);
        if (targetIndex !== -1) {
          let targetAccumulatedTime = 0;
          for (let i = 0; i < targetIndex; i++) {
            targetAccumulatedTime += getSlideDuration(currentActiveSlides[i], customMediaList);
          }
          const now = Date.now();
          const newOffset = now - targetAccumulatedTime;
          updateStateAndBroadcast('carouselStartTimeOffset', newOffset);
        }
      }
      updateStateAndBroadcast('manualSlideOverride', null);
      return;
    }

    if (value === null || value === undefined) {
      localStorage.removeItem(`projection_${key}`);
    } else {
      const stringValue = (typeof value === 'object') ? JSON.stringify(value) : value.toString();
      localStorage.setItem(`projection_${key}`, stringValue);
    }

    if (key === 'manualSlideOverride') setManualSlideOverride(value);
    else if (key === 'countdownOffset') setCountdownOffset(value);
    else if (key === 'countdownPaused') setCountdownPaused(value);
    else if (key === 'pausedSeconds') setPausedSeconds(value);
    else if (key === 'activeAlert') setActiveAlert(value);
    else if (key === 'blackoutEnabled') setBlackoutEnabled(value === 'true' || value === true);
    else if (key === 'clearContentEnabled') setClearContentEnabled(value === 'true' || value === true);
    else if (key === 'volume') {
      const parsed = parseFloat(value.toString());
      if (!isNaN(parsed)) {
        const clamped = Math.max(0, Math.min(1, parsed));
        setVolume(prev => (Math.abs(prev - clamped) < 0.001 ? prev : clamped));
      }
    }
    else if (key === 'tickerText') setTickerText(value);
    else if (key === 'activeVerseIndex') setActiveVerseIndex(value !== null ? parseInt(value, 10) : null);
    else if (key === 'customVerseText') setCustomVerseText(value);
    else if (key === 'customVerseRef') setCustomVerseRef(value);
    else if (key === 'dismissedJustStarted') setDismissedJustStarted(value === 'true' || value === true);
    else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(value);
    else if (key === 'videoPinBehavior') setVideoPinBehavior(value);
    else if (key === 'carouselStartTimeOffset') setCarouselStartTimeOffset(value ? parseInt(value.toString(), 10) : 0);
    else if (key === 'isProjectionOpen') setIsProjectionOpen(value === 'true' || value === true);
    else if (key === 'projectionCloseTrigger') {
      setProjectionCloseTrigger(value);
      if (value) {
        if (projectionWinRef.current) {
          try {
            projectionWinRef.current.close();
          } catch (e) {
            console.warn("Failed to close projectionWin:", e);
          }
          setProjectionWin(null);
        }
        if (isProjectionView) {
          try {
            window.close();
          } catch (e) {
            console.warn("Failed to window.close():", e);
          }
        }
      }
    }
    else if (key === 'customMeetings') {
      try {
        setCustomMeetings(typeof value === 'string' ? JSON.parse(value) : value);
      } catch (e) {
        console.error(e);
      }
    }
    else if (key === 'customCampaigns') {
      try {
        setCustomCampaigns(typeof value === 'string' ? JSON.parse(value) : value);
      } catch (e) {
        console.error(e);
      }
    }
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
      // Fallback
    }

    const peerConn = (window as any).holyrics_peer_conn;
    if (peerConn && peerConn.open) {
      peerConn.send({ type: 'UPDATE_STATE', key, value, version: 1 });
    }
  };

  const broadcastMediaSave = async (item: any) => {
    const peerConn = (window as any).holyrics_peer_conn;
    if (peerConn && peerConn.open) {
      try {
        // If the item doesn't have a blob, load it from IndexedDB
        let blobToUse = item.blob;
        if (!blobToUse) {
          const dbItems = await getAllMediaItems();
          const found = dbItems.find(m => m.id === item.id);
          if (found && found.blob) {
            blobToUse = found.blob;
          }
        }

        // Convert any representation to a real Blob object
        let realBlob: Blob | null = null;
        if (blobToUse instanceof Blob) {
          realBlob = blobToUse;
        } else if (blobToUse && typeof blobToUse === 'object') {
          const anyBlob = blobToUse as any;
          if (anyBlob.buffer && (anyBlob.buffer instanceof ArrayBuffer || anyBlob.buffer instanceof Uint8Array || Array.isArray(anyBlob.buffer))) {
            realBlob = new Blob([anyBlob.buffer], { type: anyBlob.type || 'application/octet-stream' });
          } else if (anyBlob.bytes && (anyBlob.bytes instanceof ArrayBuffer || anyBlob.bytes instanceof Uint8Array || Array.isArray(anyBlob.bytes))) {
            realBlob = new Blob([anyBlob.bytes], { type: anyBlob.type || 'application/octet-stream' });
          } else if (anyBlob.blob && anyBlob.blob instanceof Blob) {
            realBlob = anyBlob.blob;
          }
        }

        let base64: string | undefined = undefined;
        let mimeType = 'application/octet-stream';

        if (realBlob) {
          mimeType = realBlob.type || 'application/octet-stream';
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = reject;
            reader.readAsDataURL(realBlob!);
          });
        }

        peerConn.send({
          type: 'MEDIA_SAVE',
          mediaItem: {
            id: item.id,
            type: item.type,
            name: item.name,
            duration: item.duration,
            enabledInLoop: item.enabledInLoop,
            muted: item.muted,
            order: item.order,
            fit: item.fit,
            mimeType,
            base64
          },
          version: 1
        });
      } catch (e) {
        console.error("Erro ao transmitir salvamento de mídia:", e);
      }
    }
  };

  const broadcastMediaDelete = (id: string) => {
    const peerConn = (window as any).holyrics_peer_conn;
    if (peerConn && peerConn.open) {
      peerConn.send({
        type: 'MEDIA_DELETE',
        id,
        version: 1
      });
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
      console.warn("BroadcastChannel not supported. Using localStorage fallback.");
    }

    const handleError = (event: ErrorEvent) => {
      const msg = event.message || (event.error && event.error.message) || '';
      // Ignore peer/WebRTC, cross-origin SecurityError, $$typeof, or React internal work loop noise
      if (
        msg.includes('peer') || 
        msg.includes('WebRTC') || 
        msg.includes('socket') || 
        msg.includes('$$typeof') || 
        msg.includes('Blocked a frame') || 
        msg.includes('SecurityError') || 
        msg.includes('Should not already be working') ||
        msg.includes('ResizeObserver')
      ) {
        return;
      }
      console.error("Erro capturado globalmente:", event.error || event.message);
      setTimeout(() => {
        showAlert(`Aviso: ${msg || 'Ocorreu um erro inesperado'}`, 'error');
      }, 0);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg = event.reason?.message || event.reason || '';
      const strMsg = reasonMsg.toString();
      if (
        strMsg.includes('peer') || 
        strMsg.includes('WebRTC') || 
        strMsg.includes('$$typeof') ||
        strMsg.includes('SecurityError') ||
        strMsg.includes('Blocked a frame') ||
        strMsg.includes('Should not already be working')
      ) {
        return;
      }
      console.error("Promise rejeitada sem tratamento:", event.reason);
      setTimeout(() => {
        showAlert(`Falha de processamento: ${reasonMsg || 'Erro desconhecido'}`, 'error');
      }, 0);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    const updateStateLocalOnly = (key: string, value: any) => {
      const stringValue = (value === null || value === undefined) ? null : (typeof value === 'object' ? JSON.stringify(value) : value.toString());
      if (localStorage.getItem(`projection_${key}`) !== stringValue) {
        if (stringValue === null) {
          localStorage.removeItem(`projection_${key}`);
        } else {
          localStorage.setItem(`projection_${key}`, stringValue);
        }
      }

      if (key === 'manualSlideOverride') setManualSlideOverride(value);
      else if (key === 'countdownOffset') setCountdownOffset(value !== null ? parseInt(value.toString(), 10) : 0);
      else if (key === 'countdownPaused') setCountdownPaused(value === 'true' || value === true);
      else if (key === 'pausedSeconds') setPausedSeconds(value !== null ? parseInt(value.toString(), 10) : null);
      else if (key === 'activeAlert') setActiveAlert(value);
      else if (key === 'blackoutEnabled') setBlackoutEnabled(value === 'true' || value === true);
      else if (key === 'clearContentEnabled') setClearContentEnabled(value === 'true' || value === true);
      else if (key === 'volume') {
        const parsed = parseFloat(value.toString());
        if (!isNaN(parsed)) {
          const clamped = Math.max(0, Math.min(1, parsed));
          setVolume(prev => (Math.abs(prev - clamped) < 0.001 ? prev : clamped));
        }
      }
      else if (key === 'activeVerseIndex') setActiveVerseIndex(value !== null ? parseInt(value.toString(), 10) : null);
      else if (key === 'customVerseText') setCustomVerseText(value);
      else if (key === 'customVerseRef') setCustomVerseRef(value);
      else if (key === 'dismissedJustStarted') setDismissedJustStarted(value === 'true' || value === true);
      else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(value);
      else if (key === 'videoPinBehavior') setVideoPinBehavior(value);
      else if (key === 'carouselStartTimeOffset') setCarouselStartTimeOffset(value !== null ? parseInt(value.toString(), 10) : 0);
      else if (key === 'isProjectionOpen') setIsProjectionOpen(value === 'true' || value === true);
      else if (key === 'projectionCloseTrigger') {
        setProjectionCloseTrigger(value);
        if (value) {
          if (projectionWinRef.current) {
            try {
              projectionWinRef.current.close();
            } catch (e) {
              console.warn("Failed to close projectionWin:", e);
            }
            setProjectionWin(null);
          }
          if (isProjectionView) {
            try {
              window.close();
            } catch (e) {
              console.warn("Failed to window.close():", e);
            }
          }
        }
      }
      else if (key === 'customMeetings') {
        try {
          setCustomMeetings(value ? (typeof value === 'string' ? JSON.parse(value) : value) : MEETINGS);
        } catch (e) {
          console.error(e);
        }
      }
      else if (key === 'customCampaigns') {
        try {
          setCustomCampaigns(value ? (typeof value === 'string' ? JSON.parse(value) : value) : CAMPAIGNS);
        } catch (e) {
          console.error(e);
        }
      }
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
      setSyncStatus({ active: true, message: 'Finalizando sincronização...' });
      setManualSlideOverride(localStorage.getItem('projection_manualSlideOverride'));
      setCountdownOffset(parseInt(localStorage.getItem('projection_countdownOffset') || '0', 10));
      setCountdownPaused(localStorage.getItem('projection_countdownPaused') === 'true');
      setPausedSeconds(localStorage.getItem('projection_pausedSeconds') ? parseInt(localStorage.getItem('projection_pausedSeconds')!, 10) : null);
      setActiveAlert(localStorage.getItem('projection_activeAlert'));
      setBlackoutEnabled(localStorage.getItem('projection_blackoutEnabled') === 'true');
      setClearContentEnabled(localStorage.getItem('projection_clearContentEnabled') === 'true');
      setVolume(parseFloat(localStorage.getItem('projection_volume') || '1'));
      setTickerText(localStorage.getItem('projection_tickerText'));
      const idx = localStorage.getItem('projection_activeVerseIndex');
      setActiveVerseIndex(idx ? parseInt(idx, 10) : null);
      setCustomVerseText(localStorage.getItem('projection_customVerseText') || '');
      setCustomVerseRef(localStorage.getItem('projection_customVerseRef') || '');
      setDismissedJustStarted(localStorage.getItem('projection_dismissedJustStarted') === 'true');
      setMediaUpdateTrigger(localStorage.getItem('projection_mediaUpdateTrigger') || '0');
      setVideoPinBehavior((localStorage.getItem('projection_videoPinBehavior') as 'unpin' | 'loop') || 'unpin');
      setCarouselStartTimeOffset(parseInt(localStorage.getItem('projection_carouselStartTimeOffset') || '0', 10));
      setIsProjectionOpen(localStorage.getItem('projection_isProjectionOpen') === 'true');
      setProjectionCloseTrigger(localStorage.getItem('projection_projectionCloseTrigger'));
      try {
        const order = localStorage.getItem('projection_slidesOrder');
        setSlidesOrder(order ? JSON.parse(order) : []);
      } catch (e) {
        setSlidesOrder([]);
      }
      try {
        const meets = localStorage.getItem('projection_customMeetings');
        setCustomMeetings(meets ? JSON.parse(meets) : MEETINGS);
      } catch (e) {
        setCustomMeetings(MEETINGS);
      }
      try {
        const camps = localStorage.getItem('projection_customCampaigns');
        setCustomCampaigns(camps ? JSON.parse(camps) : CAMPAIGNS);
      } catch (e) {
        setCustomCampaigns(CAMPAIGNS);
      }
      getAllMediaItems().then(() => {
        setMediaUpdateTrigger(Date.now().toString());
        setTimeout(() => setSyncStatus(null), 1000);
      });
    };

    const handleSyncProgress = (e: any) => {
      setSyncStatus({ 
        active: true, 
        message: e.detail?.message || 'Sincronizando...',
        progress: e.detail?.progress
      });
    };

    window.addEventListener('projection_sync_update', handlePeerUpdate as EventListener);
    window.addEventListener('projection_full_sync_received', handleFullSync);
    window.addEventListener('projection_sync_progress', handleSyncProgress as EventListener);

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
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('projection_sync_update', handlePeerUpdate as EventListener);
      window.removeEventListener('projection_full_sync_received', handleFullSync);
      window.removeEventListener('projection_sync_progress', handleSyncProgress as EventListener);
    };
  }, []);
  
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
  const [activeMobileTab, setActiveMobileTab] = useState<'slides' | 'texts' | 'agenda' | 'campaigns' | 'controls' | 'sync' | 'monitor'>('slides');
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

  useEffect(() => {
    if (isProjectionView) {
      updateStateAndBroadcast('isProjectionOpen', true);
      
      const handleBeforeUnload = () => {
        updateStateAndBroadcast('isProjectionOpen', false);
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        updateStateAndBroadcast('isProjectionOpen', false);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isProjectionView]);

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
      updateStateAndBroadcast('dismissedJustStarted', false);
    }
  }, [isJustStartedRaw, diffSeconds, dismissedJustStarted]);

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

  const handleVideoEnded = () => {
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
          const now = currentTime.getTime();
          const newOffset = now - targetAccumulatedTime;
          updateStateAndBroadcast('carouselStartTimeOffset', newOffset);
        }
      }
      updateStateAndBroadcast('manualSlideOverride', null);
    }
  };

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
  }, [blackoutEnabled, clearContentEnabled, activeSlides, currentSlideId, manualSlideOverride, customVerseText, activeAlert, volume]);

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

  if (!isProjectionView) {
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
        <header className="h-auto lg:h-16 px-4 lg:px-6 py-3.5 lg:py-0 bg-zinc-950 border-b border-zinc-900 flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 z-10 shrink-0">
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-amber-500" />
              <h1 className="text-white font-bold tracking-tight text-base">
                HolyLink <span className="text-zinc-400 text-xs font-medium ml-1.5 sm:ml-2 border-l border-zinc-800 pl-1.5 sm:pl-2">Painel do Operador</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-450 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {localStorage.getItem('projection_deviceRole') === 'phone' ? (
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-amber-500" />
                    Controle Móvel
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3 text-amber-500" />
                    Console Principal
                  </span>
                )}
              </div>
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
              className="flex-1 lg:flex-none bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Projetar Aqui</span>
            </button>

            <button
              onClick={() => setActiveMobileTab('sync')}
              className={`flex-1 lg:flex-none border text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMobileTab === 'sync'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-extrabold'
                  : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>Conectar Celular</span>
            </button>

            <button
              onClick={() => {
                const url = window.location.origin + window.location.pathname + '?projection';
                window.open(url, 'projection_window', 'width=1280,height=720,menubar=no,status=no,titlebar=no');
              }}
              className="flex-1 lg:flex-none bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.2)] transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Monitor (2ª Tela)</span>
            </button>
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
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse"></span>
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
        <div className="lg:hidden grid grid-cols-6 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-20 shrink-0">
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
                onClick={() => setActiveMobileTab(tab.id as any)}
                className={`py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all ${
                  isActive
                    ? "text-amber-500 border-b-2 border-amber-500 bg-zinc-900/40"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN PANEL CONTENT GRID */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* DESKTOP SIDEBAR PANEL */}
          <aside className="hidden lg:flex flex-col w-[240px] bg-zinc-950 border-r border-zinc-900 py-6 px-4 shrink-0 justify-between">
            <div className="flex flex-col gap-6">
              <span className="text-[9px] font-black text-zinc-650 uppercase tracking-widest px-2">Navegação do Deck</span>
              
              <nav className="flex flex-col gap-1.5">
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
                      onClick={() => setActiveMobileTab(item.id as any)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive
                          ? "bg-amber-500/10 text-amber-500 shadow-sm border border-amber-500/10"
                          : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900 border border-transparent"
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 ${isActive ? "text-amber-500" : "text-zinc-500"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer status */}
            <div className="border-t border-zinc-900 pt-4 px-2 flex flex-col gap-1 text-left">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Status Local</span>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Modo Operador</span>
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
                onResetCampaigns={() => updateStateAndBroadcast('customCampaigns', CAMPAIGNS)}
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

            {activeMobileTab === 'sync' && (
              <div className="w-full">
                <SyncSection showAlert={showAlert} showConfirm={showConfirm} />
              </div>
            )}
            
            <div className={activeMobileTab === 'sync' ? 'hidden absolute w-0 h-0 overflow-hidden pointer-events-none' : 'hidden absolute w-0 h-0 overflow-hidden pointer-events-none'} aria-hidden={activeMobileTab !== 'sync'}>
              {/* Keep sync alive if necessary, wait, SyncSection uses effects that must stay mounted? */}
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
