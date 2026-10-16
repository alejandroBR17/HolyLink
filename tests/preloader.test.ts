import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MediaPreloaderService} from '../src/utils/preloader.ts';
test('warmup reports real outcomes, deduplicates pending requests and never caches a failed load',async()=>{
  const requests:string[]=[];
  class FakeMedia extends EventTarget {
    naturalWidth=64;readyState=2;complete=false;preload='';muted=false;playsInline=false;referrerPolicy='';private value='';
    get src(){return this.value;}
    set src(url:string){this.value=url;requests.push(url);if(url.includes('slow'))return;queueMicrotask(()=>{if(this.value===url)this.dispatchEvent(new Event(url.includes('broken')?'error':'load'));});}
    async decode(){} pause(){} load(){} removeAttribute(){this.value='';}
  }
  const savedImage=Object.getOwnPropertyDescriptor(globalThis,'Image'),savedDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'Image',{configurable:true,value:FakeMedia});Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>new FakeMedia()}});
  try{
    const svc=new MediaPreloaderService();
    const a=svc.preloadImage('one'),b=svc.preloadImage('one');assert.equal(a,b);assert.equal(await a,true);assert.equal(requests.filter(r=>r==='one').length,1);
    assert.equal(await svc.preloadImage('broken'),false);assert.equal(await svc.preloadImage('broken'),false);assert.equal(requests.filter(r=>r==='broken').length,2);
    const pending=svc.preloadImage('slow');svc.evictUrl('slow');assert.equal(await pending,false);
    const pendingAgain=svc.preloadImage('slow');svc.clearCache();assert.equal(await pendingAgain,false);
    const progress:number[]=[];
    const result=await svc.prepareStartup('custom_b',['custom_a','custom_b','custom_c'],[{id:'custom_a',type:'image',url:'not-next'},{id:'custom_b',type:'image',url:'current'},{id:'custom_c',type:'image',url:'next'}],(done)=>progress.push(done));
    assert.deepEqual(result,{checked:9,failed:0});assert.deepEqual(progress,[0,1,2,3,4,5,6,7,8,9]);assert.ok(requests.includes('/brand/fju-white-v2.png'));assert.ok(requests.includes('current')&&requests.includes('next'));assert.ok(!requests.includes('not-next'));
  }finally{if(savedImage)Object.defineProperty(globalThis,'Image',savedImage);else delete (globalThis as {Image?:unknown}).Image;if(savedDocument)Object.defineProperty(globalThis,'document',savedDocument);else delete (globalThis as {document?:unknown}).document;}
});
