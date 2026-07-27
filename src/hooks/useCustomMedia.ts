import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { saveMediaItem, getAllMediaItems, deleteMediaItem } from '../utils';
import { broadcastToPeers } from '../components/SyncSection';

export interface CustomMedia {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number;
  enabledInLoop: boolean;
  url: string;
  muted?: boolean;
  order?: number;
  fit?: 'contain' | 'cover' | 'fill';
}

export function useCustomMedia(
  mediaUpdateTrigger: string,
  updateStateAndBroadcast: (key: string, value: any) => void
) {
  const [customMediaList, setCustomMediaList] = useState<CustomMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load custom media files from IndexedDB and safely manage Blob Object URLs
  useEffect(() => {
    let active = true;
    const objectUrlsToRevoke: string[] = [];

    const loadMedia = async () => {
      try {
        const items = await getAllMediaItems();
        if (!active) return;
        
        setCustomMediaList((prevList) => {
          // Track existing object URLs to revoke after replacing state
          prevList.forEach((m) => {
            if (m.url && m.url.startsWith('blob:')) {
              objectUrlsToRevoke.push(m.url);
            }
          });
          
          const sortedItems = [...items].sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            
            const aMatch = a.id.match(/\d+$/);
            const bMatch = b.id.match(/\d+$/);
            if (aMatch && bMatch) {
              return parseInt(aMatch[0], 10) - parseInt(bMatch[0], 10);
            }
            return a.id.localeCompare(b.id);
          });

          return sortedItems.map((item) => {
            let itemUrl = '';
            if (item.blob instanceof Blob) {
              try {
                itemUrl = URL.createObjectURL(item.blob);
              } catch (e) {
                console.error("Error creating Object URL for item:", item.id, e);
              }
            } else if (item.blob && typeof item.blob === 'object') {
              try {
                const anyBlob = item.blob as any;
                if (anyBlob.buffer && (anyBlob.buffer instanceof ArrayBuffer || anyBlob.buffer instanceof Uint8Array)) {
                  const b = new Blob([anyBlob.buffer], { type: anyBlob.type || 'application/octet-stream' });
                  itemUrl = URL.createObjectURL(b);
                } else if (anyBlob.bytes) {
                  const b = new Blob([anyBlob.bytes], { type: anyBlob.type || 'application/octet-stream' });
                  itemUrl = URL.createObjectURL(b);
                }
              } catch (e) {
                console.error("Error reconstructing blob for item:", item.id, e);
              }
            }

            return {
              id: item.id,
              type: item.type,
              name: item.name,
              duration: item.duration,
              enabledInLoop: item.enabledInLoop,
              url: itemUrl,
              muted: item.muted !== undefined ? item.muted : true,
              order: item.order,
              fit: item.fit
            };
          });
        });

        // Revoke replaced URLs asynchronously after DOM update
        setTimeout(() => {
          objectUrlsToRevoke.forEach(url => {
            try {
              URL.revokeObjectURL(url);
            } catch (e) {}
          });
        }, 1000);
      } catch (err) {
        console.error("Failed to load custom media from DB", err);
      }
    };

    loadMedia();

    return () => {
      active = false;
    };
  }, [mediaUpdateTrigger]);

  const broadcastMediaSave = useCallback(async (item: any) => {
    try {
      let blobToUse = item.blob;
      if (!blobToUse) {
        const dbItems = await getAllMediaItems();
        const found = dbItems.find(m => m.id === item.id);
        if (found && found.blob) {
          blobToUse = found.blob;
        }
      }

      let realBlob: Blob | null = null;
      if (blobToUse instanceof Blob) {
        realBlob = blobToUse;
      } else if (blobToUse && typeof blobToUse === 'object') {
        const anyBlob = blobToUse as any;
        if (anyBlob.buffer && (anyBlob.buffer instanceof ArrayBuffer || anyBlob.buffer instanceof Uint8Array || Array.isArray(anyBlob.buffer))) {
          realBlob = new Blob([anyBlob.buffer], { type: anyBlob.type || 'application/octet-stream' });
        } else if (anyBlob.bytes && (anyBlob.bytes instanceof ArrayBuffer || anyBlob.bytes instanceof Uint8Array || Array.isArray(anyBlob.bytes))) {
          realBlob = new Blob([anyBlob.bytes], { type: anyBlob.type || 'application/octet-stream' });
        } else if (anyBlob.blob && anyBlob.blob instanceof Blob) {
          realBlob = anyBlob.blob;
        }
      }

      let base64: string | undefined = undefined;
      let mimeType = 'application/octet-stream';

      if (realBlob) {
        mimeType = realBlob.type || 'application/octet-stream';
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1] || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(realBlob!);
        });
      }

      broadcastToPeers({
        type: 'MEDIA_SAVE',
        mediaItem: {
          id: item.id,
          type: item.type,
          name: item.name,
          duration: item.duration,
          enabledInLoop: item.enabledInLoop,
          muted: item.muted,
          order: item.order,
          fit: item.fit,
          mimeType,
          base64
        },
        version: 1
      });
    } catch (e) {
      console.error("Error broadcasting media save:", e);
    }
  }, []);

  const broadcastMediaDelete = useCallback((id: string) => {
    broadcastToPeers({
      type: 'MEDIA_DELETE',
      id,
      version: 1
    });
  }, []);

  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setUploadError("Por favor, selecione apenas arquivos de imagem ou vídeo.");
      setIsUploading(false);
      return;
    }

    try {
      let duration = 10000;

      if (isVideo) {
        duration = await new Promise<number>((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          const objectUrl = URL.createObjectURL(file);
          video.src = objectUrl;
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            const d = video.duration;
            if (typeof d === 'number' && !isNaN(d) && isFinite(d) && d > 0) {
              resolve(Math.round(d * 1000));
            } else {
              resolve(10000);
            }
          };
          video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(10000);
          };
        });
      }

      const currentItems = await getAllMediaItems();
      const maxOrder = currentItems.reduce((max, item) => Math.max(max, item.order ?? 0), -1);
      const order = maxOrder + 1;

      const id = `custom_${isVideo ? 'vid' : 'img'}_${Date.now()}`;
      const mediaItemPayload = {
        id,
        type: (isVideo ? 'video' : 'image') as 'video' | 'image',
        name: file.name,
        duration,
        enabledInLoop: true,
        blob: file,
        muted: isVideo ? true : undefined,
        order
      };
      await saveMediaItem(mediaItemPayload);
      broadcastMediaSave(mediaItemPayload);

      updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
    } catch (err: any) {
      console.error("Error saving uploaded file:", err);
      setUploadError("Não foi possível salvar o arquivo. Limite de armazenamento pode ter sido excedido.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [broadcastMediaSave, updateStateAndBroadcast]);

  const handleMoveMedia = useCallback(async (mediaId: string, direction: 'up' | 'down') => {
    try {
      const items = await getAllMediaItems();
      
      const sortedItems = [...items].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        
        const aMatch = a.id.match(/\d+$/);
        const bMatch = b.id.match(/\d+$/);
        if (aMatch && bMatch) {
          return parseInt(aMatch[0], 10) - parseInt(bMatch[0], 10);
        }
        return a.id.localeCompare(b.id);
      });

      const idx = sortedItems.findIndex(item => item.id === mediaId);
      if (idx === -1) return;

      if (direction === 'up' && idx > 0) {
        const temp = sortedItems[idx];
        sortedItems[idx] = sortedItems[idx - 1];
        sortedItems[idx - 1] = temp;
      } else if (direction === 'down' && idx < sortedItems.length - 1) {
        const temp = sortedItems[idx];
        sortedItems[idx] = sortedItems[idx + 1];
        sortedItems[idx + 1] = temp;
      } else {
        return;
      }

      for (let i = 0; i < sortedItems.length; i++) {
        sortedItems[i].order = i;
        await saveMediaItem(sortedItems[i]);
        broadcastMediaSave(sortedItems[i]);
      }

      updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
    } catch (err) {
      console.error("Failed to move media item:", err);
    }
  }, [broadcastMediaSave, updateStateAndBroadcast]);

  return {
    customMediaList,
    isUploading,
    uploadError,
    handleFileUpload,
    handleMoveMedia,
    broadcastMediaSave,
    broadcastMediaDelete,
    deleteMediaItem,
    saveMediaItem
  };
}
