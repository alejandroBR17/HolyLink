import test from 'node:test';
import assert from 'node:assert/strict';
import {validPlaybackStatus} from '../src/utils/playback-status.ts';
test('playback reports accept only bounded known states and sources',()=>{
 const valid={id:'custom_local',name:'Vídeo',kind:'video',state:'audio-blocked',preview:false,time:1};assert.equal(validPlaybackStatus(valid),true);
 for(const patch of [{id:'x'.repeat(201)},{name:'x'.repeat(501)},{kind:'script'},{state:'approved'},{preview:'false'},{time:NaN},{time:-1},{time:1.5}])assert.equal(validPlaybackStatus({...valid,...patch}),false);
 for(const input of [null,undefined,{},[]])assert.equal(validPlaybackStatus(input),false);
});
