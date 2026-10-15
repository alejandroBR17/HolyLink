import React, {useEffect,useRef,useState} from 'react';
import {LoaderCircle,CheckCircle2,AlertTriangle,ArrowRight,Layers,Volume2,HardDrive,Monitor,ShieldCheck} from 'lucide-react';
import {mediaPreloader} from '../utils/preloader';
import {LOGO_URLS} from '../constants/logos';
import {checkAllPermissions,requestSinglePermission,type PermissionStatusItem} from '../utils/permissions';
interface SmartSplashLoaderProps {
  customMediaList:Array<{id:string;type:'image'|'video';url:string}>;
  mediaReady:boolean;
  mediaLoadError?:string|null;
  currentSlideId:string;
  activeSlides:string[];
  onComplete:()=>void;
}
export function SmartSplashLoader({customMediaList,mediaReady,mediaLoadError,currentSlideId,activeSlides,onComplete}:SmartSplashLoaderProps){
  const [completed,setCompleted]=useState(0),[total,setTotal]=useState(0),[finished,setFinished]=useState(false),[failed,setFailed]=useState(0);
  const [permissions,setPermissions]=useState<PermissionStatusItem[]|null>(null);
  const [requesting,setRequesting]=useState<string|null>(null);
  const [permissionMessage,setPermissionMessage]=useState('');
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;void checkAllPermissions().then(items=>{if(mounted.current)setPermissions(items);});return()=>{mounted.current=false;};},[]);
  const requestPermission=async(id:PermissionStatusItem['id'])=>{
    setRequesting(id);setPermissionMessage('');
    const granted=await requestSinglePermission(id);
    const items=await checkAllPermissions();
    if(!mounted.current)return;
    setPermissions(items);setRequesting(null);
    setPermissionMessage(granted?'Solicitação concluída. Confira o estado atualizado.':'O navegador não liberou este recurso. Você pode continuar e conferir as configurações do aparelho.');
  };
  const complete=useRef(onComplete);complete.current=onComplete;
  const snapshot=useRef({customMediaList,currentSlideId,activeSlides});snapshot.current={customMediaList,currentSlideId,activeSlides};
  useEffect(()=>{
    if(!mediaReady)return;
    let active=true;
    const source=snapshot.current;
    void mediaPreloader.prepareStartup(source.currentSlideId,source.activeSlides,source.customMediaList,(done,count)=>{if(active){setCompleted(done);setTotal(count);}}).then(result=>{
      if(!active)return;setFinished(true);setFailed(result.failed);
    }).catch(()=>{if(active){setFailed(1);setFinished(true);}});
    return()=>{active=false;};
  },[mediaReady,mediaLoadError]);
  const warning=finished&&(failed>0||Boolean(mediaLoadError));
  const progress=total?Math.round(completed/total*100):0;
  return <div className="holy-theme holy-boot fixed inset-0 w-full h-[100dvh] z-[9999] flex items-center justify-center p-4 overflow-y-auto">
    <section className="holy-boot-console boot-preparation" aria-labelledby="boot-title">
      <div className="boot-emblem"><img src={LOGO_URLS.fullLocal} alt="HolyLink"/></div>
      <span className="operator-eyebrow"><Layers size={16}/>Preparação local</span><h1 id="boot-title">Preparar a reunião</h1>
      <p>Biblioteca local, imagens da interface e mídias próximas da fila.</p>
      <div className="boot-progress-state" role="status">{warning?<AlertTriangle size={20}/>:finished?<CheckCircle2 size={20}/>:<LoaderCircle size={20} className="animate-spin"/>}<span>{!mediaReady?'Lendo a biblioteca deste aparelho…':warning?'Alguns recursos não ficaram prontos.':finished?'Preparação inicial concluída.':`Verificando recursos iniciais (${completed}/${total})…`}</span></div>
      <div className="boot-real-progress" role="progressbar" aria-label="Verificações iniciais" aria-valuemin={0} aria-valuemax={100} aria-valuenow={mediaReady&&total?progress:undefined}><span style={{width:mediaReady&&total?`${progress}%`:'8%'}}/></div>
      {mediaLoadError&&<p className="boot-warning">{mediaLoadError} Seus arquivos não foram apagados.</p>}
      {warning&&failed>0&&<p className="boot-warning">{failed} recurso(s) não responderam ou não puderam ser preparados. Confira as mídias antes da projeção.</p>}
      {finished&&<div className="boot-permissions"><div className="boot-permissions-title"><ShieldCheck size={17}/><h2>Conferir permissões</h2><button onClick={()=>{void checkAllPermissions().then(items=>{if(mounted.current)setPermissions(items);});}} aria-label="Verificar permissões novamente"><LoaderCircle size={16}/></button></div>{permissions?permissions.map(item=>{
        const Icon=item.id==='audio'?Volume2:item.id==='storage'?HardDrive:Monitor;
        return <div className="boot-permission" key={item.id}><Icon size={18}/><div><strong>{item.title}</strong><small>{item.status==='granted'?'Liberado':item.status==='unsupported'?'Indisponível':item.status==='denied'?'Bloqueado':'Pendente'}</small><p>{item.description}</p></div>{item.status==='granted'?<CheckCircle2 className="boot-permission-ok" size={20}/>:item.status==='prompt'?<button disabled={requesting!==null} onClick={()=>{void requestPermission(item.id);}} aria-label={`Permitir ${item.title}`}>{requesting===item.id?<LoaderCircle className="animate-spin" size={17}/>:'Permitir'}</button>:<AlertTriangle size={18}/>}</div>;
      }):<p role="status">Conferindo recursos do navegador…</p>}<p role="status" className="boot-permission-message">{permissionMessage}</p><p className="boot-permission-note">Vale para este aparelho e esta aba. Ao abrir a segunda tela, confira áudio e pop-ups no PC também.</p></div>}
      {!finished&&<p className="boot-explanation">Preparando recursos locais e mídias próximas da fila. Você pode entrar enquanto a preparação continua.</p>}
      <button onClick={()=>complete.current()} disabled={requesting!==null}><ArrowRight size={18}/>{finished?'Entrar no HolyLink':'Entrar sem aguardar'}</button>
    </section>
  </div>;
}
