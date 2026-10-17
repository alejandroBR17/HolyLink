import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WindowCommandGate,validWindowCommand,validWindowResult} from '../src/utils/projection-window.ts';
import {isSharedStateUpdate,readSharedStorage} from '../src/utils/shared-state.ts';
const id='e24d7212-adce-4a41-a726-4f93dca2982c',command={id,action:'open' as const,at:100_000};
test('window control validates bounded transient messages and never restores them from backup',()=>{
  assert.equal(validWindowCommand(command),true);assert.equal(isSharedStateUpdate('projectionWindowCommand',command),true);
  assert.equal(validWindowResult({id,status:'blocked',at:100_000}),true);
  for(const bad of [null,'open',{...command,action:'fullscreen'},{...command,id:'anything'},{...command,at:Infinity},{...command,extra:true}])assert.equal(validWindowCommand(bad),false);
  assert.deepEqual(readSharedStorage({projection_projectionWindowCommand:JSON.stringify(command),projection_projectionWindowResult:'bad',projection_projectionMode:'pre'}),{projection_projectionMode:'pre'});
});
test('duplicate delivery and stale commands cannot reopen a window later',()=>{
  const gate=new WindowCommandGate();assert.equal(gate.accept(command,100_000),true);assert.equal(gate.accept(command,100_001),false);
  assert.equal(new WindowCommandGate().accept(command,116_000),false);assert.equal(new WindowCommandGate().accept(command,94000),false);
});
