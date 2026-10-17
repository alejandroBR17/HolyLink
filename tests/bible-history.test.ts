import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rememberPassage, readPassageHistory} from '../src/utils/bible-history.ts';

test('projection history deduplicates full passages and keeps only the latest eight', () => {
  let history: {text:string;ref:string}[] = [];
  for (let i = 0; i < 12; i++) history = rememberPassage(history, {text: 'Leitura ' + i, ref: 'Salmos ' + i});
  assert.equal(history.length, 8);
  const repeated = history[3];
  history = rememberPassage(history, repeated);
  assert.deepEqual(history[0], repeated);
  assert.equal(history.length, 8);
  assert.equal(history.filter(item => item.ref === repeated.ref).length, 1);
});
test('corrupt or unbounded stored history cannot flood the operator interface', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let raw = 'bad-json';
  Object.defineProperty(globalThis, 'localStorage', {configurable:true, value:{getItem:()=>raw}});
  try {
    assert.deepEqual(readPassageHistory(), []);
    raw = JSON.stringify([{text:123, ref:'bad'}, {text:'',ref:'empty'}, ...Array.from({length:20}, (_,i)=>({text:'texto',ref:String(i)}))]);
    assert.equal(readPassageHistory().length, 8);
    assert.equal(readPassageHistory()[0].ref, '0');
  } finally {if (original) Object.defineProperty(globalThis,'localStorage',original);else Reflect.deleteProperty(globalThis,'localStorage');}
});
