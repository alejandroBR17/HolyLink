import {FJU_CARDS,isFjuProject} from './fju-content.ts';
export type ProjectionThemeMode = 'auto'|'fju'|'regular';
type YouthEvent={theme?:string;audience?:'fju'|'church'};
export const isYouthMeeting=(meeting:YouthEvent|null|undefined)=>meeting?.audience?meeting.audience==='fju':/jovem|fju|algo\s+a\s+mais/i.test(meeting?.theme||'');

export function availableInYouthLoop(id:string,meetings:readonly ({id:string}&YouthEvent)[]){
 if(id.startsWith('custom_')||id.startsWith('verse_'))return true;
 if(id.startsWith('meeting_event_'))return isYouthMeeting(meetings.find(m=>m.id===id.slice('meeting_event_'.length)));
 return isFjuProject(id)||(Object.hasOwn(FJU_CARDS,id)&&id!=='social')||id==='fju_agenda'||id==='world_god';
}

export function isYouthProjection(ongoing: YouthEvent | null | undefined, next: YouthEvent | null | undefined, nextDate: Date | null | undefined, now: Date, mode: ProjectionThemeMode = 'auto'): boolean {
  if(mode==='fju')return true;
  if(mode==='regular')return false;
  if (isYouthMeeting(ongoing)) return true;
  if (!isYouthMeeting(next)) return false;
  if (!nextDate) return true;
  const minutes = (nextDate.getTime() - now.getTime()) / 60000;
  return minutes <= 240 && minutes >= -90;
}
