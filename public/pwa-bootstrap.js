// Select the saved icon before the browser evaluates installability.
(() => {
  let type = 'symbol', theme = 'dark';
  try {
    const savedType = localStorage.getItem('holylink_pwa_icon_type');
    const savedTheme = localStorage.getItem('holylink_pwa_icon_theme');
    if (['symbol','full','text'].includes(savedType)) type = savedType;
    if (['dark','light','transparent'].includes(savedTheme)) theme = savedTheme;
  } catch { /* Defaults work without local storage. */ }
  document.getElementById('pwa-manifest').href = `/pwa/manifest-${type}-${theme}.json`;
  const appleTheme = theme === 'transparent' ? 'dark' : theme;
  document.getElementById('pwa-apple-icon').href = `/pwa/apple-v2-${type}-${appleTheme}-180.png`;
  document.getElementById('pwa-icon-192').href = `/pwa/app-v2-${type}-${theme}-192.png`;
  for (const icon of document.querySelectorAll('link[rel="icon"]:not([sizes]), link[rel="shortcut icon"]')) icon.href = `/pwa/app-v2-${type}-${theme}-192.png`;
  document.getElementById('pwa-icon-512').href = `/pwa/app-v2-${type}-${theme}-512.png`;
  document.querySelector('meta[name="theme-color"]').setAttribute("content", "#030305");
})();
