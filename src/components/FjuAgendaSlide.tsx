import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import type {Meeting} from '../types';
import {nextFjuEvents} from '../utils/fju-agenda';

export function FjuAgendaSlide({meetings,now}:{meetings:Meeting[];now:Date}){
 const next=nextFjuEvents(meetings,now).slice(0,3);
 return <section className="fju-agenda-stage"><header><span className="fju-stage-label">SE LIGA NA AGENDA</span><h1>Próximos eventos FJU</h1></header><div>{next.map(({meeting,date},index)=><article key={meeting.id}><span className="fju-agenda-kind">{index===0?'A SEGUIR':meeting.date?'EVENTO ESPECIAL':'NA SEMANA'}</span><time dateTime={date.toISOString()}><span>{format(date,'EEE, dd/MM',{locale:ptBR})}</span><strong>{format(date,'HH:mm')}</strong></time><h2>{meeting.theme}</h2></article>)}{!next.length&&<p>Em breve, novos eventos por aqui.</p>}</div></section>;
}
