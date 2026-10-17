import {calendarDate,clockTime,findMeetingSchedule,localDateKey} from './agenda.ts';
import type {Meeting} from '../types.ts';

function startFor(meeting:Meeting,day:Date){
 const start=meeting.date?calendarDate(meeting.date):new Date(day);
 const clock=clockTime(meeting.time);if(!start||!clock)return null;
 start.setHours(clock.hours,clock.minutes,0,0);
 if(!meeting.date&&start>day)start.setDate(start.getDate()-1);
 return start;
}
function atStamp(meetings:Meeting[],stamp:number){
 const date=new Date(stamp);
 return meetings.find(m=>{const clock=clockTime(m.time);return clock&&date.getHours()===clock.hours&&date.getMinutes()===clock.minutes&&date.getSeconds()===0&&date.getMilliseconds()===0&&(m.date?m.date===localDateKey(date):m.day===date.getDay());})||null;
}
/** Offset moves the clock reference; a paused/adjusted timer keeps its selected meeting. */
export function deriveCountdown(now:Date,meetings:Meeting[],offset=0,paused=false,pausedSeconds:number|null=null,anchor:number|null=null,dismissed=false){
 const virtualNow=new Date(now.getTime()-offset);
 const schedule=findMeetingSchedule(virtualNow,meetings);
 const recent=schedule.ongoingMeeting;
 const recentDate=recent?startFor(recent,virtualNow):null;
 const pinned=anchor!==null?atStamp(meetings,anchor):null;
 let target=pinned||(anchor===null&&!paused?recent:null);
 let baseDate=pinned?new Date(anchor!):anchor===null&&!paused?recentDate:null;
 const elapsed=baseDate?now.getTime()-baseDate.getTime()-offset:Infinity;
 const isJustStartedRaw=!paused&&elapsed>=0&&elapsed<30*60*1000;
 const missingPausedTarget=paused&&anchor!==null&&!pinned;
 if(!missingPausedTarget&&(!target||(!paused&&(elapsed>=30*60*1000||dismissed)))){
  target=schedule.nextMeeting;baseDate=schedule.nextMeetingDate;
 }
 if(missingPausedTarget){target=null;baseDate=null;}
 const remaining=baseDate?Math.max(0,Math.ceil((baseDate.getTime()+offset-now.getTime())/1000)):0;
 const diffSeconds=baseDate&&paused&&pausedSeconds!==null?Math.max(0,Math.floor(pausedSeconds)):remaining;
 const isJustStarted=isJustStartedRaw&&!dismissed;
 const isFinalMinute=!!baseDate&&!isJustStarted&&diffSeconds<=60&&(diffSeconds>0||paused);
 const isFinalFiveMinutes=!!baseDate&&!isJustStarted&&diffSeconds>60&&diffSeconds<=300;
 return{nextMeeting:target,nextMeetingDate:baseDate,diffSeconds,isJustStartedRaw,isJustStarted,isFinalMinute,isFinalFiveMinutes,isLooping:!isJustStarted&&!isFinalMinute&&!isFinalFiveMinutes};
}
