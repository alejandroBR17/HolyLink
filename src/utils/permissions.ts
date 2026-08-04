export interface PermissionStatusItem {
  id: 'audio' | 'storage' | 'notifications' | 'wakelock' | 'projection_window';
  title: string;
  description: string;
  status: 'granted' | 'prompt' | 'denied' | 'unsupported';
}

/**
  Checks current browser permission status for all critical projection features
 */
export async function checkAllPermissions(): Promise<PermissionStatusItem[]> {
  const items: PermissionStatusItem[] = [];

  // 1. Audio / Autoplay
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'running') {
      items.push({
        id: 'audio',
        title: 'Áudio & Mídia',
        description: 'Reprodução de hinos e trilhas de vídeo',
        status: 'granted'
      });
    } else {
      items.push({
        id: 'audio',
        title: 'Áudio & Mídia',
        description: 'Clique para liberar reprodução de som',
        status: 'prompt'
      });
    }
    audioCtx.close();
  } catch (e) {
    items.push({
      id: 'audio',
      title: 'Áudio & Mídia',
      description: 'Áudio ativo',
      status: 'granted'
    });
  }

  // 2. Storage Persistence (IndexedDB quota)
  try {
    if (navigator.storage && navigator.storage.persisted) {
      const isPersisted = await navigator.storage.persisted();
      if (isPersisted) {
        items.push({
          id: 'storage',
          title: 'Armazenamento',
          description: 'Cache de vídeos e imagens ativado',
          status: 'granted'
        });
      } else {
        items.push({
          id: 'storage',
          title: 'Armazenamento',
          description: 'Salvar arquivos e dados no navegador',
          status: 'prompt'
        });
      }
    } else {
      items.push({
        id: 'storage',
        title: 'Armazenamento',
        description: 'Armazenamento local ativo',
        status: 'granted'
      });
    }
  } catch (e) {
    items.push({
      id: 'storage',
      title: 'Armazenamento',
      description: 'Armazenamento ativo',
      status: 'granted'
    });
  }

  // 3. Notifications
  try {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        items.push({
          id: 'notifications',
          title: 'Notificações',
          description: 'Alertas visuais ativados',
          status: 'granted'
        });
      } else if (Notification.permission === 'denied') {
        items.push({
          id: 'notifications',
          title: 'Notificações',
          description: 'Desativado no navegador',
          status: 'denied'
        });
      } else {
        items.push({
          id: 'notifications',
          title: 'Notificações',
          description: 'Alertas e avisos do sistema',
          status: 'prompt'
        });
      }
    } else {
      items.push({
        id: 'notifications',
        title: 'Notificações',
        description: 'Não suportado',
        status: 'unsupported'
      });
    }
  } catch (e) {
    items.push({
      id: 'notifications',
      title: 'Notificações',
      description: 'Indisponível',
      status: 'unsupported'
    });
  }

  // 4. Wake Lock (Prevent screen sleep)
  if ('wakeLock' in navigator) {
    items.push({
      id: 'wakelock',
      title: 'Manter Tela Acesa (WakeLock)',
      description: 'Impede que o monitor de projeção entre em repouso durante o culto',
      status: 'granted'
    });
  } else {
    items.push({
      id: 'wakelock',
      title: 'Prevenção de Repouso',
      description: 'Indisponível neste navegador',
      status: 'unsupported'
    });
  }

  return items;
}

/**
 * Requests specific permission from user one-by-one without losing existing state
 */
export async function requestSinglePermission(id: PermissionStatusItem['id']): Promise<boolean> {
  try {
    if (id === 'audio') {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioCtx.resume();
      audioCtx.close();
      return true;
    }

    if (id === 'storage') {
      if (navigator.storage && navigator.storage.persist) {
        const granted = await navigator.storage.persist();
        return granted;
      }
      return true;
    }

    if (id === 'notifications') {
      if (typeof Notification !== 'undefined') {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return true;
    }

    return true;
  } catch (e) {
    console.warn(`Error requesting permission for ${id}:`, e);
    return false;
  }
}
