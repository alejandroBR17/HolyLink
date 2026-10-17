import test from 'node:test';
import assert from 'node:assert/strict';
import { buildActiveQueue } from '../src/utils/active-queue.ts';
import { FJU_PROJECT_SLIDES } from '../src/utils/fju-content.ts';
import { FJU_MOMENTS } from '../src/utils/fju-moments.ts';

test('queue preserves saved relative order, appends new items and never includes missing or disabled media', () => {
  const available = Object.freeze(['seat', 'phone', 'custom_on', 'custom_off', 'custom_missing', 'social']);
  const order = Object.freeze(['removed_event', 'custom_off', 'social', 'phone', 'seat']);
  const options = {available, order, disabled:Object.freeze(['phone']), youth:false,
    media:Object.freeze([{id:'custom_on',enabledInLoop:true},{id:'custom_off',enabledInLoop:false}])};
  assert.deepEqual(buildActiveQueue(options), ['social', 'seat', 'custom_on']);
  assert.equal(order[0], 'removed_event');
  assert.equal(available.length, 6);
  assert.deepEqual(buildActiveQueue({...options, available:[]}), []);
});

test('prepared youth blocks stay connected and cannot be split by legacy hidden flags', () => {
  const moments = FJU_MOMENTS.slice(0, 2).map(item => item.id);
  const available = ['seat', ...FJU_PROJECT_SLIDES, ...moments, 'custom_clip'];
  const order = ['seat', 'fju_project_media', moments[1], 'custom_clip',
    'fju_projects', moments[0], 'fju_project_sports', 'fju_project_culture'];
  const result = buildActiveQueue({available,order,disabled:[...FJU_PROJECT_SLIDES,...moments],
    media:[{id:'custom_clip',enabledInLoop:true}],youth:true});
  assert.deepEqual(result, ['seat', ...FJU_PROJECT_SLIDES, ...moments, 'custom_clip']);
  assert.deepEqual(buildActiveQueue({available:['seat'],order,disabled:[],media:[],youth:true}), ['seat']);
});
