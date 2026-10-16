import {useState} from 'react';
import {BookOpen,Music2,Trophy,Volleyball,Play,Check,RefreshCw,ChevronDown} from 'lucide-react';
import {FJU_MOMENTS} from '../../utils/fju-moments';

const symbols={music:Music2,book:BookOpen,trophy:Trophy,ball:Volleyball};

export function FjuMomentsControl({selected,current,obscured,onChange,onProject,onResume}:{
  selected:string[];current:string|null;obscured:boolean;
  onChange:(ids:string[])=>void;onProject:(id:string)=>void;onResume:()=>void;
}) {
  const [editing,setEditing]=useState(selected.length===0);
  const prepared=FJU_MOMENTS.filter(moment=>selected.includes(moment.id));
  const active=FJU_MOMENTS.some(moment=>moment.id===current);
  return <section className="fju-moments" aria-labelledby="fju-moments-title">
    <header><div><span className="operator-eyebrow">DO SEU JEITO</span><h3 id="fju-moments-title">Momentos do encontro</h3><p>Escolha antes. Exiba quando chegar a hora.</p></div><button type="button" className="sequence-secondary" aria-expanded={editing} aria-controls="fju-moments-choices" onClick={()=>setEditing(value=>!value)}>{editing?<Check size={17}/>:<ChevronDown size={17}/>} {editing?'Concluir escolha':'Escolher momentos'}</button></header>
    <div id="fju-moments-choices" hidden={!editing}>
      <fieldset><legend>O que vai ter neste encontro?</legend><div className="fju-moment-choices">{FJU_MOMENTS.map(moment=>{const Icon=symbols[moment.symbol];return <label key={moment.id}><input type="checkbox" checked={selected.includes(moment.id)} onChange={event=>onChange(event.target.checked?[...selected,moment.id]:selected.filter(id=>id!==moment.id))}/><Icon size={21} aria-hidden="true"/><span>{moment.name}</span></label>;})}</div></fieldset>
      <p className="fju-moments-hint">A escolha fica salva e pode ser alterada no próximo encontro. Esses cartões não entram sozinhos na fila e não iniciam músicas ou vídeos.</p>
    </div>
    {prepared.length>0?<div className="fju-moment-actions" aria-label="Momentos preparados">{prepared.map(moment=>{const Icon=symbols[moment.symbol];const live=current===moment.id;return <button type="button" key={moment.id} aria-pressed={live} aria-label={`${live?'Encerrar':'Exibir'} ${moment.name}`} onClick={()=>live?onResume():onProject(moment.id)}><Icon size={23} aria-hidden="true"/><span>{moment.name}<small>{live?'Fixado · tocar para retomar':'Exibir no telão'}</small></span>{live?<Check size={17}/>:<Play size={17}/>}</button>;})}</div>:<p className="fju-moments-hint">Nenhum momento preparado. A sequência continua como está.</p>}
    {active&&<div className="fju-moment-live"><span role="status">{obscured?'Cartão fixado. Blackout ou limpar tela está ativo.':'O cartão fica no telão até você retomar ou escolher outro conteúdo.'}</span><button type="button" className="sequence-secondary" onClick={onResume}><RefreshCw size={16}/>Retomar sequência</button></div>}
  </section>;
}
