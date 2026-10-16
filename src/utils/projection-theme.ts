import {FJU_CARDS} from './fju-content.ts';
export type ProjectionThemeMode = 'auto'|'fju'|'regular';
export const isYouthMeeting=(meeting:{theme?:string}|null|undefined)=>/jovem|fju/i.test(meeting?.theme||'');

export function availableInYouthLoop(id:string,meetings:readonly {id:string;theme?:string}[]){
 if(id.startsWith('custom_')||id.startsWith('verse_'))return true;
 if(id.startsWith('meeting_event_'))return isYouthMeeting(meetings.find(m=>m.id===id.slice('meeting_event_'.length)));
 return (Object.hasOwn(FJU_CARDS,id)&&id!=='social')||id==='fju_agenda'||id==='world_god';
}

export function isYouthProjection(ongoing: {theme?: string} | null | undefined, next: {theme?: string} | null | undefined, nextDate: Date | null | undefined, now: Date, mode: ProjectionThemeMode = 'auto'): boolean {
  if(mode==='fju')return true;
  if(mode==='regular')return false;
  const youth = (theme = '') => /jovem|fju/i.test(theme);
  if (youth(ongoing?.theme)) return true;
  if (!youth(next?.theme)) return false;
  if (!nextDate) return true;
  const minutes = (nextDate.getTime() - now.getTime()) / 60000;
  return minutes <= 240 && minutes >= -90;
}
