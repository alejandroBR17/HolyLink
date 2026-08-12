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
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

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
        if (reg) {
          setSwStatus('active');

          // Check if there's a waiting SW (new version downloaded)
          if (reg.waiting) {
            setHasUpdateAvailable(true);
          }

          // Trigger background check for new SW version on server
          reg.update().catch(() => {});

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setHasUpdateAvailable(true);
                }
              });
            }
          });
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

  const forceAppUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.unregister();
        }
      }

      // 2. Clear all cache storages
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // 3. Clear localStorage flags if needed, then hard reload with cache-busting timestamp
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now().toString());
      window.location.href = url.toString();
    } catch (err) {
      console.error('Erro ao forçar atualização:', err);
      window.location.reload();
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

    const handleFocus = () => {
      checkStatus();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focus', handleFocus);
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
    hasUpdateAvailable,
    isUpdating,
    triggerInstall,
    checkStatus,
    forceAppUpdate,
  };
}
