import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isYouthMeeting,isChurchMeeting,availableInChurchLoop,availableInYouthLoop} from '../src/utils/projection-theme.ts';
import {deriveCountdown} from '../src/utils/countdown.ts';
import {isSharedStateUpdate,readSharedStorage} from '../src/utils/shared-state.ts';

test('church excludes youth-only events; explicit both preserves one record in both agendas',()=>{
 const events=[{id:'youth',theme:'Vigília',audience:'fju' as const},{id:'church',theme:'Reunião',audience:'church' as const},{id:'shared',theme:'Evento conjunto',audience:'both' as const},{id:'legacy',theme:'Algo a Mais'}];
 assert.deepEqual(events.filter(isChurchMeeting).map(e=>e.id),['church','shared']);
 assert.deepEqual(events.filter(isYouthMeeting).map(e=>e.id),['youth','shared','legacy']);
 for(const event of events){assert.equal(availableInChurchLoop('meeting_event_'+event.id,events),isChurchMeeting(event));assert.equal(availableInYouthLoop('meeting_event_'+event.id,events),isYouthMeeting(event));}
 assert.equal(availableInChurchLoop('agenda_day_6_fju',[{...events[0],day:6}]),false);
 assert.equal(availableInChurchLoop('agenda_day_6_fju',[{...events[2],day:6}]),true);
});
test('youth-only dates cannot drive a church countdown; shared audience survives transfer and backup',()=>{
 const now=new Date('2026-10-16T12:00:00');const m={id:'one',theme:'Vigília',audience:'fju' as 'fju'|'both',date:'2026-10-16',dayName:'Sexta-feira',time:'12:02',hours:12,minutes:2};
 assert.equal(deriveCountdown(now,[m].filter(isChurchMeeting)).nextMeeting,null);
 const both={...m,audience:'both' as const};assert.equal(deriveCountdown(now,[both].filter(isChurchMeeting)).nextMeeting?.id,'one');
 assert.equal(isSharedStateUpdate('customMeetings',[both]),true);
 assert.deepEqual(JSON.parse(readSharedStorage({projection_customMeetings:JSON.stringify([both])}).projection_customMeetings),[both]);
});
