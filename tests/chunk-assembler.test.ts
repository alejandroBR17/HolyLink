import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MediaChunkAssembler, MEDIA_CHUNK_BYTES, MAX_REMOTE_MEDIA_BYTES, CHUNK_IDLE_MS, readTransferMetadata} from '../src/utils/chunk-assembler.ts';

const header = (size = 3, id = 'one') => ({type:'MEDIA_CHUNK_START', transferId:id, version:1, size,
  totalChunks:Math.ceil(size / MEDIA_CHUNK_BYTES), metadata:{id:'custom_image',type:'image',name:'foto.png',duration:10000,
    enabledInLoop:true, mimeType:'image/png', size, fit:'contain'}});
const chunk = (bytes: Uint8Array | number[] = [1,2,3], index = 0, id = 'one') => ({type:'MEDIA_CHUNK_DATA',version:1,transferId:id,
  chunkIndex:index,chunkBase64:Buffer.from(bytes).toString('base64')});

test('out-of-order blocks reconstruct the exact bytes with their original display metadata', async () => {
  const a = new MediaChunkAssembler(), first = new Uint8Array(MEDIA_CHUNK_BYTES).fill(75);
  a.accept(header(first.length + 3));
  assert.equal(a.accept(chunk([1,2,3],1)), null);
  const result = a.accept(chunk(first));
  assert.ok(result);
  assert.equal(result.blob.size, first.length + 3);
  assert.equal(result.metadata.fit,'contain');
  assert.deepEqual(new Uint8Array(await result.blob.arrayBuffer()), Uint8Array.from([...first,1,2,3]));
  assert.equal(a.pendingCount, 0);
});
test('impossible headers are rejected before any large buffer allocation', () => {
  const a = new MediaChunkAssembler();
  for (const value of [{...header(),totalChunks:1e12}, {...header(),size:-1}, {...header(),version:2}, header(MAX_REMOTE_MEDIA_BYTES+1),
    {...header(),metadata:{...header().metadata,enabledInLoop:'yes'}}, {...header(),metadata:{...header().metadata,mimeType:'text/html'}}]) {
    assert.throws(()=>a.accept(value));
    assert.equal(a.pendingCount,0);
  }
});
test('duplicate chunks cannot complete a partially received file', () => {
  const a = new MediaChunkAssembler(), bytes = new Uint8Array(MEDIA_CHUNK_BYTES);
  a.accept(header(bytes.length+3));
  assert.equal(a.accept(chunk(bytes)),null);
  assert.equal(a.accept(chunk(bytes)),null);
  assert.equal(a.pendingCount,1);
  assert.ok(a.accept(chunk([1,2,3],1)));
});
test('negative/fractional/out-of-range indices and incorrect base64 lengths are rejected', () => {
  const a = new MediaChunkAssembler();a.accept(header());
  for (const value of [chunk([1,2,3],-1),chunk([1,2,3],0.5),chunk([1,2,3],1),chunk([1,2]),
    {...chunk(),chunkBase64:'!!!!'}, {...chunk(),chunkBase64:'A==='}]) assert.throws(()=>a.accept(value));
  assert.ok(a.accept(chunk()));
});
test('connections have independent namespaces even when transfer IDs collide', async () => {
  const a = new MediaChunkAssembler(), b = new MediaChunkAssembler();
  a.accept(header());
  assert.throws(()=>b.accept(chunk()));
  b.accept(header());
  const one = a.accept(chunk([1,2,3])), two = b.accept(chunk([4,5,6]));
  assert.deepEqual([...new Uint8Array(await one!.blob.arrayBuffer())],[1,2,3]);
  assert.deepEqual([...new Uint8Array(await two!.blob.arrayBuffer())],[4,5,6]);
});
test('simultaneous transfers and declared byte reservations are bounded', () => {
  const a = new MediaChunkAssembler();a.accept(header(MAX_REMOTE_MEDIA_BYTES));
  assert.throws(()=>a.accept(header(1,'two')));
  a.clear();a.accept(header(3,'one'));a.accept(header(3,'two'));
  assert.throws(()=>a.accept(header(3,'three')));
  assert.throws(()=>a.accept(header(3,'one')));
  assert.ok(a.accept(chunk()));
  assert.equal(a.accept(header(3,'three')),null);
});
test('inactive transfers expire and explicit disposal releases all unfinished data', () => {
  let now = 100;
  const a = new MediaChunkAssembler(()=>now);a.accept(header());
  now += CHUNK_IDLE_MS;a.prune();assert.equal(a.pendingCount,0);
  assert.throws(()=>a.accept(chunk()));
  a.accept(header());a.clear();assert.equal(a.pendingCount,0);assert.throws(()=>a.accept(chunk()));
});
test('unknown metadata fields are not retained in saved files', () => {
  const value = readTransferMetadata({...header().metadata,unrelated:'untrusted',blob:'untrusted'});
  assert.equal(Object.hasOwn(value,'unrelated'),false);
  assert.equal(Object.hasOwn(value,'blob'),false);
});
