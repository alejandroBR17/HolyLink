import { useState, useEffect, useRef, useCallback } from 'react';
import { CHURCH_INFO, ALERTS, VERSES, CAMPAIGNS, MEETINGS } from '../data';
import { Meeting } from '../types';
import { broadcastToPeers } from '../components/SyncSection';

export interface ProjectionState {
  manualSlideOverride: string | null;
  slidesOrder: string[];
  customVerseText: string;
  customVerseRef: string;
  activeVerseIndex: number | null;
  activeAlert: string | null;
  blackoutEnabled: boolean;
  clearContentEnabled: boolean;
  pausedSeconds: number | null;
  countdownPaused: boolean;
  countdownOffset: number;
  dismissedJustStarted: boolean;
  videoPinBehavior: 'unpin' | 'loop';
  carouselStartTimeOffset: number;
  customMeetings: Meeting[];
  volume: number;
  tickerText: string | null;
  customCampaigns: any[];
  isProjectionOpen: boolean;
  projectionCloseTrigger: string | null;
  mediaUpdateTrigger: string;
  background3DStyle: 'auto' | 'aurora' | 'veil' | 'fju_aura' | 'particles_2d' | 'off';
  background3DFps: 30 | 60;
  background3DIntensity: 'high' | 'medium' | 'low';
}

export function useProjectionState() {
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

  const [customMeetings, setCustomMeetings] = useState<Meeting[]>(() => {
    if (typeof window === 'undefined') return MEETINGS;
    const val = localStorage.getItem('projection_customMeetings');
    if (val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        console.error("Error parsing projection_customMeetings:", e);
      }
    }
    return MEETINGS;
  });

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    return parseFloat(localStorage.getItem('projection_volume') || '1');
  });

  const [tickerText, setTickerText] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('projection_tickerText');
  });

  const [customCampaigns, setCustomCampaigns] = useState<any[]>(() => {
    if (typeof window === 'undefined') return CAMPAIGNS;
    const val = localStorage.getItem('projection_customCampaigns');
    if (val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        console.error("Error parsing projection_customCampaigns:", e);
      }
    }
    return CAMPAIGNS;
  });

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

  const [background3DStyle, setBackground3DStyle] = useState<'auto' | 'aurora' | 'veil' | 'fju_aura' | 'particles_2d' | 'off'>(() => {
    if (typeof window === 'undefined') return 'auto';
    return (localStorage.getItem('projection_background3DStyle') as any) || 'auto';
  });

  const [background3DFps, setBackground3DFps] = useState<30 | 60>(() => {
    if (typeof window === 'undefined') return 60;
    const val = localStorage.getItem('projection_background3DFps');
    return val === '30' ? 30 : 60;
  });

  const [background3DIntensity, setBackground3DIntensity] = useState<'high' | 'medium' | 'low'>(() => {
    if (typeof window === 'undefined') return 'high';
    return (localStorage.getItem('projection_background3DIntensity') as any) || 'high';
  });

  const [syncStatus, setSyncStatus] = useState<{ active: boolean; message: string; progress?: number } | null>(null);

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

  // Update local state and sync across tabs (BroadcastChannel) & remote peers (PeerJS)
  const updateStateAndBroadcast = useCallback((key: string, value: any) => {
    if (value === null || value === undefined) {
      localStorage.removeItem(`projection_${key}`);
    } else {
      const stringValue = (typeof value === 'object') ? JSON.stringify(value) : value.toString();
      localStorage.setItem(`projection_${key}`, stringValue);
    }

    if (key === 'manualSlideOverride') setManualSlideOverride(value);
    else if (key === 'countdownOffset') setCountdownOffset(typeof value === 'number' ? value : parseInt(value?.toString() || '0', 10));
    else if (key === 'countdownPaused') setCountdownPaused(value === 'true' || value === true);
    else if (key === 'pausedSeconds') setPausedSeconds(value !== null && value !== undefined ? parseInt(value.toString(), 10) : null);
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
    else if (key === 'activeVerseIndex') setActiveVerseIndex(value !== null && value !== undefined ? parseInt(value.toString(), 10) : null);
    else if (key === 'customVerseText') setCustomVerseText(value || '');
    else if (key === 'customVerseRef') setCustomVerseRef(value || '');
    else if (key === 'dismissedJustStarted') setDismissedJustStarted(value === 'true' || value === true);
    else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(value?.toString() || '0');
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
        if (typeof window !== 'undefined' && (window.location.search.includes('projection') || window.location.pathname.endsWith('/projection'))) {
          try {
            window.close();
          } catch (e) {
            console.warn("Could not window.close():", e);
          }
        }
      }
    }
    else if (key === 'customMeetings') {
      try {
        setCustomMeetings(typeof value === 'string' ? JSON.parse(value) : value);
      } catch (e) {
        console.error("Error setting customMeetings:", e);
      }
    }
    else if (key === 'background3DStyle') setBackground3DStyle(value || 'auto');
    else if (key === 'background3DFps') setBackground3DFps(String(value) === '30' ? 30 : 60);
    else if (key === 'background3DIntensity') setBackground3DIntensity(value || 'high');
    else if (key === 'customCampaigns') {
      try {
        setCustomCampaigns(typeof value === 'string' ? JSON.parse(value) : value);
      } catch (e) {
        console.error("Error setting customCampaigns:", e);
      }
    }
    else if (key === 'slidesOrder') {
      try {
        setSlidesOrder(value ? (typeof value === 'string' ? JSON.parse(value) : value) : []);
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

    broadcastToPeers({ type: 'UPDATE_STATE', key, value, version: 1 });
  }, [setProjectionWin]);

  // Listener for BroadcastChannel, Storage, and PeerJS updates
  useEffect(() => {
    let bc: BroadcastChannel | null = null;

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
      else if (key === 'countdownOffset') setCountdownOffset(value !== null && value !== undefined ? parseInt(value.toString(), 10) : 0);
      else if (key === 'countdownPaused') setCountdownPaused(value === 'true' || value === true);
      else if (key === 'pausedSeconds') setPausedSeconds(value !== null && value !== undefined ? parseInt(value.toString(), 10) : null);
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
      else if (key === 'activeVerseIndex') setActiveVerseIndex(value !== null && value !== undefined ? parseInt(value.toString(), 10) : null);
      else if (key === 'customVerseText') setCustomVerseText(value || '');
      else if (key === 'customVerseRef') setCustomVerseRef(value || '');
      else if (key === 'dismissedJustStarted') setDismissedJustStarted(value === 'true' || value === true);
      else if (key === 'mediaUpdateTrigger') setMediaUpdateTrigger(value?.toString() || '0');
      else if (key === 'videoPinBehavior') setVideoPinBehavior(value);
      else if (key === 'background3DStyle') setBackground3DStyle(value || 'auto');
      else if (key === 'background3DFps') setBackground3DFps(value === '30' || value === 30 ? 30 : 60);
      else if (key === 'background3DIntensity') setBackground3DIntensity(value || 'high');
      else if (key === 'carouselStartTimeOffset') setCarouselStartTimeOffset(value !== null && value !== undefined ? parseInt(value.toString(), 10) : 0);
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
          if (typeof window !== 'undefined' && (window.location.search.includes('projection') || window.location.pathname.endsWith('/projection'))) {
            try {
              window.close();
            } catch (e) {
              console.warn("Could not window.close():", e);
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
          setSlidesOrder(value ? (typeof value === 'string' ? JSON.parse(value) : value) : []);
        } catch (e) {
          setSlidesOrder([]);
        }
      }
    };

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
      setBackground3DStyle((localStorage.getItem('projection_background3DStyle') as any) || 'auto');
      const fpsVal = localStorage.getItem('projection_background3DFps');
      setBackground3DFps(fpsVal === '30' ? 30 : 60);
      setBackground3DIntensity((localStorage.getItem('projection_background3DIntensity') as any) || 'high');
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
      setMediaUpdateTrigger(Date.now().toString());
      setTimeout(() => setSyncStatus(null), 1000);
    };

    const handleSyncProgress = (e: any) => {
      setSyncStatus({ 
        active: true, 
        message: e.detail?.message || 'Sincronizando...',
        progress: e.detail?.progress
      });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('projection_')) {
        const key = e.key.replace('projection_', '');
        const val = e.newValue;
        updateStateLocalOnly(key, val);
      }
    };

    window.addEventListener('projection_sync_update', handlePeerUpdate as EventListener);
    window.addEventListener('projection_full_sync_received', handleFullSync);
    window.addEventListener('projection_sync_progress', handleSyncProgress as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('projection_sync_update', handlePeerUpdate as EventListener);
      window.removeEventListener('projection_full_sync_received', handleFullSync);
      window.removeEventListener('projection_sync_progress', handleSyncProgress as EventListener);
    };
  }, [setProjectionWin]);

  return {
    state: {
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
      projectionCloseTrigger,
      mediaUpdateTrigger,
      background3DStyle,
      background3DFps,
      background3DIntensity,
      syncStatus
    },
    updateStateAndBroadcast,
    projectionWinRef,
    setProjectionWin
  };
}
