/** Toggle participation without mutating the snapshot used by React and paired devices. */
export function toggleSlideDisabled(disabledSlides: readonly string[], slideId: string): string[] {
  return disabledSlides.includes(slideId)
    ? disabledSlides.filter(id => id !== slideId)
    : [...disabledSlides, slideId];
}
