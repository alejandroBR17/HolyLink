// Device preference and browser grant are separate. Never persist a fake grant.
const PREFERENCE_KEY='holylink_keep_screen_awake';
let wanted=true;
let sentinel:WakeLockSentinel|null=null;
let generation=0;
let pending:{generation:number;promise:Promise<boolean>}|null=null;
const listeners=new Set<()=>void>();
const emit=()=>{for(const listener of listeners)listener();};

export function isWakeLockSupported(){return typeof navigator!=='undefined'&&typeof navigator.wakeLock?.request==='function';}
export function isWakeLockActive(){return Boolean(sentinel&&!sentinel.released);}
export function isWakeLockRequested(){
  try{const saved=localStorage.getItem(PREFERENCE_KEY);if(saved!==null)return saved!=='false';}catch{/* Use in-memory preference if storage is unavailable. */}
  return wanted;
}
function setWanted(value:boolean){wanted=value;try{localStorage.setItem(PREFERENCE_KEY,String(value));}catch{/* Session preference still works. */}emit();}
async function stop(){
  generation++;pending=null;
  const previous=sentinel;sentinel=null;emit();
  try{await previous?.release();}catch{/* Already released or browser unavailable. */}
}
async function acquire():Promise<boolean>{
  if(!isWakeLockRequested()||!isWakeLockSupported())return false;
  if(typeof document!=='undefined'&&document.visibilityState!=='visible')return false;
  if(isWakeLockActive())return true;
  if(pending?.generation===generation)return pending.promise;
  const version=generation;
  const promise=(async()=>{
    try{
      const candidate=await Promise.resolve().then(()=>navigator.wakeLock.request('screen'));
      if(version!==generation||!isWakeLockRequested()||typeof document!=='undefined'&&document.visibilityState!=='visible'){
        try{await candidate.release();}catch{/* Late grant must never reactivate the UI. */}
        return false;
      }
      sentinel=candidate;
      candidate.addEventListener('release',()=>{
        if(sentinel===candidate){sentinel=null;emit();}
        // Retry on a visible return or user action, not every browser release.
      });
      emit();return isWakeLockActive();
    }catch{emit();return false;}
    finally{if(pending?.generation===version)pending=null;}
  })();
  pending={generation:version,promise};return promise;
}
export async function requestWakeLock(){setWanted(true);return acquire();}
export async function releaseWakeLock(){setWanted(false);await stop();}
export async function resumeWakeLock(){
  if(!isWakeLockRequested()){await stop();return false;}
  return acquire();
}
const onVisible=()=>{if(document.visibilityState==='visible')void resumeWakeLock();};
const onPreference=(event:StorageEvent)=>{if(event.key===PREFERENCE_KEY||event.key===null){void resumeWakeLock();emit();}};
export function subscribeWakeLock(listener:()=>void){
  listeners.add(listener);
  if(listeners.size===1){
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',onVisible);
    if(typeof window!=='undefined')window.addEventListener('storage',onPreference);
  }
  return()=>{
    listeners.delete(listener);
    if(!listeners.size){
      if(typeof document!=='undefined')document.removeEventListener('visibilitychange',onVisible);
      if(typeof window!=='undefined')window.removeEventListener('storage',onPreference);
    }
  };
}
