import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readVideoDuration,VideoMetadataError,type MetadataVideo} from '../src/utils/video-metadata.ts';

function fixture(duration=1.234){
  const stats={created:0,revoked:[] as string[],paused:0,unloaded:0};
  const video={duration,preload:'',src:'',onloadedmetadata:null,onerror:null,pause:()=>stats.paused++,removeAttribute:()=>{video.src='';},load:()=>stats.unloaded++} as unknown as MetadataVideo;
  const options={createVideo:()=>video,createUrl:()=>{stats.created++;return 'blob:metadata';},revokeUrl:(url:string)=>{stats.revoked.push(url);},timeoutMs:15};
  return {video,stats,options};
}
const event=(callback:MetadataVideo['onerror'],video:MetadataVideo)=>callback?.call(video as HTMLVideoElement,new Event('error'));

test('metadata resolves milliseconds and tears down its decoder exactly once despite late events',async()=>{
  const f=fixture(),promise=readVideoDuration(new Blob(['video']),f.options),late=f.video.onerror;
  f.video.onloadedmetadata?.call(f.video as HTMLVideoElement,new Event('loadedmetadata'));
  assert.equal(await promise,1234);event(late,f.video);await new Promise(r=>setTimeout(r,25));
  assert.deepEqual(f.stats,{created:1,revoked:['blob:metadata'],paused:1,unloaded:1});assert.equal(f.video.src,'');assert.equal(f.video.onerror,null);
});
test('no metadata event has a bounded deadline and cannot leave the source allocated',async()=>{
  const f=fixture();await assert.rejects(readVideoDuration(new Blob(['video']),f.options),error=>error instanceof VideoMetadataError&&/12 segundos/.test(error.message));
  assert.deepEqual(f.stats.revoked,['blob:metadata']);assert.equal(f.stats.unloaded,1);
});
test('decode errors and invalid durations are rejected instead of entering the queue as ten seconds',async()=>{
  const failed=fixture(),pending=readVideoDuration(new Blob(['bad']),failed.options);event(failed.video.onerror,failed.video);await assert.rejects(pending,VideoMetadataError);
  for(const duration of [0,NaN,Infinity,-1]){const f=fixture(duration),pending=readVideoDuration(new Blob(['video']),f.options);f.video.onloadedmetadata?.call(f.video as HTMLVideoElement,new Event('loadedmetadata'));await assert.rejects(pending,VideoMetadataError);assert.equal(f.stats.revoked.length,1);}
});
test('abort, empty files and allocation errors release resources and never pretend success',async()=>{
  const f=fixture(),controller=new AbortController(),promise=readVideoDuration(new Blob(['video']),{...f.options,signal:controller.signal});controller.abort();await assert.rejects(promise,{name:'AbortError'});assert.equal(f.stats.revoked.length,1);
  const early=fixture();await assert.rejects(readVideoDuration(new Blob(['video']),{...early.options,signal:controller.signal}),{name:'AbortError'});assert.equal(early.stats.created,0);
  await assert.rejects(readVideoDuration(new Blob([]),early.options),VideoMetadataError);assert.equal(early.stats.created,0);
  await assert.rejects(readVideoDuration(new Blob(['video']),{...early.options,createUrl:()=>{throw new Error('allocation');}}),VideoMetadataError);assert.equal(early.stats.unloaded,1);
});
