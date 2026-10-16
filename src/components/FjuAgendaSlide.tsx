import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import type {Meeting} from '../types';
import {findMeetingSchedule} from '../utils/agenda';
import {isYouthMeeting} from '../utils/projection-theme';

export function FjuAgendaSlide({meetings,now}:{meetings:Meeting[];now:Date}){
 const next=meetings.filter(isYouthMeeting).flatMap(meeting=>{const date=findMeetingSchedule(now,[meeting]).nextMeetingDate;return date?[{meeting,date}]:[];}).sort((a,b)=>a.date.getTime()-b.date.getTime()).slice(0,3);
 return <section className="fju-agenda-stage"><header><span className="fju-stage-label">SE LIGA NA AGENDA</span><h1>Próximos encontros</h1></header><div>{next.map(({meeting,date})=><article key={meeting.id}><time dateTime={date.toISOString()}><span>{format(date,'EEE, dd/MM',{locale:ptBR})}</span><strong>{format(date,'HH:mm')}</strong></time><h2>{meeting.theme}</h2></article>)}{!next.length&&<p>Acompanhe os avisos da equipe da FJU.</p>}</div></section>;
}
