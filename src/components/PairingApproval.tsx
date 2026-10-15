import {createPortal} from 'react-dom';
import {ShieldCheck} from 'lucide-react';
import {useDialogFocus} from '../hooks/useDialogFocus';

export function PairingApproval({code, onApprove, onReject}: {
  code: string; onApprove: () => void; onReject: () => void;
}) {
  const ref = useDialogFocus(true, onReject);
  // SyncSection stays mounted in a hidden tab: the approval must remain visible.
  return createPortal(<div className="holy-theme fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="pairing-approval-title" tabIndex={-1}
      className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-3xl border border-hl-line-strong bg-hl-panel p-6 shadow-2xl text-hl-copy">
      <ShieldCheck size={30} className="text-hl-gold mb-4"/>
      <h2 id="pairing-approval-title" className="text-xl font-bold">Permitir este celular?</h2>
      <p className="text-sm text-hl-muted mt-3">Confira se o código abaixo é o mesmo exibido no celular que você está conectando. Ele poderá controlar a projeção e sincronizar os dados deste PC.</p>
      <p className="my-5 rounded-xl border border-hl-line bg-hl-canvas p-4 text-center font-mono text-3xl tracking-widest text-hl-gold" aria-label={`Código de confirmação ${code}`}>{code}</p>
      <p className="text-xs text-hl-muted mb-5">A solicitação expira em um minuto. Se não foi você, recuse.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onReject} className="flex-1 rounded-xl border border-hl-line px-4 py-3 text-hl-soft hover:bg-hl-raised">Recusar</button>
        <button type="button" onClick={onApprove} className="flex-1 rounded-xl bg-hl-gold px-4 py-3 font-bold text-hl-ink hover:bg-hl-gold-bright">Permitir controle</button>
      </div>
    </div>
  </div>, document.body);
}
