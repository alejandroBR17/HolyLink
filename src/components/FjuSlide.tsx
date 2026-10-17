import type {ReactNode} from 'react';

/** Youth encounter composition: no church card, seal, icon podium or gold panel. */
export function FjuSlide({title,subtitle,symbol,label='ENCONTRO JOVEM',layout='split'}:{title:string;subtitle:string;symbol:ReactNode;label?:string;layout?:'welcome'|'statement'|'split'}){
 return <section className={`fju-stage-card fju-layout-${layout} ${title.length>100?'is-very-long':title.length>55?'is-long':''}`}><span className="fju-stage-word" aria-hidden="true">JUNTOS</span><div className="fju-stage-copy"><span className="fju-stage-label">{label}</span><h1>{title}</h1><p>{subtitle}</p><span className="fju-stage-line" aria-hidden="true"/></div><div className="fju-stage-symbol" aria-hidden="true">{symbol}</div></section>;
}
