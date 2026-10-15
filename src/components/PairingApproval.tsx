import {createPortal} from 'react-dom';
import {useState} from 'react';
import {ShieldCheck} from './ui/icons';
import {useDialogFocus} from '../hooks/useDialogFocus';
export function PairingApproval({code,canRemember=false,onApprove,onReject}:{code:string;canRemember?:boolean;onApprove:(remember:boolean,label:string)=>void;onReject:()=>void}) {
 const ref=useDialogFocus(true,onReject);const[remember,setRemember]=useState(true);const[label,setLabel]=useState('Meu celular');
 return createPortal(<div className="holy-theme fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"><div ref={ref} role="dialog" aria-modal="true" aria-labelledby="pairing-approval-title" tabIndex={-1} className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-3xl border border-hl-line-strong bg-hl-panel p-6 shadow-2xl text-hl-copy">
  <ShieldCheck size={30} className="text-hl-gold mb-4"/><h2 id="pairing-approval-title" className="text-xl font-bold">Permitir este celular?</h2>
  <p className="text-sm text-hl-muted mt-3">Compare com o código exibido no celular. Ao permitir, ele poderá controlar a projeção e sincronizar dados com este PC.</p>
  <p className="my-5 rounded-xl border border-hl-line bg-hl-canvas p-4 text-center font-mono text-3xl tracking-widest text-hl-gold" aria-label={`Código de confirmação ${code}`}>{code}</p>
  {canRemember&&<div className="pairing-remember"><label><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/><span>Lembrar este celular e reconectar automaticamente</span></label>{remember&&<label className="pairing-device-label">Nome para identificar depois<input value={label} maxLength={48} onChange={event=>setLabel(event.target.value)} placeholder="Meu celular"/></label>}<p>Você pode remover a autorização na aba Conexão. Nenhum arquivo será copiado ao reconectar.</p></div>}
  <p className="text-xs text-hl-muted mb-5">A solicitação expira em um minuto. Se não foi você, recuse.</p><div className="pairing-approval-actions"><button type="button" onClick={onReject}>Recusar</button><button type="button" onClick={()=>onApprove(canRemember&&remember,label)}>Permitir controle</button></div>
 </div></div>,document.body);
}
