import { useEffect, useState, useCallback } from 'react';
import { requestWakeLock, releaseWakeLock, isWakeLockSupported, isWakeLockActive } from '../utils/wakeLock';

/**
 * React hook for managing Screen Wake Lock API.
 * Keeps screen awake and prevents device hibernation while the component is active.
 */
export function useWakeLock(autoEnable: boolean = true) {
  const [isActive, setIsActive] = useState<boolean>(() => isWakeLockActive());
  const [isSupported] = useState<boolean>(() => isWakeLockSupported());

  const enable = useCallback(async () => {
    const success = await requestWakeLock();
    setIsActive(success);
    return success;
  }, []);

  const disable = useCallback(async () => {
    await releaseWakeLock();
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (!autoEnable) return;

    let mounted = true;

    const acquire = async () => {
      const active = await requestWakeLock();
      if (mounted) {
        setIsActive(active);
      }
    };

    acquire();

    // Automatically re-request Screen Wake Lock when browser window/tab becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const active = await requestWakeLock();
        if (mounted) {
          setIsActive(active);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoEnable]);

  return { isSupported, isActive, enable, disable };
}
