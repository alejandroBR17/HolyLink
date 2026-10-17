import test from 'node:test';
import assert from 'node:assert/strict';
import {symbolMotion} from '../src/utils/projection-motion.ts';
test('existing effect choices control both symbols without another setting',()=>{
 assert.equal(symbolMotion('off','high',60,'high').enabled,false);
 assert.equal(symbolMotion('particles_2d','high',60,'high').light,true);
 assert.equal(symbolMotion('veil','light',30,'high').light,true);
 assert.deepEqual(symbolMotion('aurora','high',60,'high'),{light:false,enabled:true,fps:60,detail:'high'});
});
test('balanced quality caps symbol detail and frame budget',()=>{
 const budget=symbolMotion('auto','balanced',60,'high');assert.equal(budget.fps,30);assert.equal(budget.detail,'medium');
 assert.equal(symbolMotion('auto','balanced',30,'low').detail,'low');
});
