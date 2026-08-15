import { useEffect } from 'react';

export function useKeyboardShortcuts({
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
}: any) {
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
      // P: Toggle Pré-Reunião / Pós-Reunião mode
      else if (key === 'p') {
        e.preventDefault();
        const nextMode = projectionMode === 'post' ? 'pre' : 'post';
        updateStateAndBroadcast('projectionMode', nextMode);
        updateStateAndBroadcast('manualSlideOverride', null);
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
  }, [
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
  ]);
}
