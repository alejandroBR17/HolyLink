import { useCallback } from 'react';
import { toggleSlideDisabled } from '../utils/slide-participation';

type BroadcastUpdate = (key: string, value: unknown) => void;

/** Shared actions still used by Sequence and Agenda; order editing lives in PlaylistPanel. */
export function useSlideManager(
  updateStateAndBroadcast: BroadcastUpdate,
  disabledSlides: readonly string[],
  defaultCampaigns: readonly unknown[],
) {
  const handleToggleDisableSlide = useCallback((slideId: string) => {
    const nextDisabled = toggleSlideDisabled(disabledSlides, slideId);
    updateStateAndBroadcast('disabledSlides', JSON.stringify(nextDisabled));
  }, [disabledSlides, updateStateAndBroadcast]);

  const handleResetCampaigns = useCallback(() => {
    updateStateAndBroadcast('customCampaigns', defaultCampaigns);
  }, [defaultCampaigns, updateStateAndBroadcast]);

  return { handleToggleDisableSlide, handleResetCampaigns };
}
