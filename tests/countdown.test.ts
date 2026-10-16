import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveCountdown} from '../src/utils/countdown.ts';
const start=new Date(2026,9,16,19,30);
const meeting={id:'service',date:'2026-10-16',dayName:'Sexta',theme:'Reunião',time:'19:30',hours:19,minutes:30};
const at=(seconds:number)=>new Date(start.getTime()-seconds*1000);
test('countdown changes at 300, 60 and zero, without starting a fraction of a second early',()=>{
 for(const [seconds,phase]of [[301,'loop'],[300,'five'],[61,'five'],[60,'minute'],[1,'minute'],[0,'started']] as const){
  const c=deriveCountdown(at(seconds),[meeting]);
  assert.equal(c.diffSeconds,seconds);
  assert.equal(c.isJustStarted?'started':c.isFinalMinute?'minute':c.isFinalFiveMinutes?'five':'loop',phase);
 }
 assert.equal(deriveCountdown(new Date(start.getTime()-100),[meeting]).diffSeconds,1);
});
test('positive and negative adjustments move the actual start, including the original meeting boundary',()=>{
 const delayed=deriveCountdown(at(-1),[meeting],300000,false,null,start.getTime());
 assert.equal(delayed.isJustStarted,false);assert.equal(delayed.diffSeconds,299);
 const early=deriveCountdown(at(120),[meeting],-180000,false,null,start.getTime());
 assert.equal(early.isJustStarted,true);assert.equal(early.diffSeconds,0);
});
test('paused target survives its scheduled time and another day; resume uses that same base date',()=>{
 const now=new Date(start.getTime()+24*3600000);
 const paused=deriveCountdown(now,[meeting],0,true,90,start.getTime());
 assert.equal(paused.diffSeconds,90);assert.equal(paused.isJustStarted,false);assert.equal(paused.nextMeetingDate?.getTime(),start.getTime());
 const offset=now.getTime()+90000-start.getTime();
 const resumed=deriveCountdown(new Date(now.getTime()+1000),[meeting],offset,false,null,start.getTime());
 assert.equal(resumed.diffSeconds,89);assert.equal(resumed.isFinalFiveMinutes,true);
 assert.equal(deriveCountdown(now,[meeting],0,true,0,start.getTime()).isJustStarted,false);
});
test('dismissal stays dismissed for the existing thirty-minute opening window',()=>{
 const dismissed=deriveCountdown(at(-60),[meeting],0,false,null,null,true);
 assert.equal(dismissed.isJustStartedRaw,true);assert.equal(dismissed.isJustStarted,false);
 assert.equal(deriveCountdown(at(-1800),[meeting]).isJustStartedRaw,false);
});
test('no agenda or a removed paused target cannot invent a new countdown',()=>{
 const empty=deriveCountdown(at(100),[]);assert.equal(empty.nextMeetingDate,null);assert.equal(empty.isJustStarted,false);
 const replacement={...meeting,id:'other',date:'2026-10-17'};
 const missing=deriveCountdown(at(-60),[replacement],0,true,120,start.getTime());
 assert.equal(missing.nextMeetingDate,null);assert.equal(missing.isFinalFiveMinutes,false);
});
