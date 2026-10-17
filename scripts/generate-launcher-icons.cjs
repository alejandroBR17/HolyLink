/** Run Vite locally first. Set HOLY_PLAYWRIGHT_MODULE to an installed Playwright
 * package path if it is not available in this checkout. Outputs only local PWA assets.
 * Example: node scripts/generate-launcher-icons.cjs http://127.0.0.1:3012
 */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.HOLY_PLAYWRIGHT_MODULE||'playwright');
const base=new URL(process.argv[2]||'http://127.0.0.1:3012');
if(!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Use the local Vite server.');
(async()=>{const browser=await chromium.launch({channel:process.env.HOLY_BROWSER_CHANNEL||'msedge',headless:true});try{
 const context=await browser.newContext({serviceWorkers:'block'});const page=await context.newPage();
 await context.routeWebSocket('**/*',socket=>socket.close());await page.goto(base.href);
 const files=await page.evaluate(async()=>{
  const {createAppIcon}=await import('/src/utils/icon-download.ts');const files=[];
  async function add(type,theme,size,purpose,prefix){const blob=await createAppIcon(type,theme,size,purpose);const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);files.push({name:`${prefix}-v2-${type}-${theme}-${size}.png`,base64:btoa(binary)});}
  for(const type of ['symbol','full','text']) {
   for(const theme of ['dark','light','transparent'])for(const size of [192,512])await add(type,theme,size,'any','app');
   for(const theme of ['dark','light']){for(const size of [192,512])await add(type,theme,size,'maskable','adaptive');await add(type,theme,180,'apple','apple');}
  }
  return files;
 });
 const target=path.resolve(__dirname,'../public/pwa');for(const file of files)fs.writeFileSync(path.join(target,file.name),Buffer.from(file.base64,'base64'));
 console.log(`Generated ${files.length} versioned app/adaptive/Apple PNGs from the shared renderer.`);
 await context.close();
}finally{await browser.close();}})().catch(error=>{console.error(error.message);process.exitCode=1;});
