import { useState, useEffect } from 'react';
import { LOGO_URLS } from '../constants/logos';

export type PWAIconType = 'symbol' | 'full' | 'text';
export type PWAIconTheme = 'dark' | 'light' | 'transparent';

const ICON_URLS: Record<PWAIconType, string> = {
  symbol: LOGO_URLS.symbol,
  full: LOGO_URLS.full,
  text: LOGO_URLS.text
};

export function usePWAIcons() {
  const [iconType, setIconType] = useState<PWAIconType>(() => {
    return (localStorage.getItem('holylink_pwa_icon_type') as PWAIconType) || 'symbol';
  });
  const [iconTheme, setIconTheme] = useState<PWAIconTheme>(() => {
    return (localStorage.getItem('holylink_pwa_icon_theme') as PWAIconTheme) || 'transparent';
  });

  useEffect(() => {
    localStorage.setItem('holylink_pwa_icon_type', iconType);
    localStorage.setItem('holylink_pwa_icon_theme', iconTheme);

    const iconUrl = ICON_URLS[iconType] || '/icon-192.png';

    // Keep static /manifest.json as the single authoritative manifest link
    const manifestLink = document.getElementById('pwa-manifest') as HTMLLinkElement;
    if (manifestLink && manifestLink.getAttribute('href') !== '/manifest.json') {
      manifestLink.href = '/manifest.json';
    }

    const appleIcon = document.getElementById('pwa-apple-icon') as HTMLLinkElement;
    if (appleIcon) {
      appleIcon.href = iconUrl;
    }

    const icon192 = document.getElementById('pwa-icon-192') as HTMLLinkElement;
    if (icon192) {
      icon192.href = iconUrl;
    }

    const icon512 = document.getElementById('pwa-icon-512') as HTMLLinkElement;
    if (icon512) {
      icon512.href = iconUrl;
    }

    // Dynamic theme color update
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute("content", iconTheme === "light" ? "#ffffff" : "#020617");
    }
  }, [iconType, iconTheme]);

  return { iconType, setIconType, iconTheme, setIconTheme, getIconUrl: () => ICON_URLS[iconType] };
}

