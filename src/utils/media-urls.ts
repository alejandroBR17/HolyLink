import type {DBMediaItem} from '../utils';

/** One owner per mounted library. Retired URLs survive the output transition briefly. */
export class MediaUrlPool {
  private entries=new Map<string,{url:string;version:string}>();
  private retired=new Map<string,ReturnType<typeof setTimeout>>();
  private create:(blob:Blob)=>string;
  private revoke:(url:string)=>void;
  private graceMs:number;
  constructor(create=(blob:Blob)=>URL.createObjectURL(blob),revoke=(url:string)=>URL.revokeObjectURL(url),graceMs=1000){this.create=create;this.revoke=revoke;this.graceMs=graceMs;}

  update(items:readonly DBMediaItem[],retryId?:string):Map<string,string> {
    const ids=new Set(items.map(item=>item.id));
    for(const [id,entry] of this.entries)if(!ids.has(id)){this.retire(entry.url);this.entries.delete(id);}
    const urls=new Map<string,string>();
    for(const item of items){
      const previous=this.entries.get(item.id),version=item.localBlobVersion||'legacy';
      if(item.blob && previous && previous.version===version && item.id!==retryId){urls.set(item.id,previous.url);continue;}
      let url='';
      try {
        let blob:Blob|undefined=item.blob;
        if(blob && !(blob instanceof Blob)){
          const old=blob as {buffer?:ArrayBuffer|Uint8Array;bytes?:BlobPart;type?:string};
          blob=old.buffer?new Blob([old.buffer as BlobPart],{type:old.type}):old.bytes?new Blob([old.bytes],{type:old.type}):undefined;
        }
        if(blob)url=this.create(blob);
      } catch { /* An unreadable record must not keep showing the old bytes. */ }
      if(previous)this.retire(previous.url);
      if(url){this.entries.set(item.id,{url,version});urls.set(item.id,url);}else this.entries.delete(item.id);
    }
    return urls;
  }

  private retire(url:string){
    if(this.retired.has(url))return;
    this.retired.set(url,setTimeout(()=>{this.retired.delete(url);this.revoke(url);},this.graceMs));
  }

  dispose(){
    for(const {url} of this.entries.values())this.revoke(url);
    for(const [url,timer] of this.retired){clearTimeout(timer);this.revoke(url);}
    this.entries.clear();this.retired.clear();
  }
}
