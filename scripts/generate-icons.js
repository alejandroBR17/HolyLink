import fs from "fs";
import path from "path";

console.log("🎨 Verificando e garantindo ícones PWA e logotipos HolyLink...");

const publicDir = path.resolve("public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function isValidPng(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    return buffer.toString("hex") === "89504e47";
  } catch (err) {
    return false;
  }
}

const SOURCES = {
  symbol: "https://i.imgur.com/pMBaMxp.png", // 838 (Só o símbolo)
  full: "https://i.imgur.com/mY1f23o.png",   // 814 (Logotipo com tipografia)
  text: "https://i.imgur.com/nfQCp7o.png"    // 854 (Só a tipografia)
};

async function downloadImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    if (buf.toString("hex", 0, 4) === "89504e47") {
      return buf;
    }
  } catch (err) {
    console.error(`  ❌ Erro ao baixar imagem de ${url}:`, err.message);
  }
  return null;
}

async function ensureIcons() {
  const symbolIcons = ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.png"];
  
  let symbolBuf = null;

  for (const f of symbolIcons) {
    const filePath = path.join(publicDir, f);
    if (!isValidPng(filePath)) {
      console.log(`  📥 [CORRIGINDO] ${f} ausente ou corrompido. Baixando de ${SOURCES.symbol}...`);
      if (!symbolBuf) {
        symbolBuf = await downloadImage(SOURCES.symbol);
      }
      if (symbolBuf) {
        fs.writeFileSync(filePath, symbolBuf);
        console.log(`  ✓ ${f} gravado com sucesso (${(symbolBuf.length / 1024).toFixed(2)} KB)`);
      }
    } else {
      console.log(`  ✓ ${f} verificado [PNG VÁLIDO]`);
    }
  }

  const logoFullFile = path.join(publicDir, "logo-full.png");
  if (!isValidPng(logoFullFile)) {
    console.log(`  📥 [CORRIGINDO] logo-full.png ausente ou corrompido. Baixando de ${SOURCES.full}...`);
    const fullBuf = await downloadImage(SOURCES.full);
    if (fullBuf) {
      fs.writeFileSync(logoFullFile, fullBuf);
      console.log(`  ✓ logo-full.png gravado com sucesso (${(fullBuf.length / 1024).toFixed(2)} KB)`);
    }
  } else {
    console.log(`  ✓ logo-full.png verificado [PNG VÁLIDO]`);
  }

  const logoTextFile = path.join(publicDir, "logo-text.png");
  if (!isValidPng(logoTextFile)) {
    console.log(`  📥 [CORRIGINDO] logo-text.png ausente ou corrompido. Baixando de ${SOURCES.text}...`);
    const textBuf = await downloadImage(SOURCES.text);
    if (textBuf) {
      fs.writeFileSync(logoTextFile, textBuf);
      console.log(`  ✓ logo-text.png gravado com sucesso (${(textBuf.length / 1024).toFixed(2)} KB)`);
    }
  } else {
    console.log(`  ✓ logo-text.png verificado [PNG VÁLIDO]`);
  }

  console.log("✨ Processamento de ícones e logotipos concluído!\n");
}

ensureIcons().catch(err => {
  console.error("  ❌ Falha no processamento de ícones:", err);
  process.exit(1);
});
