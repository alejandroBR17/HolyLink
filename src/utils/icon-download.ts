import type {PWAIconType,PWAIconTheme} from '../hooks/usePWAIcons';
export type AppIconPurpose='any'|'maskable'|'apple';
/** The maskable safe zone is a central circle: keep every artwork pixel inside it. */
export async function createAppIcon(type:PWAIconType,theme:PWAIconTheme,size=512,purpose:AppIconPurpose='any'):Promise<Blob> {
  if(![180,192,512].includes(size))throw new Error('Tamanho de ícone inválido');
  const image=new Image();image.src=`/pwa/local-${type}-transparent-512.png`;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const context=canvas.getContext('2d');if(!context)throw new Error('Canvas indisponível');
  if(purpose==='any'&&theme!=='transparent') {context.beginPath();context.roundRect(0,0,size,size,size*112/512);context.clip();}
  if(theme!=='transparent'||purpose!=='any') {context.fillStyle=theme==='light'?'#ffffff':'#030305';context.fillRect(0,0,size,size);}
  let drawingSize=size;
  if(purpose==='maskable') {
    const art=document.createElement('canvas');art.width=art.height=512;
    const ctx=art.getContext('2d');if(!ctx)throw new Error('Canvas indisponível');
    ctx.drawImage(image,0,0,512,512);const pixels=ctx.getImageData(0,0,512,512).data;
    let radius=0;
    for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(pixels[(y*512+x)*4+3]>0)radius=Math.max(radius,Math.hypot(x+.5-256,y+.5-256));
    if(!radius)throw new Error('Arte de ícone vazia');
    // 38% leaves a small antialiasing margin within the required 40% radius.
    drawingSize=512*(size*.38/radius);
  }
  context.drawImage(image,(size-drawingSize)/2,(size-drawingSize)/2,drawingSize,drawingSize);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG indisponível')),'image/png'));
}
export function createIconDownload(type:PWAIconType,theme:PWAIconTheme):Promise<Blob> {return createAppIcon(type,theme);}
