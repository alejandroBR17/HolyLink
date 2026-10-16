import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isSharedStateUpdate, readSharedStorage} from '../src/utils/shared-state.ts';

test('remote commands cannot change identity or write unknown/prototype keys', () => {
  for (const key of ['deviceRole', 'myReceiverCode', 'lastPairedPeerCode', '__proto__', 'constructor', 'unrelated']) {
    assert.equal(isSharedStateUpdate(key, 'phone'), false);
  }
  assert.deepEqual(readSharedStorage({projection_deviceRole:'phone', unrelated:'value', projection_blackoutEnabled:'true'}), {projection_blackoutEnabled:'true'});
});
test('malformed numbers, null volume, invalid enums and oversized text are rejected', () => {
  for (const value of [null, {}, '', NaN, Infinity, -1, 2, 'NaN']) assert.equal(isSharedStateUpdate('volume', value), false);
  assert.equal(isSharedStateUpdate('volume', '0.5'), true);
  assert.equal(isSharedStateUpdate('background3DFps', '0'), false);
  assert.equal(isSharedStateUpdate('background3DStyle', 'aurora'), true);
  assert.equal(isSharedStateUpdate('projectionMode', 'post'), true);
  assert.equal(isSharedStateUpdate('customVerseText', null), true);
  assert.equal(isSharedStateUpdate('customVerseRef', null), true);
  assert.equal(isSharedStateUpdate('customVerseText', 'x'.repeat(100_001)), false);
});
test('collections preserve supported object and serialized formats, reject invalid members', () => {
  assert.equal(isSharedStateUpdate('slidesOrder', ['intro','verse']), true);
  assert.equal(isSharedStateUpdate('slidesOrder', '["intro"]'), true);
  for (const value of ['{}','[null]', [{id:'x'}], Array(501).fill('x')]) assert.equal(isSharedStateUpdate('slidesOrder', value), false);
  const meeting = {id:'one',theme:'Reunião',day:0,dayName:'Domingo',time:'08:00',hours:8,minutes:0};
  assert.equal(isSharedStateUpdate('customMeetings', [meeting]), true);
  assert.equal(isSharedStateUpdate('customMeetings', [{...meeting,time:'28:00'}]), false);
  assert.equal(isSharedStateUpdate('customCampaigns', [{id:'a',title:'Campanha',duration:'Semanal',iconType:'faith'}]), true);
});
test('a corrupt storage bag fails atomically and never restores window lifecycle or device state', () => {
  assert.throws(()=>readSharedStorage({projection_volume:'0.5',projection_customMeetings:'{}'}));
  assert.throws(()=>readSharedStorage([]));
  assert.deepEqual(readSharedStorage({projection_isProjectionOpen:'true',projection_projectionCloseTrigger:'123',projection_mediaUpdateTrigger:'123',projection_myReceiverCode:'ABC234'}), {});
});


test('countdown target is bounded and may be explicitly cleared',()=>{
 assert.equal(isSharedStateUpdate('countdownAnchor',new Date(2026,9,16).getTime()),true);assert.equal(isSharedStateUpdate('countdownAnchor',null),true);
 for(const value of [-1,NaN,Infinity,{},'tomorrow',4102444800001,1.5])assert.equal(isSharedStateUpdate('countdownAnchor',value),false);
});
