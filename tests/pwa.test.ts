import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {inflateSync} from 'node:zlib';
function worker(fetcher: (request: any) => Promise<Response>, seed: Record<string, Map<string, Response>> = {}) {
 const stores = new Map(Object.entries(seed));
 const handlers: Record<string, (event: any) => void> = {};
 let skipped = 0;
 const key = (request: any) => typeof request === 'string' ? request : request.url;
 const caches = {keys: async () => [...stores.keys()], delete: async (name: string) => stores.delete(name), open: async (name: string) => {
  if (!stores.has(name)) stores.set(name,new Map()); const store=stores.get(name)!;
  return {put: async (request: any,response: Response) => {store.set(key(request),response);}, match: async (request: any) => store.get(key(request))?.clone(), keys: async () => [...store.keys()].map(url => ({url:new URL(url,'https://holy.test').href})), delete: async (request: any) => store.delete(key(request)), add: async (url: string) => { store.set(url,await fetcher(url)); }};
 }};
 runInNewContext(readFileSync('public/sw.js','utf8'),{caches,fetch:fetcher,URL,Response,self:{location:{origin:'https://holy.test'},clients:{claim:async()=>{}},skipWaiting:()=>{skipped++;},addEventListener:(name:string,fn:any)=>{handlers[name]=fn;}}});
 const dispatch=async (name:string,extra: any={})=>{const pending:Promise<any>[]=[];let result:Promise<Response>|undefined;handlers[name]({...extra,waitUntil:(p:Promise<any>)=>pending.push(p),respondWith:(p:Promise<Response>)=>{result=p;}});const response=await result;await Promise.all(pending);return response;};
 return {dispatch,stores,skipped:()=>skipped};
}
test('icon variants preserve application identity and point to their actual local PNGs',()=>{
 for(const type of ['symbol','full','text']) for(const theme of ['dark','light','transparent']) {
  const manifest=JSON.parse(readFileSync(`public/pwa/manifest-${type}-${theme}.json`,'utf8'));
  assert.equal(new URL(manifest.id,'https://holy.test/').href,'https://holy.test/');
  assert.equal(manifest.start_url,'/'); assert.equal(manifest.scope,'/');
  for(const size of [192,512]) {
   const icon=manifest.icons.find((icon:any)=>icon.sizes===`${size}x${size}`&&icon.purpose==='any');
   assert.equal(icon.src,`/pwa/app-v2-${type}-${theme}-${size}.png`);
   assert.equal(icon.purpose,'any');assert.equal(readFileSync('public'+icon.src).readUInt32BE(16),size);
   const adaptive=manifest.icons.find((icon:any)=>icon.sizes===`${size}x${size}`&&icon.purpose==='maskable');
   assert.equal(adaptive.src,`/pwa/adaptive-v2-${type}-${theme==='transparent'?'dark':theme}-${size}.png`);
   assert.equal(readFileSync('public'+adaptive.src).readUInt32BE(16),size);

  }
 }
});
test('offline navigation tries the root fallback and returns an explicit failure if no shell exists',async()=>{
 const w=worker(async()=>{throw Error('offline');},{'holylink-pwa-v29-youth-encounter':new Map([['/',new Response('shell')]])});
 const request={method:'GET',url:'https://holy.test/operator',mode:'navigate'};
 assert.equal(await (await w.dispatch('fetch',{request}))!.text(),'shell');
 const empty=worker(async()=>{throw Error('offline');});
 assert.equal((await empty.dispatch('fetch',{request}))!.status,503);
});
test('activation preserves unrelated caches; installation waits for explicit activation',async()=>{
 const w=worker(async()=>new Response('asset'),{'holylink-pwa-old':new Map(),'bible-cache':new Map(),'unrelated':new Map()});
 await w.dispatch('install');assert.equal(w.skipped(),0);
 await w.dispatch('activate');assert.equal(w.stores.has('holylink-pwa-old'),false);assert.equal(w.stores.has('bible-cache'),true);assert.equal(w.stores.has('unrelated'),true);
 await w.dispatch('message',{data:{type:'SKIP_WAITING'}});assert.equal(w.skipped(),1);
});
test('API and third party requests are left outside the application cache',async()=>{
 let fetched=0;const w=worker(async()=>{fetched++;return new Response('body');});
 for(const url of ['https://bible.test/chapter','https://holy.test/api/state']) assert.equal(await w.dispatch('fetch',{request:{method:'GET',mode:'cors',url}}),undefined);
 assert.equal(fetched,0);assert.equal(w.stores.size,0);
});
test('navigation caching never retains query strings or share tokens',async()=>{
 const w=worker(async()=>new Response('<html>app</html>',{headers:{'Content-Type':'text/html'}}));
 await w.dispatch('fetch',{request:{method:'GET',mode:'navigate',url:'https://holy.test/?private=secret'}});
 assert.deepEqual(Array.from([...w.stores.values()][0].keys()),['/index.html']);
});

test('runtime cache remains bounded even when icon requests carry changing queries',async()=>{
 const entries=new Map(Array.from({length:135},(_,i)=>[`https://holy.test/pwa/local-symbol-dark-192.png?v=${i}`,new Response('old')] as [string,Response]));
 const w=worker(async()=>new Response('new'),{'holylink-pwa-v29-youth-encounter':entries});
 await w.dispatch('fetch',{request:{method:'GET',mode:'cors',url:'https://holy.test/pwa/local-symbol-dark-192.png?v=next'}});
 assert.ok([...w.stores.values()][0].size<=120);
});

function pngCorner(path:string) {
 const data=readFileSync(path);assert.equal(data[24],8);assert.equal(data[25],6);
 const blocks:Buffer[]=[];
 for(let offset=8;offset<data.length;){const length=data.readUInt32BE(offset);if(data.toString('ascii',offset+4,offset+8)==='IDAT')blocks.push(data.subarray(offset+8,offset+8+length));offset+=length+12;}
 const pixels=inflateSync(Buffer.concat(blocks));assert.ok(pixels[0]<=4);
 // All PNG filter predictors are zero for the very first pixel.
 return Array.from(pixels.subarray(1,5));
}
test('actual installer files have rounded any corners and opaque adaptive/Apple backgrounds',()=>{
 for(const type of ['symbol','full','text']) {
  for(const theme of ['dark','light','transparent'])for(const size of [192,512])assert.equal(pngCorner(`public/pwa/app-v2-${type}-${theme}-${size}.png`)[3],0);
  for(const theme of ['dark','light']) {
   const background=theme==='dark'?[3,3,5,255]:[255,255,255,255];
   for(const size of [192,512])assert.deepEqual(pngCorner(`public/pwa/adaptive-v2-${type}-${theme}-${size}.png`),background);
   assert.deepEqual(pngCorner(`public/pwa/apple-v2-${type}-${theme}-180.png`),background);
  }
 }
});


test('the local globe map is installed for offline use without caching arbitrary media',async()=>{
 const requested:string[]=[];const w=worker(async request=>{requested.push(request);return new Response('<svg/>');});
 await w.dispatch('install');assert.ok(requested.includes('/media/earth-land.svg'));assert.ok(requested.includes('/brand/fju-white-v2.png'));
 const url='https://holy.test/media/earth-land.svg';const offline=worker(async()=>{throw Error('offline');},{'holylink-pwa-v29-youth-encounter':new Map([[url,new Response('<svg/>')]])});
 assert.equal(await (await offline.dispatch('fetch',{request:{method:'GET',mode:'cors',url}}))!.text(),'<svg/>');
 assert.equal(await offline.dispatch('fetch',{request:{method:'GET',mode:'cors',url:'https://holy.test/media/private-upload.mp4'}}),undefined);
 const svg=readFileSync('public/media/earth-land.svg','utf8');assert.match(svg,/viewBox="0 0 1024 512"/);assert.doesNotMatch(svg,/<script|<image|href=/i);
});
