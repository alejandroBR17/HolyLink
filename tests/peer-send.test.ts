import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sendPeerChunk} from '../src/utils/peer-send.ts';

test('media waits for the RTC queue to drain before sending the next block', async () => {
  const sent: unknown[] = [], conn = {open:true,dataChannel:{bufferedAmount:1024*1024},bufferSize:0,send:(value:unknown)=>sent.push(value)};
  const pending = sendPeerChunk(conn,'block',()=>true);
  assert.deepEqual(sent,[]);
  conn.dataChannel.bufferedAmount = 0;
  await pending;
  assert.deepEqual(sent,['block']);
});
test('revoking authorization during backpressure cancels pending media', async () => {
  const sent: unknown[] = [], conn = {open:true,bufferSize:1,send:(v:unknown)=>sent.push(v)};
  let authorized = true;
  const pending = sendPeerChunk(conn,'block',()=>authorized);
  authorized = false;
  await assert.rejects(pending,/interrompida/);
  assert.deepEqual(sent,[]);
});
test('a permanently blocked connection times out rather than waiting forever', async () => {
  await assert.rejects(sendPeerChunk({open:true,bufferSize:1,send:()=>assert.fail('must not send')},'block',()=>true,25),/parou de responder/);
});
