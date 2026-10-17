export const MEDIA_CHUNK_BYTES = 64 * 1024;
export const MAX_REMOTE_MEDIA_BYTES = 128 * 1024 * 1024;
export const CHUNK_IDLE_MS = 60_000;

export interface ChunkTransferMetadata {
  id: string; type: 'image' | 'video'; name: string; duration: number; enabledInLoop: boolean;
  muted?: boolean; order?: number; fit?: 'contain' | 'cover' | 'fill'; mimeType: string; size: number;
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const bounded = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

export function readTransferMetadata(value: unknown): ChunkTransferMetadata {
  if (!object(value) || !bounded(value.id, 200) || !bounded(value.name, 500) || !['image','video'].includes(value.type as string)
    || !finite(value.duration, 0, 86_400_000) || typeof value.enabledInLoop !== 'boolean'
    || !finite(value.size, 1, MAX_REMOTE_MEDIA_BYTES) || !Number.isInteger(value.size)
    || !bounded(value.mimeType, 100) || !(value.mimeType.startsWith(value.type + '/') || value.mimeType === 'application/octet-stream')
    || (value.muted !== undefined && typeof value.muted !== 'boolean')
    || (value.order !== undefined && (!finite(value.order, -1, 1_000_000) || !Number.isInteger(value.order)))
    || (value.fit !== undefined && !['contain','cover','fill'].includes(value.fit as string))) {
    throw new Error('Mídia inválida ou maior que o limite de transferência de 128 MB.');
  }
  // Keep only known fields; never persist arbitrary properties from another device.
  return {id:value.id, type:value.type as 'image' | 'video', name:value.name, duration:value.duration,
    enabledInLoop:value.enabledInLoop, size:value.size, mimeType:value.mimeType,
    muted:value.muted as boolean | undefined, order:value.order as number | undefined, fit:value.fit as ChunkTransferMetadata['fit']};
}

export function decodeMediaChunk(value: unknown, expectedBytes: number): Uint8Array {
  if (typeof value !== 'string' || value.length !== 4 * Math.ceil(expectedBytes / 3) || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error('Bloco de mídia inválido.');
  }
  const binary = atob(value);
  if (binary.length !== expectedBytes) throw new Error('Tamanho do bloco de mídia não confere.');
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

interface Transfer {metadata: ChunkTransferMetadata; count: number; chunks: Map<number, Uint8Array>; lastAt: number;}

/** One assembler per authorized connection. No buffers or IDs are shared between devices. */
export class MediaChunkAssembler {
  private transfers = new Map<string, Transfer>();
  private now: () => number;
  constructor(now = Date.now) { this.now = now; }
  get pendingCount() { return this.transfers.size; }
  progressFor(id: string) {
    const transfer = this.transfers.get(id);
    return transfer ? {name:transfer.metadata.name, progress:Math.round(100 * transfer.chunks.size / transfer.count)} : null;
  }
  clear() { this.transfers.clear(); }
  prune() {
    for (const [id, transfer] of this.transfers) {
      if (this.now() - transfer.lastAt >= CHUNK_IDLE_MS) this.transfers.delete(id);
    }
  }
  accept(data: unknown): {metadata: ChunkTransferMetadata; blob: Blob} | null {
    this.prune();
    if (!object(data) || data.version !== 1 || !bounded(data.transferId, 250)) throw new Error('Transferência de mídia inválida.');
    if (data.type === 'MEDIA_CHUNK_START') {
      const metadata = readTransferMetadata(data.metadata);
      const count = Math.ceil(metadata.size / MEDIA_CHUNK_BYTES);
      if (data.totalChunks !== count || data.size !== metadata.size || this.transfers.has(data.transferId)) throw new Error('Cabeçalho de mídia inválido ou repetido.');
      const reserved = [...this.transfers.values()].reduce((sum, t) => sum + t.metadata.size, 0);
      if (this.transfers.size >= 2 || reserved + metadata.size > MAX_REMOTE_MEDIA_BYTES) throw new Error('Aguarde a transferência atual terminar.');
      this.transfers.set(data.transferId, {metadata, count, chunks:new Map(), lastAt:this.now()});
      return null;
    }
    if (data.type !== 'MEDIA_CHUNK_DATA') throw new Error('Tipo de bloco de mídia desconhecido.');
    const transfer = this.transfers.get(data.transferId);
    if (!transfer || !Number.isInteger(data.chunkIndex) || !finite(data.chunkIndex, 0, transfer.count - 1)) throw new Error('Bloco sem transferência ativa ou com índice inválido.');
    if (transfer.chunks.has(data.chunkIndex)) return null;
    const expected = Math.min(MEDIA_CHUNK_BYTES, transfer.metadata.size - data.chunkIndex * MEDIA_CHUNK_BYTES);
    const bytes = decodeMediaChunk(data.chunkBase64, expected);
    transfer.chunks.set(data.chunkIndex, bytes);
    transfer.lastAt = this.now();
    if (transfer.chunks.size !== transfer.count) return null;
    const chunks = Array.from({length:transfer.count}, (_, index) => transfer.chunks.get(index)!);
    this.transfers.delete(data.transferId);
    const mimeType = transfer.metadata.mimeType === 'application/octet-stream'
      ? (transfer.metadata.type === 'image' ? 'image/png' : 'video/mp4') : transfer.metadata.mimeType;
    return {metadata:transfer.metadata, blob:new Blob(chunks, {type:mimeType})};
  }
}
