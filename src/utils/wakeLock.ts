/**
 * Screen Wake Lock Utility
 * Uses HTML5 Screen Wake Lock API to prevent the device screen from sleeping or hibernating during meetings and live projections.
 */

let globalWakeLockSentinel: any = null;
let isRequested = false;

/**
 * Requests a screen wake lock.
 */
export async function requestWakeLock(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }
  isRequested = true;
  try {
    if (!globalWakeLockSentinel || globalWakeLockSentinel.released) {
      globalWakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      
      globalWakeLockSentinel.addEventListener('release', () => {
        // Automatically re-acquire if released (e.g. tab was hidden and becomes visible again)
        if (isRequested && typeof document !== 'undefined' && document.visibilityState === 'visible') {
          requestWakeLock().catch(() => {});
        }
      });
    }
    return true;
  } catch (err) {
    console.warn('Screen Wake Lock request failed:', err);
    return false;
  }
}

/**
 * Releases the active screen wake lock.
 */
export async function releaseWakeLock(): Promise<void> {
  isRequested = false;
  if (globalWakeLockSentinel) {
    try {
      await globalWakeLockSentinel.release();
    } catch (e) {
      // Ignore release errors
    } finally {
      globalWakeLockSentinel = null;
    }
  }
}

/**
 * Checks if Screen Wake Lock API is supported by the current browser/device.
 */
export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/**
 * Returns whether a Screen Wake Lock is currently active.
 */
export function isWakeLockActive(): boolean {
  return Boolean(globalWakeLockSentinel && !globalWakeLockSentinel.released);
}
