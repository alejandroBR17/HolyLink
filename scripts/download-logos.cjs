const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode + ' for ' + url));
      }
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => {
        const stats = fs.statSync(dest);
        console.log('Saved', dest, '(', stats.size, 'bytes )');
        resolve(dest);
      }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading official logos from Imgur...');
  
  // 1. Text only logo: https://i.imgur.com/nfQCp7o.png
  await download('https://i.imgur.com/nfQCp7o.png', 'public/logo-text.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/logo-text-854.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/logo-text-backup.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/pwa/text-dark-192.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/pwa/text-dark-512.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/pwa/text-light-192.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/pwa/text-light-512.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/pwa/text-transparent-192.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/pwa/text-transparent-512.png');
  await download('https://i.imgur.com/nfQCp7o.png', 'public/pwa/base-text.png');

  // 2. Symbol only (without text): https://i.imgur.com/pMBaMxp.png
  await download('https://i.imgur.com/pMBaMxp.png', 'public/icon-192.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/icon-512.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/favicon.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/apple-touch-icon.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/icon-192-bg.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/icon-192-black.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/icon-symbol-838.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/pwa/symbol-dark-192.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/pwa/symbol-dark-512.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/pwa/symbol-light-192.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/pwa/symbol-light-512.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/pwa/symbol-transparent-192.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/pwa/symbol-transparent-512.png');
  await download('https://i.imgur.com/pMBaMxp.png', 'public/pwa/base-symbol.png');

  // 3. Full Logo (symbol + text): https://i.imgur.com/mY1f23o.png
  await download('https://i.imgur.com/mY1f23o.png', 'public/logo-full.png');
  await download('https://i.imgur.com/mY1f23o.png', 'public/logo-full-814.png');
  await download('https://i.imgur.com/mY1f23o.png', 'public/pwa/full-dark-192.png');
  await download('https://i.imgur.com/mY1f23o.png', 'public/pwa/full-dark-512.png');
  await download('https://i.imgur.com/mY1f23o.png', 'public/pwa/full-light-192.png');
  await download('https://i.imgur.com/mY1f23o.png', 'public/pwa/full-light-512.png');
  await download('https://i.imgur.com/mY1f23o.png', 'public/pwa/full-transparent-192.png');
  await download('https://i.imgur.com/mY1f23o.png', 'public/pwa/full-transparent-512.png');
  await download('https://i.imgur.com/mY1f23o.png', 'public/pwa/base-full.png');

  console.log('All official Imgur logos downloaded and saved successfully!');
}

main().catch(err => {
  console.error('Error downloading logos:', err);
  process.exit(1);
});
