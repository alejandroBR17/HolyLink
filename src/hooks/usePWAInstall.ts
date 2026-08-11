import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [swStatus, setSwStatus] = useState<'checking' | 'active' | 'not_registered' | 'unsupported'>('checking');
  const [manifestStatus, setManifestStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [isHttps, setIsHttps] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    // Check HTTPS
    if (typeof window !== 'undefined') {
      setIsHttps(window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    }

    // Check if running inside iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }

    // Check if already running as standalone PWA
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Check Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && (reg.active || reg.installing || reg.waiting)) {
          setSwStatus('active');
        } else {
          // Attempt manual registration if missing
          const newReg = await navigator.serviceWorker.register('/sw.js');
          if (newReg) {
            setSwStatus('active');
          } else {
            setSwStatus('not_registered');
          }
        }
      } catch (err) {
        console.warn('SW check warning:', err);
        setSwStatus('not_registered');
      }
    } else {
      setSwStatus('unsupported');
    }

    // Check Manifest
    try {
      const res = await fetch('/manifest.json', { cache: 'no-cache' });
      if (res.ok) {
        setManifestStatus('ok');
      } else {
        setManifestStatus('error');
      }
    } catch (e) {
      setManifestStatus('error');
    }
  }, []);

  useEffect(() => {
    checkStatus();

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkStatus]);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    if (!promptToUse) return false;
    try {
      await promptToUse.prompt();
      const choice = await promptToUse.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error prompting PWA install:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isInIframe,
    swStatus,
    manifestStatus,
    isHttps,
    triggerInstall,
    checkStatus,
  };
}
