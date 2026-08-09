import { useCallback } from 'react';

export function useSlideManager(
  updateStateAndBroadcast: (key: string, value: any) => void,
  disabledSlides: string[],
  slidesOrder: string[],
  DEFAULT_SLIDES: string[],
  allAvailableSlides: string[],
  customMediaList: any[],
  CAMPAIGNS: any[]
) {
  const handleToggleDisableSlide = useCallback((slideId: string) => {
    let newDisabled = [...(disabledSlides || [])];
    if (newDisabled.includes(slideId)) {
      newDisabled = newDisabled.filter(id => id !== slideId);
    } else {
      newDisabled.push(slideId);
    }
    updateStateAndBroadcast('disabledSlides', JSON.stringify(newDisabled));
  }, [disabledSlides, updateStateAndBroadcast]);

  const handleResetCampaigns = useCallback(() => {
    updateStateAndBroadcast('customCampaigns', CAMPAIGNS);
  }, [updateStateAndBroadcast, CAMPAIGNS]);

  const handleMoveSlide = useCallback((slideId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    let currentOrder = [...slidesOrder];
    allAvailableSlides.forEach((id) => {
      if (!currentOrder.includes(id)) {
        currentOrder.push(id);
      }
    });

    const idx = currentOrder.indexOf(slideId);
    if (idx === -1) return;

    if (direction === 'top') {
      currentOrder.splice(idx, 1);
      currentOrder.unshift(slideId);
    } else if (direction === 'bottom') {
      currentOrder.splice(idx, 1);
      currentOrder.push(slideId);
    } else if (direction === 'up' && idx > 0) {
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
  }, [slidesOrder, allAvailableSlides, updateStateAndBroadcast]);

  const handleReorderGrouped = useCallback(() => {
    const getGroupRank = (id: string) => {
      if (['seat', 'phone', 'bathroom', 'no_chat', 'soon'].includes(id)) return 1;
      if (id.startsWith('agenda_day_') || id.startsWith('meeting_event_')) return 2;
      if (['donations', 'social', 'world_god'].includes(id)) return 3;
      if (id === 'campaigns') return 4;
      if (id.startsWith('custom_')) return 5;
      return 6;
    };

    let currentOrder = [...allAvailableSlides];
    currentOrder.sort((a, b) => getGroupRank(a) - getGroupRank(b));
    updateStateAndBroadcast('slidesOrder', JSON.stringify(currentOrder));
  }, [allAvailableSlides, updateStateAndBroadcast]);

  const handleReorderInterleaved = useCallback(() => {
    const fixos: string[] = [];
    const agendas: string[] = [];
    const contribuicao: string[] = [];
    const campanhas: string[] = [];
    const midias: string[] = [];
    const outros: string[] = [];

    allAvailableSlides.forEach((id) => {
      if (['seat', 'phone', 'bathroom', 'no_chat', 'soon'].includes(id)) {
        fixos.push(id);
      } else if (id.startsWith('agenda_day_') || id.startsWith('meeting_event_')) {
        agendas.push(id);
      } else if (['donations', 'social', 'world_god'].includes(id)) {
        contribuicao.push(id);
      } else if (id === 'campaigns') {
        campanhas.push(id);
      } else if (id.startsWith('custom_')) {
        midias.push(id);
      } else {
        outros.push(id);
      }
    });

    const groups = [fixos, agendas, contribuicao, campanhas, midias, outros];
    const interleavedOrder: string[] = [];
    let maxLen = Math.max(...groups.map(g => g.length));
    
    for (let i = 0; i < maxLen; i++) {
      for (const group of groups) {
        if (i < group.length) {
          interleavedOrder.push(group[i]);
        }
      }
    }
    updateStateAndBroadcast('slidesOrder', JSON.stringify(interleavedOrder));
  }, [allAvailableSlides, updateStateAndBroadcast]);

  const handleResetSlidesOrder = useCallback(() => {
    const defaultOrder = [...DEFAULT_SLIDES];
    customMediaList.forEach(m => defaultOrder.push(m.id));
    updateStateAndBroadcast('slidesOrder', JSON.stringify(defaultOrder));
  }, [customMediaList, updateStateAndBroadcast, DEFAULT_SLIDES]);

  return {
    handleToggleDisableSlide,
    handleResetCampaigns,
    handleMoveSlide,
    handleReorderGrouped,
    handleReorderInterleaved,
    handleResetSlidesOrder
  };
}
