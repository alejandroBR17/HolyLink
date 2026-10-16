import {FJU_CARDS} from './fju-content.ts';
interface Media {id:string;name:string;type:string}
interface Meeting {id:string;theme:string}
export function nextQueueItem(active:readonly string[],current:string,media:readonly Media[],meetings:readonly Meeting[],youth=false){
 if(!active.length)return {id:null,title:'Nenhum slide na fila',typeLabel:'Fila vazia',position:0};
 const index=active.indexOf(current);const position=index<0?0:(index+1)%active.length;const id=active[position];
 return {...describeQueueItem(id,media,meetings,youth),position:position+1};
}
export function describeQueueItem(id:string,media:readonly Media[],meetings:readonly Meeting[],youth=false){
 if((youth||id.startsWith('fju_'))&&FJU_CARDS[id])return{id,title:FJU_CARDS[id].title,typeLabel:'Encontro Jovem'};
 if(id==='fju_agenda')return{id,title:'Próximos encontros',typeLabel:'Agenda FJU'};
 if(youth&&id==='world_god')return{id,title:'Distrações / Conecte-se com Deus',typeLabel:'Encontro Jovem'};
 const file=media.find(item=>item.id===id);let title=id,typeLabel='Slide';
 const names:Record<string,string>={seat:'Fique à vontade',bathroom:'Vá ao banheiro',phone:'Celular no silencioso',no_chat:'Momento de concentração',soon:'Começa em instantes',social:'Redes sociais',donations:'Doações / Dízimos',campaigns:'Campanhas da igreja',world_god:'Desligue-se do mundo / Deus',baptism:'Batismo nas águas',blessing:'Despedida e bênção'};
 if(file){title=file.name;typeLabel=file.type==='video'?'Vídeo':'Imagem';}
 else if(id.startsWith('agenda_day_')){const day=Number(id.split('_')[2]);title=`Agenda: ${['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][day]||'Semana'}`;if(id.endsWith('_causas'))title+=' · Causas Impossíveis';if(id.endsWith('_fju'))title+=' · FJU';typeLabel='Agenda';}
 else if(id.startsWith('meeting_event_')){title=meetings.find(item=>item.id===id.slice('meeting_event_'.length))?.theme||'Evento da igreja';typeLabel='Evento';}
 else if(id.startsWith('verse_')){title='Versículo da sequência';typeLabel='Bíblia';}
 else {title=names[id]||'Conteúdo da sequência';if(id==='campaigns')typeLabel='Campanhas';}
 return {id,title,typeLabel};
}
