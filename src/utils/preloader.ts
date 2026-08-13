/**
 * Media Preloader Service
 * Pre-buffers video elements, decodes image bitmaps, and warms up the cache
 * so transitions on 4GB RAM PCs and mobile devices occur with zero stutter.
 */

class MediaPreloaderService {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private preloadedUrls: Set<string> = new Set();

  /**
   * Preload and asynchronously decode an image bitmap into memory
   */
  public preloadImage(url: string): Promise<void> {
    if (!url || this.preloadedUrls.has(url)) {
      return Promise.resolve();
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
      setTimeout(resolve, 3000);
    });
  }

  /**
   * Preload a video URL with metadata and auto buffering
   * Max 3 concurrent video buffers to preserve RAM on 4GB systems
   */
  public preloadVideo(url: string): Promise<void> {
    if (!url || this.preloadedUrls.has(url)) {
      return Promise.resolve();
    }

    // Strict RAM safety limit for 4GB PCs: max 3 buffered video decoders
    if (this.videoCache.size >= 3) {
      const oldestKey = this.videoCache.keys().next().value;
      if (oldestKey) {
        const oldVideo = this.videoCache.get(oldestKey);
        if (oldVideo) {
          oldVideo.pause();
          oldVideo.removeAttribute('src');
          oldVideo.load();
        }
        this.videoCache.delete(oldestKey);
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
      }, 3500);
    });
  }

  /**
   * Prune unused media objects from cache without deleting underlying files
   */
  public pruneUnused(validUrls: Set<string>) {
    this.imageCache.forEach((_, url) => {
      if (!validUrls.has(url)) {
        this.imageCache.delete(url);
        this.preloadedUrls.delete(url);
      }
    });

    this.videoCache.forEach((video, url) => {
      if (!validUrls.has(url)) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        this.videoCache.delete(url);
        this.preloadedUrls.delete(url);
      }
    });
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
   * Preloads current slide + next N slides in sequence
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
      targetSlideIds.push(slidesOrder[currentIndex]); // Current
      targetSlideIds.push(slidesOrder[(currentIndex + 1) % slidesOrder.length]); // Next
      targetSlideIds.push(slidesOrder[(currentIndex + 2) % slidesOrder.length]); // Next+1
    } else {
      targetSlideIds.push(...slidesOrder.slice(0, 3));
    }

    const itemsToPreload = customMediaList.filter(m => targetSlideIds.includes(m.id));
    await this.preloadMediaItems(itemsToPreload);
  }

  /**
   * Preloads static brand assets and UI icons
   */
  public preloadStaticAssets() {
    const staticImages = [
      '/logo-text.png?v=11',
      '/logo-text.png'
    ];
    staticImages.forEach(url => this.preloadImage(url));
  }

  public clearCache() {
    this.imageCache.clear();
    this.videoCache.forEach((video) => {
      video.removeAttribute('src');
      video.load();
    });
    this.videoCache.clear();
    this.preloadedUrls.clear();
  }
}

export const mediaPreloader = new MediaPreloaderService();

