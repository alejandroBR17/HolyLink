import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Meeting} from '../src/types.ts';
import {nextFjuEvents} from '../src/utils/fju-agenda.ts';
import {isYouthMeeting,isYouthProjection,availableInYouthLoop} from '../src/utils/projection-theme.ts';
import {isSharedStateUpdate,readSharedStorage} from '../src/utils/shared-state.ts';
const weekly=(id:string,theme:string,day:number,time:string):Meeting=>({id,theme,day,dayName:'Dia',time,hours:Number(time.slice(0,2)),minutes:Number(time.slice(3))});
test('youth agenda mixes Algo a Mais, weekly encounter and explicitly marked events by actual proximity',()=>{
 const now=new Date('2026-10-16T12:00:00');
 const meetings:Meeting[]=[weekly('encontro','Encontro Jovem',6,'15:00'),weekly('algo','Algo a Mais',5,'19:00'),{...weekly('vigilia','Vigília',0,'23:00'),date:'2026-10-18',audience:'fju'},{...weekly('church','Evento Jovem de outra agenda',5,'13:00'),audience:'church'},{...weekly('expired','FJU antigo',4,'18:00'),date:'2026-10-15'}];
 assert.deepEqual(nextFjuEvents(meetings,now).map(e=>e.meeting.id),['algo','encontro','vigilia']);
 const shifted=meetings.map(m=>m.id==='algo'?{...m,day:1}:m.id==='encontro'?{...m,day:0}:m);
 assert.deepEqual(nextFjuEvents(shifted,now).map(e=>e.meeting.id),['encontro','vigilia','algo']);
 assert.equal(nextFjuEvents(meetings,new Date('2026-10-16T20:00:00'))[0].meeting.id,'encontro');
 assert.equal(availableInYouthLoop('meeting_event_vigilia',meetings),true);
});
test('explicit audience overrides old name inference and survives validated remote/backup transport',()=>{
 assert.equal(isYouthMeeting({theme:'Algo a Mais'}),true);
 assert.equal(isYouthMeeting({theme:'Vigília',audience:'fju'}),true);
 assert.equal(isYouthMeeting({theme:'Encontro Jovem',audience:'church'}),false);
 const event={...weekly('one','Evento especial',0,'15:00'),audience:'fju' as const};
 assert.equal(isSharedStateUpdate('customMeetings',[event]),true);
 assert.equal(isSharedStateUpdate('customMeetings',[{...event,audience:'anything'}]),false);
 assert.deepEqual(JSON.parse(readSharedStorage({projection_customMeetings:JSON.stringify([event])}).projection_customMeetings),[event]);
 const now=new Date();assert.equal(isYouthProjection(null,event,new Date(now.getTime()+60000),now),true);
});
