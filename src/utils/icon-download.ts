import type {PWAIconType,PWAIconTheme} from '../hooks/usePWAIcons';
/** Export only: launcher icons remain square source art for the OS mask. */
export async function createIconDownload(type:PWAIconType,theme:PWAIconTheme):Promise<Blob> {
  const image=new Image();
  image.src=`/pwa/local-${type}-transparent-512.png`;
  await image.decode();
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('Canvas indisponível');
  if(theme!=='transparent') {
    context.beginPath();context.roundRect(0,0,512,512,112);context.clip();
    context.fillStyle=theme==='dark'?'#030305':'#ffffff';context.fillRect(0,0,512,512);
  }
  context.drawImage(image,0,0,512,512);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG indisponível')),'image/png'));
}
