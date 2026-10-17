import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PairingSession, createPairingCode, isPairingCode} from '../src/utils/pairing-session.ts';

test('a new connection cannot exchange application data until its own approval', () => {
  const first = new PairingSession('ABC234', 100);
  const other = new PairingSession('DEF567', 100);
  assert.equal(first.approved, false);
  assert.equal(first.approve('DEF567', 200), false);
  assert.equal(first.approve('ABC234', 200), true);
  assert.equal(first.approved, true);
  assert.equal(other.approved, false);
  first.close();
  assert.equal(first.approved, false);
  assert.equal(first.approve('ABC234', 300), false);
});

test('expired requests and duplicate approvals cannot open a session', () => {
  assert.equal(new PairingSession('ABC234', 100).approve('ABC234', 60_100), false);
  const session = new PairingSession('ABC234', 100);
  assert.equal(session.approve('ABC234', 101), true);
  assert.equal(session.approve('ABC234', 102), false);
});

test('codes use secure random bytes and exclude ambiguous symbols and invalid input', () => {
  for (let i = 0; i < 100; i++) assert.equal(isPairingCode(createPairingCode()), true);
  for (const invalid of ['', 'ABC123', 'AAAAAA ', 'ABC234/extra', null, {}, 123456]) {
    assert.equal(isPairingCode(invalid), false);
  }
});
