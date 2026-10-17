import {RefreshCw} from './ui/icons';
export function AppUpdateNotice({updating,onUpdate}: {updating:boolean;onUpdate:()=>void}) {
  return <aside className="app-update-notice" aria-label="Atualização do HolyLink">
    <div><strong>Nova versão do HolyLink</strong><p>Atualize fora da projeção ao vivo.</p></div>
    <button onClick={onUpdate} disabled={updating}><RefreshCw size={18} className={updating?'animate-spin':''}/><span>{updating?'Atualizando…':'Atualizar'}</span></button>
  </aside>;
}
