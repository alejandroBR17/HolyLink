import {useCallback,useEffect,useRef,useState,type MutableRefObject} from 'react';
import {getApprovedPeerConnections} from '../components/SyncSection';
import {WindowCommandGate,validWindowCommand,validWindowResult,type ProjectionWindowCommand} from '../utils/projection-window';

export function useProjectionWindow({view,windowRef,setWindow,update}:{view:boolean;windowRef:MutableRefObject<Window|null>;setWindow:(win:Window|null)=>void;update:(key:string,value:unknown)=>void}){
  const [message,setMessage]=useState('');
  const gate=useRef(new WindowCommandGate()),pending=useRef<string|null>(null),timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const execute=useCallback((command:ProjectionWindowCommand)=>{
    let status:'open'|'closed'|'blocked'='closed';
    if(command.action==='close'){
      setWindow(null);update('projectionCloseTrigger',Date.now().toString());update('isProjectionOpen',false);
      setMessage('Janela do HolyLink fechada. O Holyrics não foi alterado.');
    }else{
      let win=windowRef.current;
      if(!win||win.closed){
        const url=new URL(location.pathname,location.origin);url.searchParams.set('projection','');
        if(localStorage.getItem('holylink_projection_prepared')==='true')url.searchParams.set('resume','1');
        let features='width=1280,height=720,menubar=no,status=no,titlebar=no';
        try{const b=JSON.parse(localStorage.getItem('holylink_projection_bounds')||'null');if(b&&[b.left,b.top,b.width,b.height].every(Number.isFinite)&&Math.abs(b.left)<=32000&&Math.abs(b.top)<=32000&&b.width>=320&&b.width<=8192&&b.height>=240&&b.height<=8192)features+=`,left=${Math.round(b.left)},top=${Math.round(b.top)},width=${Math.round(b.width)},height=${Math.round(b.height)}`;}catch{}
        try{win=window.open(url.href,'holylink_projection',features);}catch{win=null;}
      }
      if(win){setWindow(win);try{win.focus();}catch{}update('projectionCloseTrigger',null);update('isProjectionOpen',true);status='open';setMessage('Janela aberta. Na primeira vez, prepare a saída no PC. Tela cheia pode exigir um clique no PC.');}
      else{status='blocked';setMessage('O navegador bloqueou a janela. Permita pop-ups do HolyLink e clique em Abrir telão neste PC.');}
    }
    update('projectionWindowResult',{id:command.id,status,at:Date.now()});
  },[setWindow,update,windowRef]);
  useEffect(()=>{
    if(view)return;
    const receive=(event:Event)=>{
      const {key,value}=(event as CustomEvent).detail||{};
      if(key==='projectionWindowCommand'&&localStorage.getItem('projection_deviceRole')==='pc'&&validWindowCommand(value)&&gate.current.accept(value))execute(value);
      if(key==='projectionWindowResult'&&validWindowResult(value)&&pending.current===value.id){
        pending.current=null;if(timeout.current)clearTimeout(timeout.current);
        setMessage(value.status==='open'?'O PC confirmou a abertura da janela. Tela cheia pode exigir um clique no PC.':value.status==='closed'?'O PC confirmou: janela do HolyLink fechada.':'O PC recebeu, mas o navegador bloqueou a janela. Permita pop-ups e abra uma vez pelo PC.');
      }
    };
    window.addEventListener('holylink_window_message',receive);
    const poll=setInterval(()=>{if(windowRef.current?.closed){setWindow(null);update('isProjectionOpen',false);}},750);
    return()=>{window.removeEventListener('holylink_window_message',receive);clearInterval(poll);if(timeout.current)clearTimeout(timeout.current);};
  },[view,execute,setWindow,update,windowRef]);
  const request=useCallback((action:'open'|'close')=>{
    const command:ProjectionWindowCommand={id:crypto.randomUUID(),action,at:Date.now()};
    if(localStorage.getItem('projection_deviceRole')!=='phone'){execute(command);return;}
    if(!getApprovedPeerConnections().some(conn=>conn.open)){setMessage('Conecte este celular ao PC e autorize o acesso na aba Conexão.');return;}
    pending.current=command.id;setMessage('Aguardando confirmação do PC…');
    if(timeout.current)clearTimeout(timeout.current);
    timeout.current=setTimeout(()=>{if(pending.current===command.id){pending.current=null;setMessage('O PC não confirmou o comando. Confira a conexão antes de tentar novamente.');}},10000);
    update('projectionWindowCommand',command);
  },[execute,update]);
  return {request,message};
}
