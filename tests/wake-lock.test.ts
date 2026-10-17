import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isWakeLockActive,isWakeLockRequested,releaseWakeLock,requestWakeLock,resumeWakeLock,subscribeWakeLock} from '../src/utils/wakeLock.ts';

class Lock extends EventTarget{
  released=false;releases=0;
  async release(){this.releases++;this.released=true;this.dispatchEvent(new Event('release'));}
}
async function environment(run:(context:{doc:EventTarget&{visibilityState:string};storage:Map<string,string>;setRequest:(callback:()=>Promise<Lock>)=>void})=>Promise<void>){
  const keys=['navigator','document','window','localStorage'];const descriptors=keys.map(key=>Object.getOwnPropertyDescriptor(globalThis,key));
  const storage=new Map<string,string>(),doc=Object.assign(new EventTarget(),{visibilityState:'visible'});
  let request=async()=>new Lock();
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{wakeLock:{request:()=>request()}}});
  Object.defineProperty(globalThis,'document',{configurable:true,value:doc});
  Object.defineProperty(globalThis,'window',{configurable:true,value:new EventTarget()});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)}});
  try{await releaseWakeLock();await run({doc,storage,setRequest:callback=>{request=callback;}});}finally{
    await releaseWakeLock();keys.forEach((key,index)=>{if(descriptors[index])Object.defineProperty(globalThis,key,descriptors[index]!);else Reflect.deleteProperty(globalThis,key);});
  }
}
const tick=()=>new Promise<void>(resolve=>setImmediate(resolve));
test('concurrent screen lock requests share one actual browser acquisition',()=>environment(async({setRequest})=>{
  let calls=0;setRequest(async()=>{calls++;return new Lock();});
  assert.deepEqual(await Promise.all([requestWakeLock(),requestWakeLock(),resumeWakeLock()]),[true,true,true]);
  assert.equal(calls,1);assert.equal(isWakeLockActive(),true);
}));
test('turning off while acquisition is pending releases a late grant',()=>environment(async({setRequest,storage})=>{
  let resolve!:(lock:Lock)=>void;setRequest(()=>new Promise(done=>{resolve=done;}));
  const requested=requestWakeLock();await tick();await releaseWakeLock();const lock=new Lock();resolve(lock);
  assert.equal(await requested,false);assert.equal(lock.releases,1);assert.equal(isWakeLockActive(),false);assert.equal(isWakeLockRequested(),false);
  assert.equal(storage.get('holylink_keep_screen_awake'),'false');assert.equal(await resumeWakeLock(),false);
}));
test('automatic visible returns honor a disabled preference and an explicit enable restores it',()=>environment(async({doc,setRequest})=>{
  let calls=0;setRequest(async()=>{calls++;return new Lock();});const unsubscribe=subscribeWakeLock(()=>{});
  try{doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(calls,0);
    assert.equal(await requestWakeLock(),true);assert.equal(calls,1);await releaseWakeLock();
    doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(calls,1);assert.equal(isWakeLockActive(),false);
  }finally{unsubscribe();}
}));
test('browser release notifies observers without an immediate retry loop',()=>environment(async({doc,setRequest})=>{
  let calls=0;const locks:Lock[]=[];setRequest(async()=>{calls++;const lock=new Lock();locks.push(lock);return lock;});
  let changes=0;const unsubscribe=subscribeWakeLock(()=>{changes++;});
  try{await requestWakeLock();const before=changes;await locks[0].release();await tick();assert.ok(changes>before);assert.equal(isWakeLockActive(),false);assert.equal(calls,1);
    doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(calls,2);assert.equal(isWakeLockActive(),true);
  }finally{unsubscribe();}
}));
test('a synchronously rejected request can be retried and never claims a grant',()=>environment(async({setRequest})=>{
  let calls=0;setRequest(()=>{calls++;throw new Error('NotAllowedError');});
  assert.equal(await requestWakeLock(),false);assert.equal(isWakeLockActive(),false);
  assert.equal(await requestWakeLock(),false);assert.equal(calls,2);
}));
test('a late grant while hidden is released without disabling the saved preference',()=>environment(async({doc,setRequest})=>{
  let resolve!:(lock:Lock)=>void;setRequest(()=>new Promise(done=>{resolve=done;}));const requested=requestWakeLock();await tick();doc.visibilityState='hidden';const lock=new Lock();resolve(lock);
  assert.equal(await requested,false);assert.equal(lock.released,true);assert.equal(isWakeLockActive(),false);assert.equal(isWakeLockRequested(),true);
}));
