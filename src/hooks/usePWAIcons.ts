import { useState, useEffect } from 'react';

export type PWAIconType = 'symbol' | 'full' | 'text';
export type PWAIconTheme = 'dark' | 'light' | 'transparent';

export function usePWAIcons() {
  const [iconType, setIconType] = useState<PWAIconType>(() => {
    return (localStorage.getItem('holylink_pwa_icon_type') as PWAIconType) || 'symbol';
  });
  const [iconTheme, setIconTheme] = useState<PWAIconTheme>(() => {
    return (localStorage.getItem('holylink_pwa_icon_theme') as PWAIconTheme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('holylink_pwa_icon_type', iconType);
    localStorage.setItem('holylink_pwa_icon_theme', iconTheme);

    const manifestLink = document.getElementById('pwa-manifest') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = `/pwa/manifest-${iconType}-${iconTheme}.json`;
    }

    const appleIcon = document.getElementById('pwa-apple-icon') as HTMLLinkElement;
    if (appleIcon) {
      appleIcon.href = `/pwa/${iconType}-${iconTheme}-192.png`;
    }

    const icon192 = document.getElementById('pwa-icon-192') as HTMLLinkElement;
    if (icon192) {
      icon192.href = `/pwa/${iconType}-${iconTheme}-192.png`;
    }

    const icon512 = document.getElementById('pwa-icon-512') as HTMLLinkElement;
    if (icon512) {
      icon512.href = `/pwa/${iconType}-${iconTheme}-512.png`;
    }

    // Dynamic theme color update
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute("content", iconTheme === "light" ? "#ffffff" : "#020617");
    }

  }, [iconType, iconTheme]);

  return { iconType, setIconType, iconTheme, setIconTheme };
}
