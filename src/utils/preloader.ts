/**
 * Media Preloader Service - Aggressive 2-Slot Lazy Loading
 * Ensures only the current slide and immediate next slide reside in RAM.
 * Previous and non-adjacent slides are aggressively purged from browser memory
 * to guarantee optimal performance on 4GB RAM PCs and mobile devices.
 */

class MediaPreloaderService {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private preloadedUrls: Set<string> = new Set();
  private staticAssetUrls: Set<string> = new Set([
    '/logo-text.png?v=11', 
    '/logo-text.png',
    '/logo-full.png?v=11',
    '/logo-full.png',
    '/icon-192.png?v=11',
    '/icon-192.png',
    '/icon-512.png',
    '/icon-symbol-838.png'
  ]);

  /**
   * Disposes of a cached media resource completely from browser memory
   */
  public evictUrl(url: string) {
    if (!url || this.staticAssetUrls.has(url)) return;

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

  /**
   * Preload and asynchronously decode an image bitmap into memory.
   * Maintains strict RAM cap (maximum 2 non-static image buffers).
   */
  public preloadImage(url: string): Promise<void> {
    if (!url || this.preloadedUrls.has(url)) {
      return Promise.resolve();
    }

    // Strict RAM Limit: Evict oldest image if limit reached
    if (this.imageCache.size >= 2) {
      for (const key of this.imageCache.keys()) {
        if (!this.staticAssetUrls.has(key)) {
          this.evictUrl(key);
          break;
        }
      }
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.referrerPolicy = "no-referrer";
      
      const onLoaded = async () => {
        try {
          if ('decode' in img && typeof img.decode === 'function') {
            await img.decode();
          }
        } catch (e) {
          // Decode fallback if format is unusual
        }
        this.imageCache.set(url, img);
        this.preloadedUrls.add(url);
        resolve();
      };

      if (img.complete) {
        onLoaded();
      } else {
        img.onload = onLoaded;
        img.onerror = () => {
          // Resolve anyway to prevent hanging transitions
          resolve();
        };
      }

      // Safety timeout
      setTimeout(resolve, 2500);
    });
  }

  /**
   * Preload a video URL with metadata and auto buffering.
   * Strict RAM safety limit: max 2 buffered video decoders in memory.
   */
  public preloadVideo(url: string): Promise<void> {
    if (!url || this.preloadedUrls.has(url)) {
      return Promise.resolve();
    }

    // Strict RAM limit: Evict oldest video decoder immediately
    if (this.videoCache.size >= 2) {
      const oldestKey = this.videoCache.keys().next().value;
      if (oldestKey) {
        this.evictUrl(oldestKey);
      }
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      const onCanPlay = () => {
        this.videoCache.set(url, video);
        this.preloadedUrls.add(url);
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        resolve();
      };

      const cleanup = () => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('loadeddata', onCanPlay);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('canplay', onCanPlay, { once: true });
      video.addEventListener('loadeddata', onCanPlay, { once: true });
      video.addEventListener('error', onError, { once: true });

      // Timeout fallback in case video buffering takes too long
      setTimeout(() => {
        cleanup();
        resolve();
      }, 3000);
    });
  }

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
    const promises: Promise<void>[] = [];
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
    const total = items.length;

    for (const item of items) {
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
    const allCachedUrls = new Set([...this.imageCache.keys(), ...this.videoCache.keys()]);
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

  public clearCache() {
    const urls = [...this.preloadedUrls];
    urls.forEach(url => this.evictUrl(url));
    this.imageCache.clear();
    this.videoCache.clear();
    this.preloadedUrls.clear();
  }
}

export const mediaPreloader = new MediaPreloaderService();

