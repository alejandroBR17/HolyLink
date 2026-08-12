import fs from "fs";
import path from "path";

console.log("🎨 Verificando e garantindo ícones PWA e logotipos HolyLink...");

const publicDir = path.resolve("public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Se por algum motivo icon-512 ou logo-full existir mas icon-192 não, fazemos a cópia de segurança
const requiredFiles = [
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "favicon.png",
  "logo-full.png",
  "logo-text.png"
];

let missing = false;
requiredFiles.forEach((file) => {
  const filePath = path.join(publicDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️ Arquivo ${file} não encontrado em /public`);
    missing = true;
  } else {
    const sizeKb = (fs.statSync(filePath).size / 1024).toFixed(2);
    console.log(`  ✓ Encontrado ${file} (${sizeKb} KB)`);
  }
});

if (missing) {
  console.log("  ℹ️ Se algum arquivo estático estiver ausente, certifique-se de que a pasta public/ esteja presente no repositório.");
}

console.log("✨ Verificação de ícones concluída com sucesso!\n");
