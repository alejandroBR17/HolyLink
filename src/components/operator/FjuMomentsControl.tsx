import {useState} from 'react';
import {BookOpen,Music2,Trophy,Volleyball,Check,ChevronDown} from 'lucide-react';
import {FJU_MOMENTS} from '../../utils/fju-moments';
const symbols={music:Music2,book:BookOpen,trophy:Trophy,ball:Volleyball};
export function FjuMomentsControl({selected,mode,onChange}:{selected:string[];mode:'pre'|'post';onChange:(ids:string[])=>void}) {
  const [editing,setEditing]=useState(selected.length===0);
  const prepared=FJU_MOMENTS.filter(moment=>selected.includes(moment.id));
  return <section className="fju-moments" aria-labelledby="fju-moments-title">
    <header><div><span className="operator-eyebrow">ANTES DO ENCONTRO</span><h3 id="fju-moments-title">O que vai ter no encontro?</h3><p>Os anúncios escolhidos passam juntos na sequência automática.</p></div><button type="button" className="sequence-secondary" aria-expanded={editing} aria-controls="fju-moments-choices" onClick={()=>setEditing(value=>!value)}>{editing?<Check size={17}/>:<ChevronDown size={17}/>} {editing?'Concluir escolha':'Escolher momentos'}</button></header>
    <div id="fju-moments-choices" hidden={!editing}><fieldset><legend>Selecione a programação deste encontro</legend><div className="fju-moment-choices">{FJU_MOMENTS.map(moment=>{const Icon=symbols[moment.symbol];return <label key={moment.id}><input type="checkbox" checked={selected.includes(moment.id)} onChange={event=>onChange(event.target.checked?[...selected,moment.id]:selected.filter(id=>id!==moment.id))}/><Icon size={21} aria-hidden="true"/><span>{moment.name}</span></label>;})}</div></fieldset><p className="fju-moments-hint">A escolha fica salva. Confira antes de cada encontro. Esportes anuncia a atividade após o encontro; nenhum cartão inicia música ou vídeo.</p></div>
    <p className="fju-moments-hint" role="status">{prepared.length?`${prepared.map(moment=>moment.name).join(' · ')}. ${mode==='pre'?'Na fila de pré-encontro.':'A escolha será usada no pré-encontro; anúncios ficam fora do pós-encontro.'}`:'Nenhum momento selecionado. Escolha somente o que vai acontecer.'}</p>
  </section>;
}
