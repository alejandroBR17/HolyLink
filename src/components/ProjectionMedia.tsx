import {useIsPresent} from 'motion/react';
import {useEffect,useRef,useState} from 'react';
import {reportPlayback} from '../utils/playback-status';
interface Media {id:string;name:string;url:string;type:'image'|'video';muted?:boolean;fit?:'contain'|'cover'|'fill'}
export function ProjectionMediaFallback({preview=false,name,id,kind='image'}:{preview?:boolean;name?:string;id?:string;kind?:'image'|'video'}){
 useEffect(()=>{if(id)reportPlayback({id,name:name||'Arquivo indisponível',kind,state:'error',preview});},[id,name,kind,preview]);
 return <div className="projection-media-fallback img-error-fallback"><div aria-hidden="true"/><strong>{preview?'Não foi possível exibir a mídia':'Um instante'}</strong><p>{preview?name:'A apresentação continua em instantes.'}</p></div>;
}
export function ProjectedImage({media,preview=false}:{media:Media;preview?:boolean}){
 const[attempt,setAttempt]=useState(0),[failed,setFailed]=useState(false);const image=useRef<HTMLImageElement>(null);
 useEffect(()=>{setFailed(false);reportPlayback({id:media.id,name:media.name,kind:'image',state:'loading',preview});const timer=setTimeout(()=>{if(!image.current?.naturalWidth){setFailed(true);reportPlayback({id:media.id,name:media.name,kind:'image',state:'error',preview});}},12000);return()=>clearTimeout(timer);},[media.id,media.url,attempt,preview]);
 useEffect(()=>{const retry=(event:Event)=>{if((event as CustomEvent).detail?.id===media.id)setAttempt(value=>value+1);};window.addEventListener('holylink_retry_media',retry);return()=>window.removeEventListener('holylink_retry_media',retry);},[media.id]);
 if(failed)return <ProjectionMediaFallback preview={preview} name={media.name}/>;
 return <img key={`${media.id}:${media.url}:${attempt}`} ref={image} src={media.url} alt={media.name} referrerPolicy="no-referrer" className={`w-full h-full relative z-10 ${media.fit==='cover'?'object-cover':media.fit==='fill'?'object-fill':'object-contain'}`} onLoad={()=>{setFailed(false);reportPlayback({id:media.id,name:media.name,kind:'image',state:'ready',preview});}} onError={()=>{setFailed(true);reportPlayback({id:media.id,name:media.name,kind:'image',state:'error',preview});}}/>;
}
export function ProjectedVideo({media,currentSlideId,videoPinBehavior,onVideoEnded,isBackgroundBlur=false,volume=.5,fit,preview=false}:{media:Media;currentSlideId?:string;videoPinBehavior?:string;onVideoEnded?:()=>void;isBackgroundBlur?:boolean;volume?:number;fit?:string;preview?:boolean}){
 const isPresent=useIsPresent();
 const ref=useRef<HTMLVideoElement>(null);const[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 const generation=useRef(0),watchdog=useRef<ReturnType<typeof setTimeout>|null>(null),audioBlocked=useRef(false);
 const volumeRef=useRef(volume);volumeRef.current=volume;
 const metadataRef=useRef(media);metadataRef.current=media;
 const notify=(state:Parameters<typeof reportPlayback>[0]['state'])=>reportPlayback({id:media.id,name:media.name,kind:'video',state,preview});
 const clearWatch=()=>{if(watchdog.current)clearTimeout(watchdog.current);watchdog.current=null;};
 const watch=()=>{clearWatch();watchdog.current=setTimeout(()=>{if(document.visibilityState==='hidden')return;setFailed(true);ref.current?.pause();notify('error');},15000);};
 const applySound=(video:HTMLVideoElement)=>{const value=Number.isFinite(volumeRef.current)?Math.max(0,Math.min(1,volumeRef.current)):0;video.volume=preview||isBackgroundBlur?0:value;video.muted=preview||isBackgroundBlur||value===0||!!metadataRef.current.muted||audioBlocked.current;};
 const play=async(video:HTMLVideoElement,id:number)=>{
  if(document.visibilityState==='hidden')return;
  try{await video.play();}catch(error){
   if(id!==generation.current)return;
   if((error as DOMException)?.name==='AbortError')return;
   if((error as DOMException)?.name==='NotAllowedError'){audioBlocked.current=true;video.muted=true;notify('audio-blocked');try{await video.play();}catch{if(id===generation.current){clearWatch();notify('audio-blocked');}}}
   else{setFailed(true);clearWatch();notify('error');}
  }
 };
 useEffect(()=>{
  const video=ref.current;const id=++generation.current;setFailed(false);audioBlocked.current=false;
  if(!video||!isPresent){video?.pause();return;}
  // React may replay effects in development without replacing the DOM node.
  // Restore the source released by the previous cleanup before starting it.
  if(video.getAttribute('src')!==media.url)video.src=media.url;
  if(currentSlideId&&currentSlideId!==media.id){video.pause();return;}
  notify('loading');applySound(video);watch();void play(video,id);
  const visible=()=>{if(document.visibilityState==='hidden'){clearWatch();video.pause();}else{watch();void play(video,id);}};
  const retry=(event:Event)=>{if((event as CustomEvent).detail?.id===media.id)setAttempt(value=>value+1);};
  const unlock=()=>{if(!audioBlocked.current)return;audioBlocked.current=false;applySound(video);void play(video,id);};
  document.addEventListener('visibilitychange',visible);window.addEventListener('holylink_retry_media',retry);window.addEventListener('holylink_enable_output_audio',unlock);
  return()=>{generation.current++;clearWatch();document.removeEventListener('visibilitychange',visible);window.removeEventListener('holylink_retry_media',retry);window.removeEventListener('holylink_enable_output_audio',unlock);video.pause();video.removeAttribute('src');video.load();};
 },[media.id,media.url,currentSlideId,attempt,preview,isBackgroundBlur,isPresent]);
 useEffect(()=>{if(ref.current)applySound(ref.current);},[volume,media.muted,preview,isBackgroundBlur]);
 const renderingFit=fit||media.fit||'contain';
 // Keep the element mounted on failure so a retry can replace its source reliably.
 return <div className="w-full h-full relative"><video key={`${media.id}:${media.url}:${attempt}`} ref={ref} src={media.url} playsInline preload="metadata" controls={false} loop={videoPinBehavior==='loop'} className={`w-full h-full ${renderingFit==='cover'?'object-cover':renderingFit==='fill'?'object-fill':'object-contain'} ${failed?'invisible':''}`} onPlaying={event=>{if(event.currentTarget!==ref.current||!isPresent)return;clearWatch();notify(audioBlocked.current?'audio-blocked':'playing');}} onTimeUpdate={event=>{if(event.currentTarget!==ref.current||!isPresent)return;if(ref.current&&!ref.current.paused)clearWatch();}} onWaiting={event=>{if(event.currentTarget!==ref.current||!isPresent)return;notify('buffering');watch();}} onStalled={event=>{if(event.currentTarget!==ref.current||!isPresent)return;notify('buffering');watch();}} onError={event=>{if(event.currentTarget!==ref.current||!isPresent)return;clearWatch();setFailed(true);notify('error');}} onEnded={event=>{if(event.currentTarget!==ref.current||!isPresent)return;clearWatch();if(videoPinBehavior!=='loop'&&!isBackgroundBlur)onVideoEnded?.();}}/>{failed&&<ProjectionMediaFallback preview={preview} name={media.name}/>}</div>;
}
