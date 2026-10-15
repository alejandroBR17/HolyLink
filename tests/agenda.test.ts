import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendarDate,clockTime,findMeetingSchedule,localDateKey,meetingIsToday} from '../src/utils/agenda.ts';
import {isSharedStateUpdate} from '../src/utils/shared-state.ts';
import type {Meeting} from '../src/types.ts';
const meet=(changes:Partial<Meeting>={}):Meeting=>({id:'one',theme:'Reunião',day:0,dayName:'Domingo',time:'19:30',hours:19,minutes:30,...changes});
test('calendar inputs reject normalized impossible dates and malformed clocks',()=>{
  for(const date of ['2026-02-29','2026-04-31','2026-13-01','2026-00-01','2026-10-00','bad'])assert.equal(calendarDate(date),null);
  assert.ok(calendarDate('2028-02-29'));assert.equal(localDateKey(new Date(2026,9,15,23,59)),'2026-10-15');
  for(const time of ['','9:00','24:00','12:60','bad'])assert.equal(clockTime(time),null);
  assert.deepEqual(clockTime('00:00'),{hours:0,minutes:0});
});
test('dated events do not become today just because their weekdays match',()=>{
  const now=new Date(2026,9,15,10);
  assert.equal(meetingIsToday(meet({date:'2026-10-22',day:4}),now),false);
  assert.equal(meetingIsToday(meet({date:'2026-10-15',day:4}),now),true);
  assert.equal(meetingIsToday(meet({day:4}),now),true);
});
test('the next event may be months away; no invented tomorrow or empty-list fallback',()=>{
  const event=meet({date:'2026-12-20'}),now=new Date(2026,9,15,10);
  const result=findMeetingSchedule(now,[event]);assert.equal(result.nextMeeting,event);assert.equal(localDateKey(result.nextMeetingDate!),'2026-12-20');
  assert.equal(findMeetingSchedule(now,[]).nextMeeting,null);
  assert.equal(findMeetingSchedule(now,[meet({date:'2026-10-01'})]).nextMeetingDate,null);
});
test('weekly and dated meetings compete by their actual next start',()=>{
  const now=new Date(2026,9,15,20),weekly=meet({day:4}),event=meet({date:'2026-10-16'});
  assert.equal(findMeetingSchedule(now,[weekly,event]).nextMeeting,event);
  const next=findMeetingSchedule(now,[weekly]);assert.equal(localDateKey(next.nextMeetingDate!),'2026-10-22');
});
test('the existing ongoing window includes start and midnight, excludes its end',()=>{
  const weekly=meet({day:4,time:'23:30',hours:23,minutes:30});
  assert.equal(findMeetingSchedule(new Date(2026,9,15,23,30),[weekly]).ongoingMeeting,weekly);
  assert.equal(findMeetingSchedule(new Date(2026,9,16,0,15),[weekly]).ongoingMeeting,weekly);
  assert.equal(findMeetingSchedule(new Date(2026,9,16,1),[weekly]).ongoingMeeting,null);
});
test('remote agenda cannot carry impossible dates or conflicting time fields',()=>{
  assert.equal(isSharedStateUpdate('customMeetings',[meet({date:'2026-02-31'})]),false);
  assert.equal(isSharedStateUpdate('customMeetings',[meet({hours:8})]),false);
  assert.equal(isSharedStateUpdate('customMeetings',[meet({date:'2026-12-20'})]),true);
});
