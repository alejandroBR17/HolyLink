/**
 * Media Preloader Service - Aggressive 2-Slot Lazy Loading
 * Warms the current/next custom media with bounded caches; browser memory remains browser-managed.
 * Previous and non-adjacent slides are aggressively purged from browser memory
 * This reduces repeated loading but cannot guarantee smooth playback on every device.
 */

export class MediaPreloaderService {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private preloadedUrls: Set<string> = new Set();
  private staticAssetUrls: Set<string> = new Set(['/brand/fju-official.png','/brand/hl-symbol-20261014.webp','/brand/hl-text-20261014.webp','/brand/hl-full-20261014.webp']);

  /**
   * Disposes of a cached media resource completely from browser memory
   */
  public evictUrl(url: string) {
    if (!url || this.staticAssetUrls.has(url)) return;
    this.pending.get(url)?.cancel();

    if (this.videoCache.has(url)) {
      const video = this.videoCache.get(url);
      if (video) {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load(); // Forces browser to free hardware video decoders and VRAM buffers
        } catch (e) {
          // Ignore disposal errors
        }
      }
      this.videoCache.delete(url);
    }

    if (this.imageCache.has(url)) {
      const img = this.imageCache.get(url);
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = '';
      }
      this.imageCache.delete(url);
    }

    this.preloadedUrls.delete(url);
  }

  private pending = new Map<string,{promise:Promise<boolean>;cancel:()=>void}>();

  private load(url:string,type:'image'|'video'):Promise<boolean> {
    if (!url) return Promise.resolve(false);
    if (this.preloadedUrls.has(url)) return Promise.resolve(true);
    const existing=this.pending.get(url); if(existing) return existing.promise;
    const cache=type === 'image' ? this.imageCache : this.videoCache;
    const occupied=[...cache.keys()].filter(key => !this.staticAssetUrls.has(key));
    if (!this.staticAssetUrls.has(url) && occupied.length >= 2) this.evictUrl(occupied[0]);
    let resolveResult!:(ok:boolean)=>void;
    const promise=new Promise<boolean>(resolve => {resolveResult=resolve;});
    const element=type === 'image' ? new Image() : document.createElement('video');
    let settled=false;
    const clean=()=>{element.removeEventListener('load',onLoaded);element.removeEventListener('loadeddata',onLoaded);element.removeEventListener('canplay',onLoaded);element.removeEventListener('error',onError);};
    const finish=(ok:boolean)=>{
      if(settled) return; settled=true; clearTimeout(timer);clean();this.pending.delete(url);
      if(ok){if(type === 'image')this.imageCache.set(url,element as HTMLImageElement);else this.videoCache.set(url,element as HTMLVideoElement);this.preloadedUrls.add(url);}
      else {if(type === 'video'){try{(element as HTMLVideoElement).pause();}catch{}}element.removeAttribute('src');if(type === 'video'){try{(element as HTMLVideoElement).load();}catch{}}}
      resolveResult(ok);
    };
    const onLoaded=async()=>{
      if(type === 'image'){
        const img=element as HTMLImageElement;
        try{await img.decode();}catch{ /* onload/naturalWidth remain a valid fallback for decoders without decode(). */ }
        finish(img.naturalWidth>0);
      }else finish((element as HTMLVideoElement).readyState>=2);
    };
    const onError=()=>finish(false);
    const timer=setTimeout(()=>finish(false),type === 'image'?2500:3000);
    this.pending.set(url,{promise,cancel:()=>finish(false)});
    element.addEventListener(type === 'image'?'load':'loadeddata',onLoaded);
    if(type === 'video'){const video=element as HTMLVideoElement;video.preload='auto';video.muted=true;video.playsInline=true;video.addEventListener('canplay',onLoaded);}
    else (element as HTMLImageElement).referrerPolicy='no-referrer';
    element.addEventListener('error',onError);
    element.src=url;
    if(type === 'image' && (element as HTMLImageElement).complete) void onLoaded();
    return promise;
  }

  public preloadImage(url:string):Promise<boolean>{return this.load(url,'image');}
  public preloadVideo(url:string):Promise<boolean>{return this.load(url,'video');}

  /**
   * Prune unused media objects from cache without deleting underlying files
   */
  public pruneUnused(validUrls: Set<string>) {
    const urlsToEvict: string[] = [];

    this.imageCache.forEach((_, url) => {
      if (!validUrls.has(url) && !this.staticAssetUrls.has(url)) {
        urlsToEvict.push(url);
      }
    });

    this.videoCache.forEach((_, url) => {
      if (!validUrls.has(url) && !this.staticAssetUrls.has(url)) {
        urlsToEvict.push(url);
      }
    });

    urlsToEvict.forEach(url => this.evictUrl(url));
  }

  /**
   * Preload media for a specific list of custom media items
   */
  public async preloadMediaItems(items: Array<{ id: string; type: 'image' | 'video'; url: string }>): Promise<void> {
    const promises: Promise<boolean>[] = [];
    for (const item of items) {
      if (!item.url) continue;
      if (item.type === 'image') {
        promises.push(this.preloadImage(item.url));
      } else if (item.type === 'video') {
        promises.push(this.preloadVideo(item.url));
      }
    }
    await Promise.allSettled(promises);
  }

  /**
   * Preload all initial custom media with real-time progress updates for Smart Loader
   */
  public async preloadAllInitialMedia(
    items: Array<{ id: string; type: 'image' | 'video'; url: string }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    if (!items || items.length === 0) {
      if (onProgress) onProgress(0, 0);
      return;
    }

    let completed = 0;
    const total = Math.min(items.length,2);

    for (const item of items.slice(0,2)) {
      if (item.url) {
        if (item.type === 'image') {
          await this.preloadImage(item.url);
        } else if (item.type === 'video') {
          await this.preloadVideo(item.url);
        }
      }
      completed++;
      if (onProgress) {
        onProgress(completed, total);
      }
    }
  }

  /**
   * AGGRESSIVE 2-SLOT LAZY LOADING:
   * Keeps ONLY the current slide and immediate next slide in memory.
   * Immediately evicts previous and distant slides to release RAM and VRAM.
   */
  public async preloadSlideSequence(
    currentSlideId: string, 
    slidesOrder: string[], 
    customMediaList: Array<{ id: string; type: 'image' | 'video'; url: string }>
  ): Promise<void> {
    if (!slidesOrder || slidesOrder.length === 0) return;

    const currentIndex = slidesOrder.indexOf(currentSlideId);
    const targetSlideIds: string[] = [];

    if (currentIndex !== -1) {
      targetSlideIds.push(slidesOrder[currentIndex]); // 1. Current Active Slide
      const nextIndex = (currentIndex + 1) % slidesOrder.length;
      targetSlideIds.push(slidesOrder[nextIndex]); // 2. Immediate Next Slide
    } else {
      // Fallback: first 2 items
      targetSlideIds.push(...slidesOrder.slice(0, 2));
    }

    const itemsToKeep = customMediaList.filter(m => targetSlideIds.includes(m.id));
    const activeUrls = new Set<string>(itemsToKeep.map(m => m.url));

    // Aggressive eviction: purge anything in RAM that is NOT in the 2-slot active set
    const allCachedUrls = new Set([...this.imageCache.keys(), ...this.videoCache.keys(), ...this.pending.keys()]);
    for (const cachedUrl of allCachedUrls) {
      if (!activeUrls.has(cachedUrl) && !this.staticAssetUrls.has(cachedUrl)) {
        this.evictUrl(cachedUrl);
      }
    }

    // Preload only the current and immediate next item
    await this.preloadMediaItems(itemsToKeep);
  }

  /**
   * Preloads static brand assets and UI icons
   */
  public preloadStaticAssets() {
    this.staticAssetUrls.forEach(url => this.preloadImage(url));
  }

  public async prepareStartup(currentId:string,order:string[],items:Array<{id:string;type:'image'|'video';url:string}>,onProgress?:(completed:number,total:number)=>void):Promise<{checked:number;failed:number}> {
    const index=order.indexOf(currentId);
    const ids=index<0?[currentId,...order.slice(0,1)]:[currentId,order[(index+1)%order.length]];
    const media=[...new Set(ids)].map(id=>items.find(m=>m.id===id)).filter((m):m is typeof items[number]=>Boolean(m?.url));
    const tasks=[...[...this.staticAssetUrls].map(url=>()=>this.preloadImage(url)),...media.map(m=>()=>m.type==='image'?this.preloadImage(m.url):this.preloadVideo(m.url))];
    let checked=0,failed=0;onProgress?.(0,tasks.length);
    for(const task of tasks){if(!await task()) failed++;checked++;onProgress?.(checked,tasks.length);}
    return {checked,failed};
  }

  public clearCache() {
    for(const task of [...this.pending.values()]) task.cancel();
    const urls = [...this.preloadedUrls];
    urls.forEach(url => this.evictUrl(url));
    this.imageCache.clear();
    this.videoCache.clear();
    this.preloadedUrls.clear();
  }
}

export const mediaPreloader = new MediaPreloaderService();

