import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectionPage} from '../src/utils/projection-page.ts';
test('dense stage content advances all records across shared carousel cycles without mutation',()=>{
 const records=Array.from({length:13},(_,id)=>({id}));
 const pages=Array.from({length:4},(_,cycle)=>projectionPage(records,cycle));
 assert.deepEqual(pages.flatMap(p=>p.items),records);
 assert.ok(pages.every(p=>p.items.length<=4));
 assert.deepEqual(projectionPage(records,4),pages[0]);
 assert.deepEqual(projectionPage(records,-1),pages[3]);
 assert.equal(records.length,13);
});
test('empty and small stage collections retain a valid stable page',()=>{
 assert.deepEqual(projectionPage([],900),{items:[],page:1,pages:1});
 assert.deepEqual(projectionPage(['a','b'],72),{items:['a','b'],page:1,pages:1});
});
