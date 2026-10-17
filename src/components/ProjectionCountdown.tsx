import type {ReactNode} from 'react';

export function CountdownReadout({hours,minutes}:{hours:string;minutes:string}){
 return <div className="projection-hours"><span>Horário previsto em</span><div><strong>{hours}<small>h</small></strong><i aria-hidden="true">:</i><strong>{minutes}<small>min</small></strong></div></div>;
}
export function ProjectionCountdown({seconds,final,video,fullVideo=false,youth=false,children}:{seconds:number;final:boolean;video:boolean;fullVideo?:boolean;youth?:boolean;children:ReactNode}){
 const value=Math.max(0,Math.floor(seconds));
 if(final&&video&&fullVideo)return <div className="projection-countdown-full-media">{children}</div>;
 const split=!final||video;
 return <section className={`projection-countdown ${split?'is-split':'is-final'} ${final?'last-minute':''}`} data-countdown-phase={final?'minute':'five'} aria-label={final?'Último minuto':'Últimos cinco minutos'}>
  <div className="projection-countdown-clock"><span className="projection-countdown-kicker">{youth?'Encontro Jovem':'Reunião'}</span><h1>Horário previsto em</h1>
   {final?<div className="projection-seconds-dial"><svg viewBox="0 0 420 420" aria-hidden="true"><circle cx="210" cy="210" r="190"/><circle className="projection-dial-progress" cx="210" cy="210" r="190" pathLength="60" strokeDasharray="60" strokeDashoffset={60-Math.min(60,value)}/></svg><strong data-countdown-value>{String(value).padStart(2,'0')}</strong><span>{value===1?'segundo':'segundos'}</span></div>:
   <div className="projection-minutes-digits" data-countdown-value><div><strong>{String(Math.floor(value/60)).padStart(2,'0')}</strong><span>min</span></div><i aria-hidden="true">:</i><div><strong>{String(value%60).padStart(2,'0')}</strong><span>seg</span></div></div>}
   {!final&&<div className="projection-countdown-track" aria-hidden="true"><i style={{width:`${Math.max(0,Math.min(100,(300-value)/240*100))}%`}}/></div>}
   <p>{youth?'Fique por perto e acompanhe o encontro.':'Mantenha o silêncio e a concentração.'}</p>
  </div>
  {split&&<div className="projection-countdown-media"><div className="projection-countdown-composition">{children}</div></div>}
 </section>;
}
export function ProjectionMeetingStart({children}:{children:ReactNode}){
 return <section className="projection-meeting-start" data-countdown-phase="started"><div>{children}</div></section>;
}
