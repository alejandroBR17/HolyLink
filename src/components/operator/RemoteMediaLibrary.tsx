import {useEffect, useState} from 'react';
import {Laptop, Send, Trash2, Film, Image as ImageIcon, Eye, EyeOff} from 'lucide-react';
import type {MediaManifestItem} from '../../utils/media-manifest';
import {requestRemoteMediaDelete, projectRemoteMedia, setRemoteMediaEnabled} from '../SyncSection';

export function RemoteMediaLibrary({items, showConfirm, notify}: {
  items:MediaManifestItem[];
  showConfirm:(title:string,message:string,onConfirm:()=>void,variant?:'danger'|'info')=>void;
  notify:(message:string,type?:'success'|'error'|'info')=>void;
}) {
  const [limit,setLimit]=useState(8),[pending,setPending]=useState<string|null>(null);
  useEffect(()=>{if(pending && !items.some(item=>item.id===pending))setPending(null);},[items,pending]);
  useEffect(()=>{if(!pending)return;const timer=setTimeout(()=>{setPending(null);notify('O PC ainda não confirmou a exclusão. Confira a conexão.','error');},10000);return()=>clearTimeout(timer);},[pending,notify]);
  if(!items.length)return null;
  return <section aria-labelledby="remote-library-title" className="relative z-10 rounded-2xl border border-hl-line-strong bg-hl-canvas p-4 my-4">
    <div className="flex items-center gap-3"><Laptop className="text-hl-gold shrink-0" size={22}/><div className="min-w-0"><h3 id="remote-library-title" className="font-bold text-hl-copy">No computador conectado</h3><p className="text-xs text-hl-muted mt-1">Você pode projetar ou excluir estas mídias sem baixar os arquivos para o celular.</p></div></div>
    <ul className="mt-3 divide-y divide-hl-line-soft">{items.slice(0,limit).map(item=><li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
      {item.type==='video'?<Film size={19} className="shrink-0 text-hl-gold"/>:<ImageIcon size={19} className="shrink-0 text-hl-gold"/>}
      <div className="min-w-0 flex-1 basis-32"><p className="truncate text-sm text-hl-copy" title={item.name}>{item.name}</p><p className="text-xs text-hl-muted">{(item.size/1024/1024).toLocaleString('pt-BR',{maximumFractionDigits:1})} MB · {item.enabledInLoop?'No PC':'Pausada no PC'}</p></div>
      <div className="flex gap-2"><button type="button" aria-label={`Projetar no PC ${item.name}`} className="rounded-xl border border-hl-line px-3 py-2 text-hl-gold" onClick={()=>notify(projectRemoteMedia(item.id)?'Comando enviado. Confira o telão.':'Reconecte ao PC para projetar.','info')}><Send size={17}/></button>
      <button type="button" aria-label={`${item.enabledInLoop?'Pausar':'Ativar'} no PC ${item.name}`} className="rounded-xl border border-hl-line px-3 py-2 text-hl-soft" onClick={()=>notify(setRemoteMediaEnabled(item,!item.enabledInLoop)?'Alteração enviada ao PC.':'Reconecte ao PC para alterar.','info')}>{item.enabledInLoop?<EyeOff size={17}/>:<Eye size={17}/>}</button>
      <button type="button" disabled={pending!==null} aria-label={`Excluir do PC ${item.name}`} className="rounded-xl border border-red-900/60 px-3 py-2 text-red-300 disabled:opacity-50" onClick={()=>showConfirm('Excluir mídia do PC?',`Excluir “${item.name}” do computador e remover possíveis cópias nos aparelhos conectados? A sincronização normal nunca exclui arquivos; esta ação é explícita.`,()=>{
        if(requestRemoteMediaDelete(item.id)){setPending(item.id);notify('Exclusão solicitada. Aguardando o PC atualizar a lista.','info');}else notify('Reconecte ao PC antes de excluir.','error');
      },'danger')}><Trash2 size={17}/></button></div>
    </li>)}</ul>
    {items.length>limit && <button type="button" className="text-sm text-hl-gold py-2" onClick={()=>setLimit(value=>value+16)}>Mostrar mais arquivos do PC ({items.length-limit})</button>}
  </section>;
}
