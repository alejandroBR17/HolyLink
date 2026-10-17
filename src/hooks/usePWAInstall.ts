import { useEffect, useSyncExternalStore } from 'react';
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
let promptEvent: BeforeInstallPromptEvent | null = null;
let state = { isInstallable: false, isInstalled: false, isInIframe: false,
  swStatus: 'checking' as 'checking' | 'active' | 'not_registered' | 'unsupported',
  manifestStatus: 'checking' as 'checking' | 'ok' | 'error', isHttps: true,
  hasUpdateAvailable: false, isUpdating: false, isInstalling: false, installMessage: '' };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
function update(patch: Partial<typeof state>) { state = { ...state, ...patch }; listeners.forEach(listener => listener()); }
function checkDisplayMode() {
  // An ordinary browser tab cannot reliably enumerate installations on the device.
  if (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone) update({ isInstalled: true });
}
const observed = new WeakSet<ServiceWorkerRegistration>();
function observeRegistration(reg: ServiceWorkerRegistration) {
  update({ swStatus: reg.active ? 'active' : 'checking', hasUpdateAvailable: !!reg.waiting });
  if (observed.has(reg)) return;
  observed.add(reg);
  const watch = () => {
    const worker = reg.installing;
    if (!worker) return;
    const changed = () => {
      if (worker.state === 'activated') update({ swStatus: 'active' });
      if (worker.state === 'installed') update({ hasUpdateAvailable: !!reg.waiting, swStatus: reg.active ? 'active' : 'checking' });
      if (worker.state === 'activated' || worker.state === 'redundant') worker.removeEventListener('statechange', changed);
    };
    worker.addEventListener('statechange', changed);
  };
  reg.addEventListener('updatefound', watch);
  watch();
}
async function checkStatus() {
  checkDisplayMode();
  let framed = false;
  try { framed = window.self !== window.top; } catch { framed = true; }
  update({ isInIframe: framed, isHttps: window.isSecureContext });
  if ('serviceWorker' in navigator) {
    try { const reg = await navigator.serviceWorker.getRegistration('/'); if (reg) observeRegistration(reg); else update({ swStatus: 'not_registered' }); }
    catch { update({ swStatus: 'not_registered' }); }
  } else update({ swStatus: 'unsupported' });
  try {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href;
    if (!href) throw new Error('Missing manifest');
    const response = await fetch(href, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Manifest unavailable');
    const manifest = await response.json();
    update({ manifestStatus: manifest.name && manifest.start_url && manifest.icons?.length ? 'ok' : 'error' });
  } catch { update({ manifestStatus: 'error' }); }
}
let started = false;
function start() {
  if (started) return;
  started = true;
  void checkStatus();
  if ('serviceWorker' in navigator) void navigator.serviceWorker.ready.then(observeRegistration);
  window.addEventListener('focus', checkDisplayMode);
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); promptEvent = event as BeforeInstallPromptEvent;
  update({ isInstallable: true, installMessage: '' });
});
window.addEventListener('appinstalled', () => {
  promptEvent = null; update({ isInstalled: true, isInstallable: false, isInstalling: false, installMessage: '' });
});
async function triggerInstall() {
  if (!promptEvent || state.isInstalling) return false;
  const event = promptEvent;
  // A browser installation invitation can only be consumed once, including cancellation.
  promptEvent = null;
  update({ isInstallable: false, isInstalling: true, installMessage: '' });
  try {
    await event.prompt();
    const choice = await event.userChoice;
    update({ installMessage: choice.outcome === 'accepted' ? (state.isInstalled ? '' : 'Confirme a instalação no navegador. O ícone aparecerá quando o sistema concluir.') : 'Instalação cancelada. Você também pode usar o menu do navegador.' });
    return choice.outcome === 'accepted';
  } catch { update({ installMessage: 'Não foi possível abrir o convite. Use o menu de instalação do navegador.' }); return false; }
  finally { update({ isInstalling: false }); }
}
async function forceAppUpdate() {
  if (state.isUpdating) return;
  update({ isUpdating: true });
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : undefined;
    if (reg?.waiting) {
      await new Promise<void>(resolve => {
        const timeout = window.setTimeout(done, 4000);
        function done() { clearTimeout(timeout); navigator.serviceWorker.removeEventListener('controllerchange', done); resolve(); }
        navigator.serviceWorker.addEventListener('controllerchange', done, { once: true });
        reg.waiting!.postMessage({ type: 'SKIP_WAITING' });
      });
    }
    window.location.reload();
  } catch { update({ isUpdating: false, installMessage: 'Atualização indisponível. Tente novamente quando estiver conectado.' }); }
}
export function usePWAInstall() {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  useEffect(start, []);
  return { ...snapshot, triggerInstall, checkStatus, forceAppUpdate };
}
