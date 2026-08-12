import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const publicDir = path.resolve("public");
const pwaDir = path.join(publicDir, "pwa");

if (!fs.existsSync(pwaDir)) {
  fs.mkdirSync(pwaDir, { recursive: true });
}

const SOURCES = {
  symbol: "https://i.imgur.com/pMBaMxp.png",
  full: "https://i.imgur.com/mY1f23o.png",
  text: "https://i.imgur.com/nfQCp7o.png"
};

const THEMES = {
  dark: "#020617",
  light: "#ffffff",
  transparent: "none"
};

async function downloadImage(url, dest) {
  console.log(`Downloading ${url}...`);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function run() {
  // Download bases
  const bases = {};
  for (const [type, url] of Object.entries(SOURCES)) {
    const dest = path.join(pwaDir, `base-${type}.png`);
    if (!fs.existsSync(dest)) {
      await downloadImage(url, dest);
    }
    bases[type] = dest;
  }

  // Generate matrix
  for (const [type, baseFile] of Object.entries(bases)) {
    for (const [theme, bgColor] of Object.entries(THEMES)) {
      const out512 = path.join(pwaDir, `${type}-${theme}-512.png`);
      const out192 = path.join(pwaDir, `${type}-${theme}-192.png`);
      
      const resizePct = type === "symbol" ? "65%" : "80%";
      
      console.log(`Generating ${type} / ${theme}...`);
      
      // Generate 512
      execSync(`convert "${baseFile}" -resize ${resizePct} -background "${bgColor}" -gravity center -extent 2000x2000 -resize 512x512 "${out512}"`);
      // Generate 192
      execSync(`convert "${out512}" -resize 192x192 "${out192}"`);

      // Generate Manifest
      const manifest = {
        "id": "/",
        "name": "HolyLink — Transmissão & Projeção",
        "short_name": "HolyLink",
        "description": "Sistema profissional de projeção P2P.",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "orientation": "any",
        "background_color": theme === "light" ? "#ffffff" : "#020617",
        "theme_color": theme === "light" ? "#ffffff" : "#020617",
        "icons": [
          {
            "src": `/pwa/${type}-${theme}-192.png?v=12`,
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": `/pwa/${type}-${theme}-512.png?v=12`,
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
          }
        ]
      };
      
      fs.writeFileSync(path.join(pwaDir, `manifest-${type}-${theme}.json`), JSON.stringify(manifest, null, 2));
    }
  }
  
  // Create a default manifest fallback
  fs.copyFileSync(path.join(pwaDir, "manifest-symbol-dark.json"), path.join(publicDir, "manifest.json"));
  
  console.log("Done generating PWA assets matrix!");
}

run().catch(console.error);
