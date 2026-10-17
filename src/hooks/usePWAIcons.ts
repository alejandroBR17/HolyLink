import { useSyncExternalStore } from 'react';
export type PWAIconType = 'symbol' | 'full' | 'text';
export type PWAIconTheme = 'dark' | 'light' | 'transparent';
function readSelection() {
  try {
    const type = localStorage.getItem('holylink_pwa_icon_type');
    const theme = localStorage.getItem('holylink_pwa_icon_theme');
    return { iconType: (['symbol','full','text'].includes(type || '') ? type : 'symbol') as PWAIconType,
      iconTheme: (['dark','light','transparent'].includes(theme || '') ? theme : 'dark') as PWAIconTheme };
  } catch { return { iconType: 'symbol' as PWAIconType, iconTheme: 'dark' as PWAIconTheme }; }
}
let selection = readSelection();
const initial = selection;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
function update(next: typeof selection) {
  selection = next;
  try {
    localStorage.setItem('holylink_pwa_icon_type', next.iconType);
    localStorage.setItem('holylink_pwa_icon_theme', next.iconTheme);
  } catch { /* Downloads work even when storage is blocked. */ }
  for (const listener of listeners) listener();
}
export function usePWAIcons() {
  const current = useSyncExternalStore(subscribe, () => selection);
  const path = `/pwa/app-v2-${current.iconType}-${current.iconTheme}`;
  return { ...current,
    setIconType: (iconType: PWAIconType) => update({ ...selection, iconType }),
    setIconTheme: (iconTheme: PWAIconTheme) => update({ ...selection, iconTheme }),
    getIconUrl: () => `${path}-192.png`, downloadUrl: `${path}-512.png`,
    requiresReload: current.iconType !== initial.iconType || current.iconTheme !== initial.iconTheme,
    applyIcon: () => { try { sessionStorage.setItem('holylink_reopen_install', '1'); } catch { /* optional */ } window.location.reload(); }
  };
}
