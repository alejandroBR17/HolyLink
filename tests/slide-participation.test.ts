import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleSlideDisabled } from '../src/utils/slide-participation.ts';

test('participation can be toggled and reversed without changing the shared snapshot', () => {
  const original = Object.freeze(['phone', 'bathroom']);
  const hidden = toggleSlideDisabled(original, 'seat');
  assert.deepEqual(hidden, ['phone', 'bathroom', 'seat']);
  assert.deepEqual(toggleSlideDisabled(hidden, 'seat'), original);
  assert.deepEqual(original, ['phone', 'bathroom']);
  assert.deepEqual(toggleSlideDisabled([], 'custom_video'), ['custom_video']);
});

test('enabling a slide removes all legacy duplicate flags and preserves unrelated order', () => {
  const original = Object.freeze(['phone', 'seat', 'bathroom', 'seat']);
  assert.deepEqual(toggleSlideDisabled(original, 'seat'), ['phone', 'bathroom']);
  assert.equal(original.length, 4);
});
