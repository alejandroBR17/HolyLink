export const VIDEO_METADATA_TIMEOUT_MS=12_000;
export type MetadataVideo=Pick<HTMLVideoElement,'duration'|'preload'|'src'|'onloadedmetadata'|'onerror'|'pause'|'removeAttribute'|'load'>;
export class VideoMetadataError extends Error {
  constructor(message:string){super(message);this.name='VideoMetadataError';}
}
interface Options {
  signal?:AbortSignal;timeoutMs?:number;
  createVideo?:()=>MetadataVideo;createUrl?:(file:Blob)=>string;revokeUrl?:(url:string)=>void;
}

/** Local metadata only: no playback, network upload or silently invented duration. */
export function readVideoDuration(file:Blob,{signal,timeoutMs=VIDEO_METADATA_TIMEOUT_MS,createVideo=()=>document.createElement('video'),createUrl=blob=>URL.createObjectURL(blob),revokeUrl=url=>URL.revokeObjectURL(url)}:Options={}):Promise<number>{
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(new DOMException('Leitura cancelada.','AbortError'));return;}
    if(!file.size){reject(new VideoMetadataError('O vídeo está vazio. Escolha outro arquivo.'));return;}
    let video:MetadataVideo|undefined,url:string|undefined,timer:ReturnType<typeof setTimeout>|undefined,finished=false;
    const cleanup=()=>{
      clearTimeout(timer);signal?.removeEventListener('abort',abort);
      if(video){video.onloadedmetadata=null;video.onerror=null;try{video.pause();video.removeAttribute('src');video.load();}catch{/* Best-effort decoder cleanup. */}}
      if(url)revokeUrl(url);
    };
    const settle=(duration?:number,error?:Error)=>{if(finished)return;finished=true;cleanup();if(error)reject(error);else resolve(duration!);};
    const abort=()=>settle(undefined,new DOMException('Leitura cancelada.','AbortError'));
    try{
      video=createVideo();video.preload='metadata';
      video.onloadedmetadata=()=>{const duration=video!.duration;
        if(!Number.isFinite(duration)||duration<=0)settle(undefined,new VideoMetadataError('Não foi possível identificar a duração do vídeo. Exporte o arquivo novamente e tente outra vez.'));
        else settle(Math.max(1,Math.round(duration*1000)));
      };
      video.onerror=()=>settle(undefined,new VideoMetadataError('Este vídeo não pôde ser lido pelo navegador. Escolha outro arquivo ou exporte em um formato compatível.'));
      signal?.addEventListener('abort',abort,{once:true});
      timer=setTimeout(()=>settle(undefined,new VideoMetadataError('A leitura do vídeo demorou mais de 12 segundos. Tente novamente ou escolha outro arquivo.')),timeoutMs);
      url=createUrl(file);video.src=url;
    }catch{settle(undefined,new VideoMetadataError('Não foi possível preparar o vídeo. Tente novamente com outro arquivo.'));}
  });
}
