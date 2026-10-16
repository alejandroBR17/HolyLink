import {useEffect,useState} from 'react';
import {projectionPage} from '../utils/projection-page';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import QRCode from 'react-qr-code';
import {FjuSlide} from './FjuSlide';
import {RegularSlide,StageHeading} from './RegularSlide';
import {ProjectionFire} from './ProjectionFire';
import {ProjectionGlobe} from './ProjectionGlobe';
import {symbolMotion} from '../utils/projection-motion';
import {calendarDate,localDateKey,WEEK_DAYS} from '../utils/agenda';
import {usePerformanceDiagnostics} from '../utils/performance';
import {Globe,Flame,CalendarDays,WifiOff,Droplets,PrayingHands,BookOpen} from './ui/icons';
import {CHURCH_INFO,DONATION} from '../data';
import type {Meeting} from '../types';

// Queue owns timing and outer transitions; these layouts only compose public content.
export const IconSlide=({icon:Icon,title,subtitle,layout='split-left',category}:any)=>{
 const name=String(title).toLowerCase();
 const label=category||(name.includes('silencioso')?'REVERÊNCIA E RESPEITO':name.includes('banheiro')?'ANTES DA REUNIÃO':name.includes('concentração')?'CONCENTRAÇÃO':name.includes('universal')?'COMUNICAÇÃO':name.includes('fé')?'FÉ E CONCENTRAÇÃO':'SEJA BEM-VINDO');
 return <RegularSlide title={title} subtitle={subtitle} label={label} layout={layout} symbol={<Icon/>}/>;
};

export const WorldGodSlide=({variant,backgroundStyle='auto',fps=30,detail='medium',effectiveMode:providedMode}:any)=>{
 const [phase,setPhase]=useState<'world'|'god'>('world');
 const diagnostics=usePerformanceDiagnostics();
 const settings=symbolMotion(backgroundStyle,providedMode||diagnostics.effectiveMode,fps,detail);
 useEffect(()=>{const timer=setTimeout(()=>setPhase('god'),7500);return()=>clearTimeout(timer);},[]);
 const youth=variant==='fju';
 const symbol=phase==='world'?<ProjectionGlobe {...settings} youth={youth}/>:<ProjectionFire {...settings} youth={youth}/>;
 if(youth)return <FjuSlide title={phase==='world'?'Deixe as distrações':'Conecte-se com Deus'} subtitle={phase==='world'?'Fique ligado no que acontece aqui.':'Use a sua fé. Participe do encontro.'} symbol={symbol}/>;
 return <RegularSlide label={phase==='world'?'PREPARAÇÃO':'PRESENÇA DE DEUS'} title={phase==='world'?'Desligue-se do mundo':'Ligue-se com Deus'} subtitle={phase==='world'?'Deixe as preocupações de lado e concentre-se em Deus.':'Use a sua fé e acompanhe a reunião.'} symbol={<div className="regular-world-symbol">{symbol}</div>} layout="center"/>;
};


export const AgendaDaySlide=({dayIndex,subType='all',currentTime,meetings=[],loopIteration=0}:{dayIndex:number;subType?:'causas'|'fju'|'all';currentTime:Date;meetings?:Meeting[];loopIteration?:number;variant?:string;effectiveMode?:string;isLightModeActive?:boolean})=>{
 const target=new Date(currentTime);target.setDate(target.getDate()-target.getDay()+dayIndex);
 const key=localDateKey(target);
 let daily=meetings.filter(m=>m.date?m.date===key:m.day===dayIndex);
 if(dayIndex===6&&subType==='causas')daily=daily.filter(m=>m.hours<12||/causa|jejum/i.test(m.theme));
 else if(dayIndex===6&&subType==='fju')daily=daily.filter(m=>m.hours>=12||/jovem|fju|teen|conex/i.test(m.theme));
 daily=[...daily].sort((a,b)=>a.hours*60+a.minutes-b.hours*60-b.minutes);
 const page=projectionPage(daily,loopIteration),themes=[...new Set(daily.map(m=>m.theme))];
 return <section className="regular-agenda-stage"><div className="regular-stage-frame" aria-hidden="true"/><header><span className="regular-stage-label"><i/>{currentTime.getDay()===dayIndex?'REUNIÕES DE HOJE':'AGENDA DA SEMANA'}</span><span className="regular-agenda-day">{WEEK_DAYS[dayIndex]}</span><StageHeading>{themes.length===1?themes[0]:'Reuniões e horários'}</StageHeading><span className="regular-stage-rule" aria-hidden="true"/></header><div className="regular-agenda-times">{page.items.map(m=><article key={m.id}><span>{m.date?'EVENTO ESPECIAL':'REUNIÃO'}</span><strong>{m.time}</strong><p>{m.theme}</p></article>)}{!daily.length&&<p className="regular-agenda-empty">Sem reuniões programadas para este dia.</p>}{page.pages>1&&<small>{page.page} / {page.pages}</small>}</div></section>;
};

export const DonationSlide=(_props:any)=><section className="regular-donation-stage"><RegularSlide label="DÍZIMOS E OFERTAS" title="Dízimos e Ofertas" subtitle={<>Apresente sua fidelidade e gratidão apontando a câmera para o QR Code ao lado ou acesse <strong>{DONATION.url.replace(/^https?:\/\//,'')}</strong></>} note={<><strong>Lembre-se de enviar o comprovante</strong><span>O contato de WhatsApp está disponível na página de doações.</span></>}/><div className="regular-donation-code"><div className="regular-qr-paper" data-projection-qr><QRCode value={DONATION.url} size={320} level="M" title="Doações — universal.org/doar"/></div><span>UNIVERSAL.ORG/DOAR</span></div></section>;

export const CampaignSlide=({campaigns=[],currentTime=new Date(),loopIteration=0}:any)=>{
 const today=localDateKey(currentTime);
 const active=(Array.isArray(campaigns)?campaigns:[]).filter(c=>!c.endDate||c.endDate>=today);
 const page=projectionPage<any>(active,loopIteration);
 if(!active.length)return <RegularSlide title="Ainda Não Há Propósitos em Andamento" subtitle="Para saber mais, procure um pastor ou um dos obreiros." label="PROPÓSITOS ATUAIS" symbol={<Flame/>}/>;
 return <section className="regular-campaign-stage"><div className="regular-stage-frame" aria-hidden="true"/><header><span className="regular-stage-label"><i/>FÉ EM AÇÃO</span><StageHeading>Propósitos atuais</StageHeading>{page.pages>1&&<span>{page.page} / {page.pages}</span>}</header><div className={`regular-campaign-list ${page.items.length===1?'is-single':''}`}>{page.items.map((campaign,index)=>{const key=String(campaign.iconType||campaign.type||'');const Icon=/wifi_off|daniel/.test(key)?WifiOff:/globe|ide/.test(key)?Globe:/faith|agenda/.test(key)?BookOpen:Flame;return <article key={campaign.id||index}><Icon/><div><StageHeading>{String(campaign.title)}</StageHeading><p>{campaign.duration}</p></div></article>;})}</div></section>;
};

export {ProjectedVideo as VideoSlide} from './ProjectionMedia';

export const MeetingEventSlide=({meeting}:{meeting:Meeting;variant?:string;pulse?:boolean;effectiveMode?:string;isLightModeActive?:boolean})=>{
 const day=meeting.date?calendarDate(meeting.date):null;
 const date=day?format(day,"EEEE, d 'de' MMMM",{locale:ptBR}):meeting.dayName;
 return <RegularSlide title={meeting.theme} subtitle={<>{date} <span className="regular-event-time">{meeting.time}</span></>} label="EVENTO ESPECIAL" symbol={<CalendarDays/>}/>;
};
export const BaptismSlide=({post=false}:any)=><RegularSlide title="Batismo nas Águas" subtitle="Um novo começo com Deus." label="PASSO DE FÉ E SALVAÇÃO" symbol={<Droplets/>} note={post?'Procure um pastor ou um dos obreiros.':'Após a reunião, procure um pastor ou um dos obreiros.'}/>;
export const BlessingSlide=(_props:any)=><RegularSlide title="Deus Abençoe a Sua Vida" subtitle="Vá em paz e que o Espírito Santo acompanhe você e toda a sua família." label="DESPEDIDA E FÉ" layout="center" symbol={<PrayingHands/>} note={`${CHURCH_INFO.name} — ${CHURCH_INFO.location}`}/>;
