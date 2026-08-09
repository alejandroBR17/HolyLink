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

  // Send header
  sendFn({
    type: 'MEDIA_CHUNK_START',
    transferId,
    metadata,
    totalChunks,
    mimeType: blob.type || 'application/octet-stream',
    size: totalSize,
    version: 1
  });

  // Send chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunkBuffer = arrayBuffer.slice(start, end);
    const bytes = new Uint8Array(chunkBuffer);
    
    // Convert chunk bytes to binary string for JSON compatibility
    let binary = '';
    for (let j = 0; j < bytes.byteLength; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
    const chunkBase64 = btoa(binary);

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

    // Yield every 10 chunks to keep UI responsive
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
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

    if (buffer.receivedCount === buffer.totalChunks) {
      // All chunks received -> combine into single Blob
      const combinedBlobParts: Uint8Array[] = [];
      for (let i = 0; i < buffer.totalChunks; i++) {
        const chunk = buffer.chunks[i];
        if (chunk) combinedBlobParts.push(chunk);
      }

      const blob = new Blob(combinedBlobParts, { type: buffer.metadata.mimeType || 'application/octet-stream' });
      
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
