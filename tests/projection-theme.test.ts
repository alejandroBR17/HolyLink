import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isYouthProjection} from '../src/utils/projection-theme.ts';
test('operator preview and projection share the youth meeting window without changing its limits', () => {
  const now = new Date('2026-10-14T18:00:00Z'), next = {theme: 'Encontro FJU'};
  const at = (minutes: number) => new Date(now.getTime() + minutes * 60000);
  assert.equal(isYouthProjection({theme:'Força Jovem'}, null, null, now), true);
  assert.equal(isYouthProjection(null, next, at(240), now), true);
  assert.equal(isYouthProjection(null, next, at(241), now), false);
  assert.equal(isYouthProjection(null, next, at(-90), now), true);
  assert.equal(isYouthProjection(null, next, at(-91), now), false);
  assert.equal(isYouthProjection(null, {theme:'Reunião de oração'}, at(0), now), false);
});


test('manual FJU overrides agenda both ways while auto keeps the existing schedule window',()=>{
 const now=new Date('2026-10-16T12:00:00Z'),future=new Date('2026-10-17T12:00:00Z');
 assert.equal(isYouthProjection(null,null,null,now,'fju'),true);
 assert.equal(isYouthProjection({theme:'Reunião normal'},null,null,now,'fju'),true);
 assert.equal(isYouthProjection({theme:'Encontro FJU'},{theme:'Força Jovem'},now,now,'regular'),false);
 assert.equal(isYouthProjection(null,{theme:'Encontro FJU'},future,now,'auto'),false);
 assert.equal(isYouthProjection({theme:'Encontro FJU'},null,null,now,'auto'),true);
});
