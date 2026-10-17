import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeMediaRecord} from '../src/utils/media-record.ts';
import {MediaUrlPool} from '../src/utils/media-urls.ts';

const record=(blob=new Blob(['before']),localBlobVersion='first')=>({id:'custom_img_1',name:'Imagem',type:'image' as const,duration:10000,enabledInLoop:true,blob,localBlobVersion});

test('only file writes change a local byte revision; metadata cannot supply a foreign revision',()=>{
  const original=record();let revisions=0;const next=()=>`revision-${++revisions}`;
  const {blob:_blob,...metadata}=original;
  const renamed=mergeMediaRecord(original,{...metadata,name:'Novo nome',localBlobVersion:'foreign'},next);
  assert.equal(renamed.localBlobVersion,'first');assert.equal(renamed.blob,original.blob);assert.equal(revisions,0);
  const replaced=mergeMediaRecord(renamed,{...metadata,blob:new Blob(['after!'])},next);
  assert.equal(replaced.blob?.size,original.blob.size);assert.equal(replaced.localBlobVersion,'revision-1');
  assert.equal(mergeMediaRecord(undefined,original,next).localBlobVersion,'revision-2');
});

test('metadata keeps the playback URL; replacement and explicit retry read new bytes',async()=>{
  let serial=0;const created:Blob[]=[],revoked:string[]=[];
  const pool=new MediaUrlPool(blob=>{created.push(blob);return `blob:${++serial}`;},url=>revoked.push(url),15);
  const original=record();assert.equal(pool.update([original]).get(original.id),'blob:1');
  assert.equal(pool.update([{...original,name:'Renomeada',order:2,muted:true}]).get(original.id),'blob:1');
  const replacement=record(new Blob(['after!']),'second');assert.equal(pool.update([replacement]).get(original.id),'blob:2');
  assert.equal(await created[1].text(),'after!');assert.deepEqual(revoked,[],'transition grace retains old source');
  assert.equal(pool.update([replacement],original.id).get(original.id),'blob:3');
  await new Promise(resolve=>setTimeout(resolve,25));assert.deepEqual(revoked,['blob:1','blob:2']);
  pool.dispose();assert.deepEqual(revoked,['blob:1','blob:2','blob:3']);pool.dispose();assert.equal(revoked.length,3);
});

test('delete, missing bytes and unmount release all URLs, without delayed double revocation',async()=>{
  let serial=0;const revoked:string[]=[];
  const pool=new MediaUrlPool(()=>`blob:${++serial}`,url=>revoked.push(url),15);
  const original=record();pool.update([original]);
  assert.equal(pool.update([{...original,blob:undefined}]).get(original.id),undefined,'missing file cannot display old bytes');
  pool.update([original]);pool.update([]);pool.update([original]);pool.dispose();
  assert.deepEqual(new Set(revoked),new Set(['blob:1','blob:2','blob:3']));
  await new Promise(resolve=>setTimeout(resolve,25));assert.equal(revoked.length,3);
});
