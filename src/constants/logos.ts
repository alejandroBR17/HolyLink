// Direct CDN & local logo asset references
export const LOGO_URLS = {
  // 1. Text only logo
  text: 'https://i.imgur.com/nfQCp7o.png',
  textLocal: '/logo-text.png',

  // 2. Symbol only (without text)
  symbol: 'https://i.imgur.com/pMBaMxp.png',
  symbolLocal: '/icon-192.png',

  // 3. Full Logo (symbol + text)
  full: 'https://i.imgur.com/mY1f23o.png',
  fullLocal: '/logo-full.png'
} as const;
