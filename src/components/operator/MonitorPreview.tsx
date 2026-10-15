import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {useDialogFocus} from '../../hooks/useDialogFocus';
import {Monitor,Maximize,Eye,EyeOff,X} from '../ui/icons';
interface Props {children:ReactNode;title:string;detail:string;badges:ReactNode;actions:ReactNode;tools:ReactNode}
/** One silent local renderer, even while enlarged. It never controls projection playback. */
export function MonitorPreview({children,title,detail,badges,actions,tools}:Props){
 const[expanded,setExpanded]=useState(false),[paused,setPaused]=useState(false);
 const containerRef=useRef<HTMLDivElement>(null);const[scale,setScale]=useState(0);
 const expandRef=useRef<HTMLButtonElement>(null);const wasExpanded=useRef(false);
 useEffect(()=>{if(expanded){wasExpanded.current=true;return;}if(wasExpanded.current){const frame=requestAnimationFrame(()=>expandRef.current?.focus());wasExpanded.current=false;return()=>cancelAnimationFrame(frame);}},[expanded]);
 const dialogRef=useDialogFocus(expanded,()=>setExpanded(false));
 useEffect(()=>{
  const container=containerRef.current;if(!container||paused)return;
  const update=()=>setScale(container.clientWidth/1920);update();
  const observer=new ResizeObserver(update);observer.observe(container);return()=>observer.disconnect();
 },[expanded,paused]);
 const card=<section className="monitor-preview-card" aria-label="Monitor de Transmissão">
  <header className="monitor-preview-heading"><div><span className="operator-eyebrow"><Monitor size={17}/>Prévia local · 16:9</span><h3>Monitor da saída</h3><p>Composição deste operador. Confira a imagem no telão.</p></div><div className="monitor-preview-tools">{!expanded&&tools}<button type="button" aria-label={paused?'Retomar prévia local':'Pausar prévia local'} aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?<Eye size={20}/>:<EyeOff size={20}/>}</button>{expanded?<button type="button" aria-label="Fechar prévia ampliada" onClick={()=>setExpanded(false)}><X size={20}/></button>:<button type="button" ref={expandRef} aria-label="Ampliar prévia" onClick={()=>setExpanded(true)}><Maximize size={20}/></button>}</div></header>
  <div className="monitor-live-readout"><div><span>Conteúdo atual</span><h4>{title}</h4><p>{detail}</p></div><div className="monitor-state-badges">{badges}</div></div>
  <div className="monitor-screen-bezel"><div className="monitor-screen" ref={containerRef} aria-label="Composição local da projeção">
   {paused?<div className="monitor-paused"><EyeOff size={30}/><strong>Prévia pausada neste aparelho</strong><p>A projeção e a fila continuam funcionando.</p><button type="button" onClick={()=>setPaused(false)}>Retomar prévia</button></div>:<div className="console-projection-surface monitor-renderer" style={{transform:`scale(${scale})`}}>{children}</div>}
  </div></div><footer className="monitor-preview-footer"><p>{paused?'O desenho da prévia foi suspenso para reduzir o trabalho deste aparelho.':'Prévia sem áudio. Vídeos nesta tela não garantem o mesmo instante de reprodução do telão.'}</p><div>{actions}</div></footer>
 </section>;
 return expanded?<><div className="monitor-enlarged-placeholder">Prévia ampliada aberta.</div>{createPortal(<div className="holy-theme monitor-preview-overlay"><div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Prévia ampliada do Monitor" tabIndex={-1} className="monitor-preview-dialog">{card}</div></div>,document.body)}</>:card;
}
