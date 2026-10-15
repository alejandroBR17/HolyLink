import {requestWakeLock,isWakeLockActive,isWakeLockRequested,isWakeLockSupported} from './wakeLock';
export interface PermissionStatusItem {
  id:'audio'|'storage'|'notifications'|'wakelock'|'projection_window';
  title:string;description:string;
  status:'granted'|'prompt'|'denied'|'unsupported';
  disabledByChoice?:boolean;
}
let audioContext:AudioContext|null=null;
// Remember the request outcome for UX; persisted() remains authoritative.
let storageRequested=false;
const STORAGE_DECISION_KEY='holylink_storage_request_v1';
function storageDecision(){try{return localStorage.getItem(STORAGE_DECISION_KEY);}catch{return null;}}
function rememberStorageDecision(granted:boolean){try{localStorage.setItem(STORAGE_DECISION_KEY,granted?'granted':'declined');}catch{/* Browser state remains authoritative. */}}
function getAudioContext(){
  if(typeof window==='undefined')return null;
  const AudioCtx=window.AudioContext||(window as Window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!AudioCtx)return null;
  if(!audioContext||audioContext.state==='closed')audioContext=new AudioCtx();
  return audioContext;
}
async function unlockAudio(){
  try{
    const ctx=getAudioContext();if(!ctx)return false;
    if(ctx.state!=='running')await bounded(ctx.resume(),undefined);
    return ctx.state==='running';
  }catch{return false;}
}
async function bounded<T>(task:Promise<T>,fallback:T):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([task,new Promise<T>(resolve=>{timer=setTimeout(()=>resolve(fallback),2500);})]);}finally{clearTimeout(timer);}
}
let unlockRegistered=false;
export function setupGlobalAudioUnlock(){
  if(typeof window==='undefined'||unlockRegistered)return;
  unlockRegistered=true;
  const events=['click','touchstart','keydown','pointerdown'];
  const unlock=()=>{void unlockAudio();events.forEach(type=>window.removeEventListener(type,unlock,true));};
  events.forEach(type=>window.addEventListener(type,unlock,{once:true,capture:true}));
}
export async function checkAllPermissions():Promise<PermissionStatusItem[]>{
  let audio:'granted'|'prompt'|'unsupported'='unsupported';
  try{const ctx=getAudioContext();if(ctx)audio=ctx.state==='running'?'granted':'prompt';}catch{}
  let storage:PermissionStatusItem['status']='unsupported';
  try{if(navigator.storage?.persisted&&navigator.storage?.persist){
    const granted=await bounded(navigator.storage.persisted(),false);
    storage=granted?'granted':storageRequested||storageDecision()==='declined'?'denied':'prompt';
    if(granted){storageRequested=false;rememberStorageDecision(true);}
  }}catch{storage='unsupported';}
  return [
    {id:'audio',title:'Áudio',description:audio==='granted'?'Sessão de áudio liberada nesta aba.':audio==='prompt'?'Toque para liberar o áudio nesta aba.':'O navegador não disponibilizou a sessão de áudio.',status:audio},
    {id:'storage',title:'Proteger arquivos locais',description:storage==='granted'?'Proteção persistente concedida pelo navegador.':storage==='prompt'?'Solicite proteção extra contra limpeza automática. O navegador decide se pode concedê-la.':storage==='denied'?'O navegador não confirmou a proteção extra. Seus arquivos continuam no armazenamento local comum. Você pode entrar normalmente.':'Proteção extra indisponível neste navegador. Você pode usar o armazenamento local comum.',status:storage},
    {id:'wakelock',title:'Manter tela acesa',disabledByChoice:!isWakeLockRequested(),description:isWakeLockActive()?'Tela acesa solicitada neste aparelho.':!isWakeLockRequested()?'Você desativou esta opção. Ative aqui se quiser impedir o repouso.':'Evita o repouso enquanto a aba estiver visível e o navegador permitir.',status:isWakeLockSupported()?isWakeLockActive()?'granted':'prompt':'unsupported'},
  ];
}
export async function requestSinglePermission(id:PermissionStatusItem['id']):Promise<boolean>{
  try{
    if(id==='audio')return await unlockAudio();
    if(id==='storage'){
      storageRequested=true;
      let granted=false;
      try{granted=navigator.storage?.persist?await bounded(navigator.storage.persist(),false):false;}
      finally{rememberStorageDecision(granted);}
      return granted;
    }
    if(id==='wakelock')return await bounded(requestWakeLock(),false);
    // System notifications are not used by the current projection workflow.
    // Opening a second screen must be tested by its actual window.open action.
    return false;
  }catch{return false;}
}
