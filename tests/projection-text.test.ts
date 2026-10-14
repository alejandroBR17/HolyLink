import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paginateProjectionText, projectionFontSize} from '../src/utils/projection-text.ts';

test('empty drafts, repeated whitespace and long passages paginate without losing words', () => {
  assert.deepEqual(paginateProjectionText(' \n '), []);
  assert.deepEqual(paginateProjectionText('Olá  igreja\nSejam bem-vindos'), ['Olá igreja Sejam bem-vindos']);
  const text = 'Uma mensagem de acolhimento para a igreja. '.repeat(40).trim();
  const pages = paginateProjectionText(text);
  assert.ok(pages.length > 1);
  assert.equal(pages.join(' '), text);
  assert.ok(pages.every(page => page.length <= 320));
  assert.ok(pages.every(page => page.endsWith('.')));
});
test('long uninterrupted Unicode tokens fit pages without broken surrogate pairs', () => {
  const text = '😀'.repeat(800);
  const pages = paginateProjectionText(text);
  assert.equal(pages.join(''), text);
  assert.ok(pages.every(page => Array.from(page).length <= 320));
  assert.throws(() => paginateProjectionText('texto', 0), RangeError);
});
test('projection typography is bounded and responds to passage length', () => {
  assert.ok(projectionFontSize('Curto') > projectionFontSize('Texto '.repeat(70)));
  for (const size of [0,1,100,320,1000,100000]) assert.ok(projectionFontSize('x'.repeat(size)) >= 30 && projectionFontSize('x'.repeat(size)) <= 88);
});
