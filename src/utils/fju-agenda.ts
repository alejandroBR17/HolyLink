import type {Meeting} from '../types.ts';
import {findMeetingSchedule} from './agenda.ts';
import {isYouthMeeting} from './projection-theme.ts';

/** One next occurrence per event; weekly schedules and dated exceptions compete by date. */
export function nextFjuEvents(meetings:readonly Meeting[],now:Date){
 return meetings.filter(isYouthMeeting).flatMap(meeting=>{
  const date=findMeetingSchedule(now,[meeting]).nextMeetingDate;
  return date?[{meeting,date}]:[];
 }).sort((a,b)=>a.date.getTime()-b.date.getTime()||a.meeting.id.localeCompare(b.meeting.id));
}
