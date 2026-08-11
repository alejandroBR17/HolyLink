import fs from 'fs';
import path from 'path';

const isPostBuild = process.argv.includes('--post');

console.log('\n===================================================');
console.log(`🚀 HOLYLINK BUILD VERIFICATION (${isPostBuild ? 'POST-BUILD' : 'PRE-BUILD'}) 🚀`);
console.log('===================================================\n');

const checkFile = (filePath, description) => {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    let details = `(${(stats.size / 1024).toFixed(2)} KB)`;
    if (filePath.endsWith('.png')) {
      const buffer = Buffer.alloc(4);
      const fd = fs.openSync(fullPath, 'r');
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);
      const isPng = buffer.toString('hex') === '89504e47';
      if (!isPng) {
        console.error(`  ❌ [CORRUPTO] ${description}: ${filePath} não é um PNG válido! (Header: ${buffer.toString('hex')})`);
        return false;
      }
      details += ' [PNG VÁLIDO ✓]';
    }
    console.log(`  ✓ [ENCONTRADO] ${description}: ${filePath} ${details}`);
    return true;
  } else {
    console.error(`  ❌ [FALTANDO] ${description}: ${filePath}`);
    return false;
  }
};

if (!isPostBuild) {
  console.log('📦 Verificando arquivos estáticos PWA no diretório /public:');
  const requiredPublicFiles = [
    { path: 'public/manifest.json', desc: 'Manifest PWA' },
    { path: 'public/sw.js', desc: 'Service Worker' },
    { path: 'public/icon-192.png', desc: 'Ícone 192x192' },
    { path: 'public/icon-512.png', desc: 'Ícone 512x512' },
    { path: 'public/apple-touch-icon.png', desc: 'Ícone Apple Touch' },
    { path: 'public/favicon.png', desc: 'Favicon PNG' },
  ];

  let allPublicOk = true;
  requiredPublicFiles.forEach((file) => {
    if (!checkFile(file.path, file.desc)) allPublicOk = false;
  });

  if (fs.existsSync('public/manifest.json')) {
    try {
      const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf-8'));
      console.log('\n📄 Validação do manifest.json:');
      console.log(`  • ID: ${manifest.id || 'Sem ID'}`);
      console.log(`  • Nome: ${manifest.name}`);
      console.log(`  • Short Name: ${manifest.short_name}`);
      console.log(`  • Display: ${manifest.display}`);
      console.log(`  • Quantidade de Ícones: ${manifest.icons?.length || 0}`);
    } catch (err) {
      console.error('  ❌ Erro ao analisar public/manifest.json:', err.message);
    }
  }

  if (!allPublicOk) {
    console.error('\n⚠️ AVISO: Alguns arquivos estáticos essenciais estão ausentes em /public!');
  } else {
    console.log('\n✨ Todos os arquivos estáticos PWA em /public foram verificados com sucesso!\n');
  }
} else {
  console.log('📦 Verificando arquivos compilados para deploy no diretório /dist:');
  const requiredDistFiles = [
    { path: 'dist/index.html', desc: 'HTML Principal' },
    { path: 'dist/manifest.json', desc: 'Manifest PWA compilado' },
    { path: 'dist/sw.js', desc: 'Service Worker compilado' },
    { path: 'dist/icon-192.png', desc: 'Ícone 192x192 compilado' },
    { path: 'dist/icon-512.png', desc: 'Ícone 512x512 compilado' },
    { path: 'dist/favicon.png', desc: 'Favicon compilado' },
  ];

  let allDistOk = true;
  requiredDistFiles.forEach((file) => {
    if (!checkFile(file.path, file.desc)) allDistOk = false;
  });

  if (fs.existsSync('dist/index.html')) {
    const html = fs.readFileSync('dist/index.html', 'utf-8');
    const hasManifestLink = html.includes('rel="manifest"') || html.includes('manifest.json');
    const hasFaviconLink = html.includes('favicon.png');
    console.log('\n📄 Validação das tags no dist/index.html:');
    console.log(`  • Link do manifest.json: ${hasManifestLink ? '✓ PRESENTE' : '❌ AUSENTE'}`);
    console.log(`  • Link do favicon.png: ${hasFaviconLink ? '✓ PRESENTE' : '❌ AUSENTE'}`);
  }

  if (allDistOk) {
    console.log('\n🎉 SUCESSO DE COMPILAÇÃO DA VERCEL!');
    console.log('O build gerou todos os arquivos PWA e ícones corretamente em /dist.\n');
  } else {
    console.error('\n❌ ERRO: O build não produziu os arquivos PWA esperados em /dist!');
    process.exit(1);
  }
}

console.log('===================================================\n');
