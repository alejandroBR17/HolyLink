import {MediaUrlPool} from '../utils/media-urls';
import {readTransferMetadata} from '../utils/chunk-assembler';
import {readMediaCatalog, describeMedia} from '../utils/media-manifest';
import type {MediaManifestItem} from '../utils/media-manifest';
import {sendPeerChunk} from '../utils/peer-send';
import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { saveMediaItem, getAllMediaItems, deleteMediaItem } from '../utils';
import { broadcastToPeers, getApprovedPeerConnections } from '../components/SyncSection';
import { sendMediaInChunks } from '../utils/webrtcChunking';
import { mediaPreloader } from '../utils/preloader';

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
  const [remoteMediaList,setRemoteMediaList]=useState<MediaManifestItem[]>([]);
  useEffect(()=>{const receive=(event:Event)=>{try {setRemoteMediaList(readMediaCatalog((event as CustomEvent).detail));} catch {}};window.addEventListener('holylink_remote_catalog',receive);return()=>window.removeEventListener('holylink_remote_catalog',receive);},[]);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [mediaLoadError,setMediaLoadError]=useState<string|null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const urlPool=useRef<MediaUrlPool|null>(null);
  useEffect(()=>()=>{urlPool.current?.dispose();urlPool.current=null;},[]);

  // Reads may finish out of order; only the latest effect publishes a snapshot.
  useEffect(()=>{
    let active=true;
    void getAllMediaItems().then(items=>{
      if(!active)return;
      const pool=urlPool.current??(urlPool.current=new MediaUrlPool());
      const retryId=mediaUpdateTrigger.startsWith('retry:')?mediaUpdateTrigger.slice(6,mediaUpdateTrigger.lastIndexOf(':')):undefined;
      const urls=pool.update(items,retryId);
      const sorted=[...items].sort((a,b)=>{
        if(a.order!==undefined&&b.order!==undefined)return a.order-b.order;
        if(a.order!==undefined)return -1;if(b.order!==undefined)return 1;
        const ai=a.id.match(/\d+$/),bi=b.id.match(/\d+$/);
        return ai&&bi?Number(ai[0])-Number(bi[0]):a.id.localeCompare(b.id);
      });
      setCustomMediaList(sorted.map(item=>({id:item.id,type:item.type,name:item.name,
        duration:item.duration,enabledInLoop:item.enabledInLoop,url:urls.get(item.id)||'',
        muted:item.muted??true,order:item.order,fit:item.fit})));
      setMediaLoadError(null);setIsMediaLoaded(true);
    }).catch(error=>{
      if(!active)return;
      console.error('Failed to load custom media from DB',error);
      setMediaLoadError('Não foi possível ler a biblioteca local.');setIsMediaLoaded(true);
    });
    return()=>{active=false;};
  },[mediaUpdateTrigger]);

  const broadcastMediaSave = useCallback(async (item: any, includeFile = false) => {
    // Snapshot the recipients: a phone joining midway must not receive orphaned blocks.
    let targets = getApprovedPeerConnections();
    if (!targets.length) return;
    if (!includeFile) {
      broadcastToPeers({type:'MEDIA_SAVE', version:1, mediaItem:{id:item.id,type:item.type,name:item.name,
        duration:item.duration,enabledInLoop:item.enabledInLoop,muted:item.muted,order:item.order,fit:item.fit}});
      return;
    }
    const send = async (data: any) => {
      const results = await Promise.allSettled(targets.map(conn => sendPeerChunk(conn, data, () => getApprovedPeerConnections().includes(conn))));
      targets = targets.filter((_, index) => results[index].status === 'fulfilled');
      if (!targets.length) throw new Error('A transferência foi interrompida: não há aparelhos conectados.');
    };
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

      if (realBlob && realBlob.size > 0) {
        const mimeType = realBlob.type || 'application/octet-stream';
        if(localStorage.getItem('projection_deviceRole')==='phone') {
          readTransferMetadata({...item,mimeType,size:realBlob.size});
          const manifest=await describeMedia([{...item,blob:realBlob}],()=>targets.some(conn=>conn.open));
          await send({type:'SYNC_MANIFEST',version:1,localStorage:{},mediaManifest:manifest,scope:'media-only'});
          return;
        }

        await sendMediaInChunks(
          send,
          {
            id: item.id,
            type: item.type,
            name: item.name,
            duration: item.duration,
            enabledInLoop: item.enabledInLoop,
            muted: item.muted,
            order: item.order,
            fit: item.fit,
            mimeType,
            size: realBlob.size
          },
          realBlob
        );
      } else {
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
            fit: item.fit
          },
          version: 1
        });
      }
    } catch (e) {
      console.error("Error broadcasting media save:", e);
      setUploadError('Mídia salva neste aparelho, mas não enviada aos outros. ' + (e instanceof Error ? e.message : 'Confira a conexão e tente sincronizar novamente.'));
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
      if (isImage) {
        const customDefDur = Number(localStorage.getItem('projection_default_img_duration'));
        if (customDefDur && !isNaN(customDefDur) && customDefDur >= 2000) {
          duration = customDefDur;
        }
      }

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
      void broadcastMediaSave(mediaItemPayload, true);

      try {
        const savedOrderStr = localStorage.getItem('projection_slidesOrder');
        let currentOrder: string[] = [];
        if (savedOrderStr) {
          try {
            currentOrder = JSON.parse(savedOrderStr);
          } catch (e) {}
        }
        if (!currentOrder.includes(id)) {
          currentOrder.push(id);
          updateStateAndBroadcast('slidesOrder', JSON.stringify(currentOrder));
        }
      } catch (e) {}

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
        const {blob:_blob,localBlobVersion:_version,...metadata}=sortedItems[i];
        await saveMediaItem(metadata);
        broadcastMediaSave(sortedItems[i]);
      }

      const savedOrderStr = localStorage.getItem('projection_slidesOrder');
      if (savedOrderStr) {
        try {
          let currentOrder: string[] = JSON.parse(savedOrderStr);
          const newMediaOrderIds = sortedItems.map(m => m.id);
          const nonMediaOrder = currentOrder.filter(id => !newMediaOrderIds.includes(id));
          const updatedSlidesOrder = [...nonMediaOrder, ...newMediaOrderIds];
          updateStateAndBroadcast('slidesOrder', JSON.stringify(updatedSlidesOrder));
        } catch (e) {}
      }

      updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
    } catch (err) {
      console.error("Failed to move media item:", err);
    }
  }, [broadcastMediaSave, updateStateAndBroadcast]);

  return {
    remoteMediaList,
    customMediaList,
    isMediaLoaded,
    mediaLoadError,
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
