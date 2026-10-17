import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectProjectionVerse} from '../src/utils/verse-selection.ts';
const verses=[{text:'Primeiro',ref:'A'},{text:'Segundo',ref:'B'},{text:'Terceiro',ref:'C'}];
test('operator and projection share custom/manual/automatic verse precedence',()=>{
  assert.equal(selectProjectionVerse(verses,{text:'Personalizado',ref:'Referência',index:1,loop:2,timeMs:0}).verse.ref,'Referência');
  assert.equal(selectProjectionVerse(verses,{index:99,loop:1,timeMs:0}).verse.ref,'C');
  assert.equal(selectProjectionVerse(verses,{index:-2,timeMs:0}).verse.ref,'A');
  assert.equal(selectProjectionVerse(verses,{loop:1,offset:1,timeMs:0}).verse.ref,'C');
});
test('automatic verse selection stays valid before the carousel origin and with clock fallback',()=>{
  assert.equal(selectProjectionVerse(verses,{loop:-1,timeMs:0}).verse.ref,'C');
  assert.equal(selectProjectionVerse(verses,{timeMs:15000,offset:1}).verse.ref,'C');
  assert.deepEqual(selectProjectionVerse([],{timeMs:0}).verse,{text:'',ref:''});
});
