import React, {useEffect,useRef,useState} from 'react';
import {LoaderCircle,CheckCircle2,AlertTriangle,ArrowRight,Layers} from 'lucide-react';
import {mediaPreloader} from '../utils/preloader';
import {LOGO_URLS} from '../constants/logos';
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
  const complete=useRef(onComplete);complete.current=onComplete;
  const snapshot=useRef({customMediaList,currentSlideId,activeSlides});snapshot.current={customMediaList,currentSlideId,activeSlides};
  useEffect(()=>{
    if(!mediaReady)return;
    let active=true;
    const source=snapshot.current;
    void mediaPreloader.prepareStartup(source.currentSlideId,source.activeSlides,source.customMediaList,(done,count)=>{if(active){setCompleted(done);setTotal(count);}}).then(result=>{
      if(!active)return;setFinished(true);setFailed(result.failed);
      if(!result.failed&&!mediaLoadError)complete.current();
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
      <p className="boot-explanation">A preparação verifica recursos reais e aquece somente as mídias atual e seguinte, quando houver. Vídeos, rede e capacidade do aparelho ainda podem afetar a reprodução.</p>
      <button onClick={()=>complete.current()}><ArrowRight size={18}/>{warning?'Abrir e conferir pendências':'Entrar sem aguardar'}</button>
    </section>
  </div>;
}
