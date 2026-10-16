import {deriveCountdown} from '../src/utils/countdown.ts';
import {FJU_PRE_SLIDES,FJU_POST_SLIDES} from '../src/utils/fju-content.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isYouthProjection,availableInYouthLoop,isYouthMeeting} from '../src/utils/projection-theme.ts';
test('operator preview and projection share the youth meeting window without changing its limits', () => {
  const now = new Date('2026-10-14T18:00:00Z'), next = {theme: 'Encontro FJU'};
  const at = (minutes: number) => new Date(now.getTime() + minutes * 60000);
  assert.equal(isYouthProjection({theme:'Força Jovem'}, null, null, now), true);
  assert.equal(isYouthProjection(null, next, at(240), now), true);
  assert.equal(isYouthProjection(null, next, at(241), now), false);
  assert.equal(isYouthProjection(null, next, at(-90), now), true);
  assert.equal(isYouthProjection(null, next, at(-91), now), false);
  assert.equal(isYouthProjection(null, {theme:'Reunião de oração'}, at(0), now), false);
});


test('manual FJU overrides agenda both ways while auto keeps the existing schedule window',()=>{
 const now=new Date('2026-10-16T12:00:00Z'),future=new Date('2026-10-17T12:00:00Z');
 assert.equal(isYouthProjection(null,null,null,now,'fju'),true);
 assert.equal(isYouthProjection({theme:'Reunião normal'},null,null,now,'fju'),true);
 assert.equal(isYouthProjection({theme:'Encontro FJU'},{theme:'Força Jovem'},now,now,'regular'),false);
 assert.equal(isYouthProjection(null,{theme:'Encontro FJU'},future,now,'auto'),false);
 assert.equal(isYouthProjection({theme:'Encontro FJU'},null,null,now,'auto'),true);
});


test('youth cycles exclude church material while retaining Bible, media and actual youth events',()=>{
 const meetings=[{id:'youth',theme:'Encontro Jovem FJU'},{id:'normal',theme:'Reunião de fé'}];
 for(const id of ['donations','campaigns','baptism','blessing','agenda_day_0','agenda_day_6_fju','meeting_event_normal','social'])assert.equal(availableInYouthLoop(id,meetings),false,id);
 for(const id of [...FJU_PRE_SLIDES,...FJU_POST_SLIDES,'custom_video','verse_2','meeting_event_youth'])assert.equal(availableInYouthLoop(id,meetings),true,id);
 assert.ok(FJU_PRE_SLIDES.includes('fju_first_time')&&FJU_PRE_SLIDES.includes('fju_support'));
});

test('manual youth identity cannot count down to an unrelated church meeting',()=>{
 const now=new Date('2026-10-16T12:00:00');
 const meetings=[{id:'normal',theme:'Reunião de fé',date:'2026-10-16',time:'12:02',dayName:'Hoje',hours:12,minutes:2},{id:'youth',theme:'Encontro FJU',date:'2026-10-16',time:'14:00',dayName:'Hoje',hours:14,minutes:0}];
 const youth=deriveCountdown(now,meetings.filter(isYouthMeeting));assert.equal(youth.nextMeeting?.id,'youth');assert.equal(youth.diffSeconds,7200);assert.equal(youth.isFinalFiveMinutes,false);
 assert.equal(deriveCountdown(now,meetings.filter(m=>m.id==='normal').filter(isYouthMeeting)).nextMeeting,null);
});
