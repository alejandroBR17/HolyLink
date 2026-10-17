import test from 'node:test';
import assert from 'node:assert/strict';
import {nextQueueItem} from '../src/utils/monitor-queue.ts';
test('monitor follows real queue order, wraps and handles fixed slides outside queue',()=>{
 assert.equal(nextQueueItem([], 'baptism',[],[]).id,null);
 assert.equal(nextQueueItem(['seat','donations'],'seat',[],[]).title,'Doações / Dízimos');
 assert.equal(nextQueueItem(['seat','donations'],'donations',[],[]).position,1);
 assert.equal(nextQueueItem(['seat','donations'],'baptism',[],[]).id,'seat');
});
test('monitor resolves actual slide identifiers and keeps file formats honest',()=>{
 const summary=(id:string)=>nextQueueItem([id],'fixed',[{id:'custom_webm',name:'Vídeo de abertura',type:'video'}],[{id:'x',theme:'Reunião especial'}]);
 assert.equal(summary('meeting_event_x').title,'Reunião especial');assert.equal(summary('campaigns').typeLabel,'Campanhas');
 assert.equal(summary('agenda_day_6_fju').title,'Agenda: Sábado · FJU');
 assert.equal(summary('custom_webm').typeLabel,'Vídeo');assert.equal(summary('verse_0').id,'verse_0');
});
