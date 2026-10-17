import {saveMediaItem} from '../utils';
import {MediaChunkAssembler, MEDIA_CHUNK_BYTES, readTransferMetadata} from './chunk-assembler';
import type {ChunkTransferMetadata} from './chunk-assembler';
export type {ChunkTransferMetadata} from './chunk-assembler';

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
interface Incoming {assembler: MediaChunkAssembler; abort: AbortController; timer?: ReturnType<typeof setInterval>; noticeAt: number;}
const incomingByConnection = new WeakMap<object, Incoming>();

export function cancelIncomingTransfers(connection: object) {
  const incoming = incomingByConnection.get(connection);
  if (!incoming) return;
  incoming.abort.abort();
  incoming.assembler.clear();
  clearInterval(incoming.timer);
  incomingByConnection.delete(connection);
}

export async function sendMediaInChunks(
  sendFn: (data: any) => void | Promise<void>, metadata: ChunkTransferMetadata, blob: Blob,
  onProgress?: (progress: number) => void
): Promise<void> {
  const safe = readTransferMetadata({...metadata, size:blob.size});
  const transferId = `transfer_${safe.id}_${crypto.randomUUID()}`;
  const totalChunks = Math.ceil(blob.size / MEDIA_CHUNK_BYTES);
  await sendFn({type:'MEDIA_CHUNK_START', transferId, metadata:safe, totalChunks, size:blob.size, version:1});
  for (let i = 0; i < totalChunks; i++) {
    // Read just this block. A large video no longer requires a whole-file ArrayBuffer.
    const bytes = new Uint8Array(await blob.slice(i * MEDIA_CHUNK_BYTES, (i + 1) * MEDIA_CHUNK_BYTES).arrayBuffer());
    await sendFn({type:'MEDIA_CHUNK_DATA', transferId, chunkIndex:i, chunkBase64:uint8ToBase64(bytes), version:1});
    onProgress?.(Math.round(100 * (i + 1) / totalChunks));
    if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 5));
  }
}

export async function handleIncomingChunk(data: any, connection: object): Promise<{complete: boolean; item?: any}> {
  let incoming = incomingByConnection.get(connection);
  if (!incoming) {
    incoming = {assembler:new MediaChunkAssembler(), abort:new AbortController(), noticeAt:0};
    incomingByConnection.set(connection, incoming);
  }
  const result = incoming.assembler.accept(data);
  if (incoming.assembler.pendingCount && !incoming.timer) {
    const current = incoming;
    current.timer = setInterval(() => {
      current.assembler.prune();
      if (!current.assembler.pendingCount) {clearInterval(current.timer); current.timer = undefined;}
    }, 10_000);
  } else if (!incoming.assembler.pendingCount) {
    clearInterval(incoming.timer);
    incoming.timer = undefined;
  }
  const progress = result ? {name:result.metadata.name, progress:100} : incoming.assembler.progressFor(data.transferId);
  if (progress && !result && Date.now() - incoming.noticeAt >= 100) {
    incoming.noticeAt = Date.now();
    window.dispatchEvent(new CustomEvent('projection_sync_progress', {detail:{message:`Recebendo mídia: ${progress.name} (${progress.progress}%)`, progress:progress.progress}}));
  }
  if (!result) return {complete:false};
  const {size: _size, mimeType: _mime, ...metadata} = result.metadata;
  const item = {...metadata, blob:result.blob};
  await saveMediaItem(item, incoming.abort.signal);
  incoming.abort.signal.throwIfAborted();
  window.dispatchEvent(new CustomEvent('projection_sync_progress', {detail:{message:`Mídia salva: ${result.metadata.name}`, progress:100}}));
  return {complete:true, item};
}
