import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fingerprintMedia,planMediaMerge,readMediaManifest,mapMediaReferences} from '../src/utils/media-manifest.ts';

const item=(id:string,contentHash:string)=>({id,contentHash,type:'image' as const,name:id+'.png',size:3,duration:10000,enabledInLoop:true});
test('same bytes match regardless of filename/id; equal-length different content does not match',async()=>{
  const a=await fingerprintMedia(new Blob(['abc'])), b=await fingerprintMedia(new Blob(['xyz']));
  assert.notEqual(a,b);
  assert.equal(a,await fingerprintMedia(new Blob(['a','bc'])));
  const plan=planMediaMerge([item('pc-only',b),item('pc-shared',a)],[item('phone-renamed',a),item('new-phone-file',b)]);
  assert.deepEqual(plan.requested,[]);
  assert.equal(plan.aliases['phone-renamed'],'pc-shared');
  assert.equal(plan.aliases['new-phone-file'],'pc-only');
  assert.equal(Object.hasOwn(plan,'removed'),false);
});
test('same id and same size with different content requests replacement; unknown hashes are not trusted',()=>{
  const a='b1:'+'a'.repeat(64),b='b1:'+'b'.repeat(64);
  assert.deepEqual(planMediaMerge([item('same',a)],[item('same',b)]).requested,['same']);
  assert.deepEqual(planMediaMerge([item('same',a)],[{...item('same',a),contentHash:undefined}]).requested,['same']);
});
test('references resolve to the existing PC asset without renaming/deleting the PC file',()=>{
  const aliases=Object.fromEntries([['phone','pc']]);
  assert.equal(mapMediaReferences('manualSlideOverride','phone',aliases),'pc');
  assert.equal(mapMediaReferences('slidesOrder','["phone","pc","exclusive"]',aliases),'["pc","exclusive"]');
  assert.equal(mapMediaReferences('manualSlideOverride','constructor',aliases),'constructor');
});
test('malformed manifests fail before being applied',()=>{
  const good=item('one','b1:'+'a'.repeat(64));
  assert.equal(readMediaManifest([good]).length,1);
  assert.throws(()=>readMediaManifest([good,good]));
  assert.throws(()=>readMediaManifest([{...good,contentHash:'fake'}]));
  assert.throws(()=>readMediaManifest([{...good,size:-1}]));
});
test('fingerprinting reads slices, can be canceled and does not request a whole-file buffer',async()=>{
  class SliceOnly extends Blob {arrayBuffer():Promise<ArrayBuffer>{throw new Error('whole-file read');}}
  const file=new SliceOnly([new Uint8Array(1024*1024+3)]);
  assert.match(await fingerprintMedia(file),/^b1:[a-f0-9]{64}$/);
  await assert.rejects(fingerprintMedia(file,()=>false),{name:'AbortError'});
});
