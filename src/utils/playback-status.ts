export type PlaybackState='loading'|'playing'|'ready'|'buffering'|'audio-blocked'|'error';
export interface PlaybackStatus {id:string;name:string;kind:'image'|'video';state:PlaybackState;preview:boolean;time:number}
export function validPlaybackStatus(value:unknown):value is PlaybackStatus{
 const x=value as PlaybackStatus;return !!x&&typeof x.id==='string'&&x.id.length<=200&&typeof x.name==='string'&&x.name.length<=500&&['image','video'].includes(x.kind)&&['loading','playing','ready','buffering','audio-blocked','error'].includes(x.state)&&typeof x.preview==='boolean'&&Number.isSafeInteger(x.time)&&x.time>=0;
}
export function reportPlayback(status:Omit<PlaybackStatus,'time'>){
 const detail={...status,time:Date.now()};if(!validPlaybackStatus(detail))return;
 window.dispatchEvent(new CustomEvent('holylink_playback_status',{detail}));
}
export const retryPlayback=(id:string)=>window.dispatchEvent(new CustomEvent('holylink_retry_media',{detail:{id}}));
