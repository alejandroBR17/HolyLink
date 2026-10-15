import { useState, useEffect } from 'react';


export type PWAIconType = 'symbol' | 'full' | 'text';
export type PWAIconTheme = 'dark' | 'light' | 'transparent';

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

    const type = ['symbol','full','text'].includes(iconType) ? iconType : 'symbol';
    const theme = ['dark','light','transparent'].includes(iconTheme) ? iconTheme : 'transparent';
    const iconUrl = '/pwa/local-'+type+'-'+theme+'-192.png';

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
      icon512.href = '/pwa/local-'+type+'-'+theme+'-512.png';
    }

    // Application chrome stays consistent when customizing the icon background.
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute("content", "#030305");
    }
  }, [iconType, iconTheme]);

  return { iconType, setIconType, iconTheme, setIconTheme, getIconUrl: () => '/pwa/local-'+(['symbol','full','text'].includes(iconType)?iconType:'symbol')+'-'+(['dark','light','transparent'].includes(iconTheme)?iconTheme:'transparent')+'-192.png' };
}
