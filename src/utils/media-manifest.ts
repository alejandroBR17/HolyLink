import type {DBMediaItem} from '../utils';
import {readTransferMetadata} from './chunk-assembler.ts';

export interface MediaManifestItem {
  id:string; type:'image'|'video'; name:string; duration:number; enabledInLoop:boolean;
  muted?:boolean; order?:number; fit?:'contain'|'cover'|'fill'; size:number; contentHash?:string; sourceIds?:string[];
}

/** A versioned digest of fixed-size block digests. Reads at most 1 MiB at a time. */
export async function fingerprintMedia(blob: Blob, active:()=>boolean = ()=>true): Promise<string> {
  const block = 1024 * 1024;
  const pieces: Uint8Array[] = [new TextEncoder().encode('holylink-block-sha256-v1:' + blob.size + ':')];
  for (let offset = 0; offset < blob.size; offset += block) {
    if(!active())throw new DOMException('Comparação cancelada.','AbortError');
    pieces.push(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.slice(offset, offset + block).arrayBuffer())));
  }
  const digest = await crypto.subtle.digest('SHA-256', await new Blob(pieces).arrayBuffer());
  return 'b1:' + [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

export async function describeMedia(items: DBMediaItem[], active:()=>boolean = ()=>true): Promise<MediaManifestItem[]> {
  const result: MediaManifestItem[] = [];
  for (const item of items) {
    if (!(item.blob instanceof Blob) || !item.blob.size) continue;
    result.push({id:item.id,type:item.type,name:item.name,duration:item.duration,enabledInLoop:item.enabledInLoop,
      muted:item.muted,order:item.order,fit:item.fit,size:item.blob.size,contentHash:await fingerprintMedia(item.blob,active)});
  }
  return result;
}

export function readMediaManifest(value: unknown): MediaManifestItem[] {
  if (!Array.isArray(value) || value.length > 500) throw new Error('Lista de mídias inválida.');
  const ids = new Set<string>();
  return value.map(item=>{
    const metadata = readTransferMetadata({...item,mimeType:item?.mimeType || (item?.type === 'image'?'image/png':'video/mp4')});
    if (ids.has(metadata.id) || (item.contentHash !== undefined && !/^b1:[a-f0-9]{64}$/.test(item.contentHash))) throw new Error('Identificador ou assinatura de mídia inválida.');
    ids.add(metadata.id);
    const {mimeType: _mime, ...safe} = metadata;
    return {...safe,contentHash:item.contentHash};
  });
}

export function planMediaMerge(local: MediaManifestItem[], remote: MediaManifestItem[]) {
  const byId = new Map(local.map(item=>[item.id,item]));
  const byHash = new Map(local.filter(item=>item.contentHash).map(item=>[item.contentHash,item]));
  const reused: {remote:MediaManifestItem;localId:string}[] = [];
  const requested: string[] = [];
  const aliases: Record<string,string> = Object.create(null);
  for (const item of remote) {
    const sameId = byId.get(item.id);
    const match = item.contentHash && (sameId?.contentHash === item.contentHash ? sameId : byHash.get(item.contentHash));
    if (match && match.size === item.size) {reused.push({remote:item,localId:match.id});aliases[item.id]=match.id;}
    else {requested.push(item.id);aliases[item.id]=item.id;}
  }
  // No removal plan: absence on the phone never means deletion on the PC.
  return {reused, requested, aliases};
}

export function mapMediaReferences(key:string, value:any, aliases:Record<string,string>) {
  const resolve = (id:string) => Object.hasOwn(aliases,id) ? aliases[id] : id;
  if (key === 'manualSlideOverride' && typeof value === 'string') return resolve(value);
  if (!['slidesOrder','disabledSlides'].includes(key) || value == null) return value;
  const ids = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(ids)) return value;
  const mapped = [...new Set(ids.map(id=>resolve(id)))];
  return typeof value === 'string' ? JSON.stringify(mapped) : mapped;
}

export function readMediaCatalog(value:unknown): MediaManifestItem[] {
  if (!Array.isArray(value) || value.length>500) throw new Error('Catálogo do PC inválido.');
  return value.map(item=>{
    if (typeof item?.size !== 'number' || !Number.isSafeInteger(item.size) || item.size<1) throw new Error('Tamanho inválido no catálogo.');
    const safe = readMediaManifest([{...item,size:Math.min(item.size,128*1024*1024),contentHash:undefined}])[0];
    const sourceIds=item.sourceIds || [];
    if (!Array.isArray(sourceIds) || sourceIds.length>1000 || !sourceIds.every(id=>typeof id==='string' && id.length<=200)) throw new Error('Referências inválidas no catálogo.');
    return {...safe,size:item.size,sourceIds};
  });
}
