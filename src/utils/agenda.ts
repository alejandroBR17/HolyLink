import type {Meeting} from '../types.ts';

export const WEEK_DAYS=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export function localDateKey(date:Date):string{
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function calendarDate(value:unknown):Date|null{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [year,month,day]=value.split('-').map(Number);
  if(year<1000)return null;
  const date=new Date(year,month-1,day,12);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
}
export function clockTime(value:unknown):{hours:number;minutes:number}|null{
  if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return null;
  const [hours,minutes]=value.split(':').map(Number);return{hours,minutes};
}
export function meetingIsToday(meeting:Meeting,today:Date):boolean{
  return meeting.date?meeting.date===localDateKey(today):meeting.day===today.getDay();
}
export function findMeetingSchedule(now:Date,meetings:Meeting[]):{nextMeeting:Meeting|null;nextMeetingDate:Date|null;ongoingMeeting:Meeting|null}{
  let nextMeeting:Meeting|null=null,nextMeetingDate:Date|null=null,ongoingMeeting:Meeting|null=null,ongoingStart=-Infinity;
  const inspect=(meeting:Meeting,start:Date)=>{
    const stamp=start.getTime();
    if(stamp>now.getTime()&&(!nextMeetingDate||stamp<nextMeetingDate.getTime())){nextMeeting=meeting;nextMeetingDate=start;}
    // Preserve the existing 90-minute meeting window, including midnight.
    if(stamp<=now.getTime()&&now.getTime()<stamp+90*60*1000&&stamp>ongoingStart){ongoingMeeting=meeting;ongoingStart=stamp;}
  };
  for(const meeting of meetings){
    const time=clockTime(meeting.time);if(!time)continue;
    if(meeting.date){const date=calendarDate(meeting.date);if(!date)continue;date.setHours(time.hours,time.minutes,0,0);inspect(meeting,date);}
    else if(typeof meeting.day==='number'&&Number.isInteger(meeting.day)&&meeting.day>=0&&meeting.day<=6){
      const next=new Date(now);next.setDate(now.getDate()+(meeting.day-now.getDay()+7)%7);next.setHours(time.hours,time.minutes,0,0);
      if(next.getTime()<=now.getTime())next.setDate(next.getDate()+7);
      inspect(meeting,next);
      const previous=new Date(next);previous.setDate(next.getDate()-7);inspect(meeting,previous);
    }
  }
  return{nextMeeting,nextMeetingDate,ongoingMeeting};
}
