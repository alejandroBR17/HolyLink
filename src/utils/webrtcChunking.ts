// WebRTC Chunking Helper for safe large file transfer (videos, images, audio) over PeerJS DataChannels
import { saveMediaItem } from '../utils';

const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk (optimal for WebRTC)

export interface ChunkTransferMetadata {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number;
  enabledInLoop: boolean;
  muted?: boolean;
  order?: number;
  fit?: 'contain' | 'cover' | 'fill';
  mimeType: string;
  size: number;
}

// Fast Uint8Array to Base64 using chunked String.fromCharCode.apply
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const CHUNK_LEN = 8192;
  for (let i = 0; i < len; i += CHUNK_LEN) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_LEN, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

// In-memory buffer for assembling chunks on receiving side
const transferBuffers = new Map<string, {
  metadata: ChunkTransferMetadata;
  totalChunks: number;
  chunks: (Uint8Array | null)[];
  receivedCount: number;
}>();

export async function sendMediaInChunks(
  sendFn: (data: any) => void,
  metadata: ChunkTransferMetadata,
  blob: Blob,
  onProgress?: (progress: number) => void
): Promise<void> {
  const transferId = `transfer_${metadata.id}_${Date.now()}`;
  const arrayBuffer = await blob.arrayBuffer();
  const totalSize = arrayBuffer.byteLength;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  const fallbackMime = metadata.mimeType || (metadata.type === 'image' ? 'image/png' : 'video/mp4');

  // Send header
  sendFn({
    type: 'MEDIA_CHUNK_START',
    transferId,
    metadata: { ...metadata, mimeType: fallbackMime },
    totalChunks,
    mimeType: blob.type || fallbackMime,
    size: totalSize,
    version: 1
  });

  // Send chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunkBuffer = arrayBuffer.slice(start, end);
    const bytes = new Uint8Array(chunkBuffer);
    const chunkBase64 = uint8ToBase64(bytes);

    sendFn({
      type: 'MEDIA_CHUNK_DATA',
      transferId,
      chunkIndex: i,
      chunkBase64,
      version: 1
    });

    if (onProgress) {
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      onProgress(progress);
    }

    // Yield every 5 chunks to keep UI and event loop responsive
    if (i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
}

export async function handleIncomingChunk(data: any): Promise<{ complete: boolean; item?: any }> {
  if (data.type === 'MEDIA_CHUNK_START') {
    transferBuffers.set(data.transferId, {
      metadata: data.metadata,
      totalChunks: data.totalChunks,
      chunks: new Array(data.totalChunks).fill(null),
      receivedCount: 0
    });
    return { complete: false };
  }

  if (data.type === 'MEDIA_CHUNK_DATA') {
    const buffer = transferBuffers.get(data.transferId);
    if (!buffer) return { complete: false };

    if (!buffer.chunks[data.chunkIndex]) {
      const binaryString = atob(data.chunkBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      buffer.chunks[data.chunkIndex] = bytes;
      buffer.receivedCount++;

      const progress = Math.round((buffer.receivedCount / buffer.totalChunks) * 100);
      window.dispatchEvent(new CustomEvent('projection_sync_progress', {
        detail: { message: `Recebendo mídia: ${buffer.metadata.name} (${progress}%)`, progress }
      }));
    }

    if (buffer.receivedCount >= buffer.totalChunks) {
      // All chunks received -> combine into single Blob
      const combinedBlobParts: Uint8Array[] = [];
      for (let i = 0; i < buffer.totalChunks; i++) {
        const chunk = buffer.chunks[i];
        if (chunk) combinedBlobParts.push(chunk);
      }

      const mimeType = buffer.metadata.mimeType && buffer.metadata.mimeType !== 'application/octet-stream'
        ? buffer.metadata.mimeType
        : (buffer.metadata.type === 'image' ? 'image/png' : 'video/mp4');

      const blob = new Blob(combinedBlobParts, { type: mimeType });
      
      const savePayload = {
        id: buffer.metadata.id,
        type: buffer.metadata.type,
        name: buffer.metadata.name,
        duration: buffer.metadata.duration,
        enabledInLoop: buffer.metadata.enabledInLoop,
        muted: buffer.metadata.muted,
        order: buffer.metadata.order,
        fit: buffer.metadata.fit,
        blob
      };

      await saveMediaItem(savePayload);
      transferBuffers.delete(data.transferId);
      
      return { complete: true, item: savePayload };
    }
  }

  return { complete: false };
}
