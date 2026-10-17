import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FJU_MOMENTS,readFjuMoments,availablePreparedMoment,isFjuMomentSelection,connectFjuMoments,preparedMomentSlides} from '../src/utils/fju-moments.ts';
import {moveQueueBlock} from '../src/utils/queue-blocks.ts';
import {FJU_CARDS,FJU_PRE_SLIDES,FJU_POST_SLIDES} from '../src/utils/fju-content.ts';
import {availableInChurchLoop,availableInYouthLoop} from '../src/utils/projection-theme.ts';
import {isSharedStateUpdate,readSharedStorage} from '../src/utils/shared-state.ts';

test('selected announcements join only the pre-encounter queue and stay out of church',()=>{
  for(const {id,title} of FJU_MOMENTS){
    assert.equal(FJU_CARDS[id].title,title);
    assert.equal(FJU_PRE_SLIDES.includes(id),false);
    assert.equal(FJU_POST_SLIDES.includes(id),false);
    assert.equal(availableInChurchLoop(id,[]),false);
    assert.equal(availableInYouthLoop(id,[]),true);
    assert.equal(availablePreparedMoment(id,[]),false);
    assert.equal(availablePreparedMoment(id,[id]),true);
    assert.equal(availablePreparedMoment(id,readFjuMoments('[]')),false);
  }
  assert.equal(availablePreparedMoment('seat',[]),true);
  assert.equal(availablePreparedMoment('custom_local_video',[]),true);
  const ids=FJU_MOMENTS.map(moment=>moment.id);
  assert.deepEqual(preparedMomentSlides(ids,'pre'),ids);
  assert.deepEqual(preparedMomentSlides(ids,'post'),[]);
  assert.deepEqual(preparedMomentSlides([],'pre'),[]);
  assert.deepEqual(connectFjuMoments(['seat',ids[2],'verse_1',ids[0],'custom_local']),['seat',ids[0],ids[2],'verse_1','custom_local']);
  assert.deepEqual(moveQueueBlock(['seat',ids[0],ids[2],'verse_1'],ids[2],1,[ids]),['seat','verse_1',ids[0],ids[2]]);
});

test('preparation survives shared backup and malformed remote choices are rejected',()=>{
  const ids=[FJU_MOMENTS[3].id,FJU_MOMENTS[0].id];
  assert.deepEqual(readFjuMoments(JSON.stringify(ids)),[FJU_MOMENTS[0].id,FJU_MOMENTS[3].id]);
  assert.equal(isSharedStateUpdate('fjuMoments',ids),true);
  const backup={projection_fjuMoments:JSON.stringify(ids)};
  assert.deepEqual(readSharedStorage(backup),backup);
  assert.deepEqual(readFjuMoments(readSharedStorage(backup).projection_fjuMoments),readFjuMoments(ids));
  for(const bad of [null,{},'broken','["unrecognized"]',[ids[0],ids[0]],[1],['baptism'],[...FJU_MOMENTS.map(m=>m.id),'extra']]){
    assert.equal(isSharedStateUpdate('fjuMoments',bad),false);
    assert.deepEqual(readFjuMoments(bad),[]);
  }
  assert.equal(isFjuMomentSelection([]),true);
  assert.equal(isSharedStateUpdate('fjuMoments','[]'),true);
  assert.throws(()=>readSharedStorage({projection_fjuMoments:'["baptism"]'}));
});
