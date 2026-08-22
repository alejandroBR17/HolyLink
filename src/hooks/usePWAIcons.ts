import { useState, useEffect } from 'react';

export type PWAIconType = 'symbol' | 'full' | 'text';
export type PWAIconTheme = 'dark' | 'light' | 'transparent';

const ICON_URLS = {
  symbol: '/icon-192.png',
  full: '/logo-full.png',
  text: '/logo-text.png'
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

    const iconUrl = ICON_URLS[iconType];
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullIconUrl = origin ? `${origin}${iconUrl}` : iconUrl;
    const startUrl = origin ? `${origin}/` : './';

    const manifest = {
      "id": startUrl,
      "name": "HolyLink — Transmissão & Projeção",
      "short_name": "HolyLink",
      "description": "Sistema profissional de projeção P2P.",
      "start_url": startUrl,
      "scope": startUrl,
      "display": "standalone",
      "orientation": "any",
      "background_color": iconTheme === 'light' ? '#ffffff' : '#020617',
      "theme_color": iconTheme === 'light' ? '#ffffff' : '#020617',
      "icons": [
        {
          "src": fullIconUrl,
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "any maskable"
        },
        {
          "src": origin ? `${origin}/icon-512.png` : '/icon-512.png',
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "any maskable"
        }
      ]
    };

    const manifestStr = JSON.stringify(manifest);
    const blob = new Blob([manifestStr], { type: 'application/json' });
    const manifestBlobUrl = URL.createObjectURL(blob);

    const manifestLink = document.getElementById('pwa-manifest') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.href = manifestBlobUrl;
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

    return () => {
      URL.revokeObjectURL(manifestBlobUrl);
    };
  }, [iconType, iconTheme]);

  return { iconType, setIconType, iconTheme, setIconTheme, getIconUrl: () => ICON_URLS[iconType] };
}
