import {useEffect,useRef,useState} from 'react';
import {useDialogFocus} from '../hooks/useDialogFocus';
import {Gauge,HardDrive,Monitor,Sparkles,RefreshCw,X,SlidersHorizontal,CheckCircle2} from './ui/icons';
import {getDetailedHardwareSpecs,usePerformanceDiagnostics,type PerformanceMode,type DetailedHardwareReport} from '../utils/performance';
const profiles:Array<{id:PerformanceMode;name:string;description:string}>=[
 {id:'auto',name:'Automático',description:'Escolhe conforme as informações disponíveis e a resposta desta aba.'},
 {id:'light',name:'Leve',description:'Reduz efeitos para exigir menos deste aparelho.'},
 {id:'balanced',name:'Equilibrado',description:'Combina efeitos e menor uso de recursos.'},
 {id:'high',name:'Detalhado',description:'Mantém mais efeitos; exige mais do aparelho.'}
];
const profileName=(id:string)=>profiles.find(profile=>profile.id===id)?.name||'Não informado';
export function HardwareBenchmarkModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}){
 const{fps,mode,effectiveMode,report,setPerformanceMode,purgeCache}=usePerformanceDiagnostics();
 const[measured,setMeasured]=useState<DetailedHardwareReport|null>(null),[measuredAt,setMeasuredAt]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const[message,setMessage]=useState<{error:boolean;text:string}|null>(null);
 const generation=useRef(0),running=useRef(false),timers=useRef(new Set<ReturnType<typeof setTimeout>>());
 const close=()=>{generation.current++;running.current=false;setBusy(false);onClose();};
 const dialogRef=useDialogFocus(isOpen,close);
 useEffect(()=>{if(!isOpen){generation.current++;running.current=false;setBusy(false);setMessage(null);}},[isOpen]);
 useEffect(()=>()=>{generation.current++;for(const timer of timers.current)clearTimeout(timer);},[]);
 const measure=async()=>{
  if(running.current)return;running.current=true;const id=++generation.current;setBusy(true);setMessage(null);
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),4000);timers.current.add(timer);});
   const result=await Promise.race([getDetailedHardwareSpecs(fps),timeout]);
   if(id!==generation.current)return;
   setMeasured(result);setMeasuredAt(new Date().toLocaleTimeString('pt-BR'));setMessage({error:false,text:'Consulta concluída. Nenhum perfil foi alterado.'});
  }catch{if(id===generation.current)setMessage({error:true,text:'Não foi possível concluir a consulta. O perfil e os arquivos foram preservados; tente novamente.'});}
  finally{if(timer){clearTimeout(timer);timers.current.delete(timer);}if(id===generation.current){running.current=false;setBusy(false);}}
 };
 const choose=(id:PerformanceMode)=>{try{setPerformanceMode(id);setMessage({error:false,text:`Perfil ${profileName(id)} salvo para este navegador.`});}catch{setMessage({error:true,text:'Não foi possível salvar o perfil neste navegador. Tente novamente.'});}};
 if(!isOpen)return null;
 const data=measured??report;
 const resolution=data?`${data.screenWidth} × ${data.screenHeight} px CSS`:'Não informada';
 return <div className="holy-theme holy-overlay hardware-overlay"><div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Diagnóstico do aparelho" tabIndex={-1} className="hardware-dialog">
  <header><div><span className="operator-eyebrow"><Gauge size={18}/>Desempenho local</span><h2>Diagnóstico e qualidade</h2><p>Dados deste navegador e deste aparelho.</p></div><button aria-label="Fechar diagnóstico" onClick={close}><X size={21}/></button></header>
  <div className="hardware-dialog-body">
   <section className="hardware-measure"><div><h3>Consulte antes de ajustar</h3><p>A consulta mede uma pequena tarefa JavaScript e lê os recursos que o navegador informa. Não testa o HDMI, a rede entre aparelhos ou a reprodução completa de um vídeo.</p><small>{measuredAt?`Última consulta solicitada: ${measuredAt}`:'Os dados abaixo vêm da consulta inicial deste navegador.'}</small></div><button className="hardware-primary" onClick={()=>{void measure();}} disabled={busy}>{busy?<RefreshCw size={19} className="animate-spin"/>:<Gauge size={19}/>}<span>{busy?'Consultando…':'Consultar aparelho'}</span></button></section>
   {message&&<p className={`hardware-message ${message.error?'is-error':''}`} role={message.error?'alert':'status'}>{message.text}</p>}
   <dl className="hardware-overview"><div><dt><Monitor size={18}/>Atualizações da aba</dt><dd>{Math.round(fps)} FPS</dd><small>Amostra contínua; não é a taxa do telão.</small></div><div><dt><HardDrive size={18}/>RAM aproximada</dt><dd>{data?.ramDisplay||'Não informada'}</dd><small>Pode ser arredondada ou omitida.</small></div><div><dt><SlidersHorizontal size={18}/>Perfil em uso</dt><dd>{profileName(effectiveMode)}</dd><small>{mode==='auto'?'Escolhido pelo modo automático.':'Escolhido por você neste navegador.'}</small></div></dl>
   <section className="hardware-profiles" aria-labelledby="hardware-profiles-title"><h3 id="hardware-profiles-title">Qualidade dos efeitos</h3><p>Escolha no próprio aparelho que deseja ajustar. Isso pode alterar os efeitos de uma projeção aberta neste navegador; não configura o PC remoto.</p><div role="group" aria-label="Perfil de desempenho">{profiles.map(profile=><button key={profile.id} aria-pressed={mode===profile.id} onClick={()=>choose(profile.id)} disabled={busy}><span><strong>{profile.name}</strong>{mode===profile.id&&<CheckCircle2 size={18}/>}</span><small>{profile.description}</small></button>)}</div><p className="hardware-footnote">A recomendação é aproximada. Nenhum perfil garante ausência de travamentos.</p></section>
   <details className="hardware-technical"><summary><Sparkles size={18}/>Informações técnicas</summary><dl>
    <div><dt>Processadores lógicos informados</dt><dd>{data?.cpuCores||'Não informados'}</dd></div>
    <div><dt>Tarefa JavaScript</dt><dd>{data?.cpuScoreMs!==undefined?`${data.cpuScoreMs} ms`:'Não medida'}</dd></div>
    <div><dt>GPU informada pelo WebGL</dt><dd>{data?.gpuRenderer||'Não informada'}</dd></div>
    <div><dt>Limite de textura</dt><dd>{data?.maxTextureSize?`${data.maxTextureSize} px`:'Não informado'}</dd></div>
    <div><dt>Área desta janela</dt><dd>{resolution}</dd></div>
    <div><dt>Memória JavaScript usada</dt><dd>{data?.jsHeapUsedMB!==undefined?`${data.jsHeapUsedMB} MB`:'Não informada'}</dd></div>
    <div><dt>Armazenamento do site (estimativa)</dt><dd>{data?.storageUsedMB!==undefined?`${data.storageUsedMB} MB usados`:'Não informado'}</dd></div>
    <div><dt>Tipo de rede estimado</dt><dd>{data?.networkType||'Não informado'}</dd></div>
   </dl><p>Informações indisponíveis não são falhas. Esta consulta não confirma o modelo exato da placa, a RAM total ou a velocidade real da conexão.</p></details>
   <section className="hardware-cache"><div><h3>Pré-carregamento</h3><p>Descarta recursos temporários. Não apaga mídias, roteiro ou autorizações e não controla a RAM do sistema.</p></div><button disabled={busy} onClick={()=>{purgeCache();setMessage({error:false,text:'Pré-carregamento limpo. Arquivos, roteiro e autorizações preservados.'});}}>Limpar pré-carregamento</button></section>
  </div><footer><span>Alterações de qualidade exigem sua escolha.</span><button className="hardware-primary" onClick={close}>Concluído</button></footer>
 </div></div>;
}
