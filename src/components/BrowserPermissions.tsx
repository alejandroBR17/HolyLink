import {useEffect,useRef,useState} from 'react';
import {AlertTriangle,CheckCircle2,HardDrive,LoaderCircle,Monitor,RefreshCw,ShieldCheck,Volume2} from './ui/icons';
import {checkAllPermissions,requestSinglePermission,type PermissionStatusItem} from '../utils/permissions';
import {subscribeWakeLock} from '../utils/wakeLock';

export function BrowserPermissions({startup=false}:{startup?:boolean}){
  const [items,setItems]=useState<PermissionStatusItem[]|null>(null);
  const [checking,setChecking]=useState(true);
  const [requesting,setRequesting]=useState<string|null>(null);
  const [attemptedStorage,setAttemptedStorage]=useState(false);
  const mounted=useRef(false),busy=useRef(false);
  useEffect(()=>{
    mounted.current=true;
    const refresh=()=>{void checkAllPermissions().then(result=>{if(mounted.current){setItems(result);setChecking(false);}});};
    refresh();const unsubscribe=subscribeWakeLock(refresh);
    return()=>{mounted.current=false;unsubscribe();};
  },[]);
  const verify=async()=>{
    if(busy.current)return;
    busy.current=true;setChecking(true);
    const result=await checkAllPermissions();
    busy.current=false;
    if(mounted.current){setItems(result);setChecking(false);}
  };
  const request=async(id:PermissionStatusItem['id'])=>{
    if(busy.current)return;
    busy.current=true;setRequesting(id);
    if(id==='storage')setAttemptedStorage(true);
    await requestSinglePermission(id);
    const result=await checkAllPermissions();
    busy.current=false;
    if(mounted.current){setItems(result);setRequesting(null);}
  };
  // Audio needs this tab's gesture; screen lock is a temporary session resource.
  // Both resume on entry, instead of presenting repeated permission dialogs.
  const pending=items?.filter(item=>item.status!=='granted'&&(!startup||item.id==='storage'&&(item.status==='prompt'||attemptedStorage)));
  if(startup&&(!pending||!pending.length))return null;
  return <section className="boot-permissions browser-permissions" aria-label="Permissões do navegador">
    <div className="boot-permissions-title"><ShieldCheck size={17}/><h2>{startup?'Permissões pendentes':'Acessos deste aparelho'}</h2><button disabled={checking||requesting!==null} onClick={()=>{void verify();}} aria-label="Verificar permissões novamente">{checking?<LoaderCircle className="animate-spin" size={16}/>:<RefreshCw size={16}/>}<span>{checking?'Verificando…':'Verificar'}</span></button></div>
    {pending?.map(item=>{
      const Icon=item.id==='audio'?Volume2:item.id==='storage'?HardDrive:Monitor;
      const canRequest=item.status==='prompt'||!startup&&item.status==='denied';
      return <div className="boot-permission" key={item.id}><Icon size={18}/><div><strong>{item.title}</strong><small>{requesting===item.id?'Solicitando…':item.status==='unsupported'?'Indisponível':item.status==='denied'?'Não concedida':item.disabledByChoice?'Desativado':'Pendente'}</small><p role={item.status==='denied'?'status':undefined}>{item.description}</p></div>{canRequest?<button disabled={checking||requesting!==null} onClick={()=>{void request(item.id);}} aria-label={item.disabledByChoice?'Ativar tela acesa':item.id==='storage'?'Solicitar proteção dos arquivos locais':`Permitir ${item.title}`}>{requesting===item.id?<LoaderCircle className="animate-spin" size={17}/>:item.disabledByChoice?'Ativar':item.status==='denied'?'Tentar novamente':item.id==='storage'?'Solicitar proteção':'Permitir'}</button>:<AlertTriangle size={18}/>}</div>;
    })}
    {!startup&&items&&pending?.length===0&&<p className="boot-permission-message" role="status"><CheckCircle2 size={17}/>Recursos disponíveis neste aparelho.</p>}
    {!items&&<p role="status">Conferindo recursos do navegador…</p>}
    <p className="boot-permission-note">A proteção já concedida é reconhecida automaticamente. Áudio e tela acesa dependem da sessão atual; você pode conferi-los aqui quando precisar.</p>
  </section>;
}
