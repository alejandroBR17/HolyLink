import type {DBMediaItem} from '../utils';
import {readSharedStorage} from './shared-state.ts';
import {readTransferMetadata,MAX_REMOTE_MEDIA_BYTES} from './chunk-assembler.ts';
export const MAX_BACKUP_FILE_BYTES=192*1024*1024;
export const MAX_BACKUP_MEDIA_BYTES=128*1024*1024;
export interface PreparedBackup {localStorage:Record<string,string>;mediaItems:DBMediaItem[];totalBytes:number;version:1|2}
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export function inspectBackup(value:unknown) {
 if(!object(value)||![1,2].includes(value.version as number)||(value.version===2&&value.product!=='holylink')||!Array.isArray(value.mediaItems)||value.mediaItems.length>500)throw Error('Arquivo de backup HolyLink inválido.');
 const storage=readSharedStorage(value.localStorage??{});
 const ids=new Set<string>();let totalBytes=0;
 // Validate every row before decoding a single image or changing any stored state.
 const rows=value.mediaItems.map((item:unknown)=>{
  if(!object(item)||typeof item.base64!=='string'||!item.base64.length||item.base64.length%4||item.base64.length>4*Math.ceil(MAX_REMOTE_MEDIA_BYTES/3)||!/^[A-Za-z0-9+/]*={0,2}$/.test(item.base64))throw Error('Mídia inválida no backup.');
  const size=item.base64.length/4*3-(item.base64.endsWith('==')?2:item.base64.endsWith('=')?1:0);
  totalBytes+=size;if(totalBytes>MAX_BACKUP_MEDIA_BYTES)throw Error('O backup ultrapassa 128 MB de arquivos.');
  const metadata=readTransferMetadata({...item,size,mimeType:item.mimeType||'application/octet-stream'});
  if(ids.has(metadata.id))throw Error('O backup contém identificadores de mídia repetidos.');ids.add(metadata.id);
  return {metadata,base64:item.base64};
 });
 return {version:value.version as 1|2,localStorage:storage,rows,totalBytes};
}
export function prepareBackup(value:unknown):PreparedBackup {
 const parsed=inspectBackup(value);const {rows}=parsed;
 const mediaItems=rows.map(({metadata,base64})=>{
  const binary=atob(base64);if(binary.length!==metadata.size)throw Error('O tamanho de uma mídia do backup não confere.');
  const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const {mimeType,size:_size,...safe}=metadata;return {...safe,blob:new Blob([bytes],{type:mimeType})};
 });
 return {version:parsed.version,localStorage:parsed.localStorage,mediaItems,totalBytes:parsed.totalBytes};
}
/** Media commit must be one IndexedDB transaction: it rejects only when aborted. */
export async function applyPreparedBackup(prepared:PreparedBackup,commitMedia:(items:DBMediaItem[])=>Promise<void>,store:Pick<Storage,'getItem'|'setItem'|'removeItem'>=localStorage):Promise<void> {
 const before=new Map<string,string|null>();const written:string[]=[];
 try {
  for(const[key,value]of Object.entries(prepared.localStorage)){before.set(key,store.getItem(key));store.setItem(key,value);written.push(key);}
  await commitMedia(prepared.mediaItems);
 } catch {
  let complete=true;const restore:string[]=[];
  for(const key of written){try{if(store.getItem(key)!==prepared.localStorage[key]){complete=false;continue;}store.removeItem(key);restore.push(key);}catch{complete=false;}}
  for(const key of restore){try{const value=before.get(key);if(value!==null&&value!==undefined)store.setItem(key,value);}catch{complete=false;}}
  throw Error(complete?'O backup não foi aplicado. As configurações anteriores foram preservadas.':'A restauração falhou e houve alteração concorrente ou bloqueio do armazenamento. Confira as configurações antes de usar.');
 }
}
