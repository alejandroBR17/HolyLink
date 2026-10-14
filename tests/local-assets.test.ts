import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const file = (name: string) => new URL('../public/' + name, import.meta.url);
test('all selectable icons are real local PNGs with declared dimensions', () => {
  for (const type of ['symbol','text','full']) for (const theme of ['dark','light','transparent']) for (const size of [192,512]) {
    const bytes = readFileSync(file(`pwa/local-${type}-${theme}-${size}.png`));
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),size); assert.equal(bytes.readUInt32BE(20),size);
    assert.ok(bytes.length < 700000);
  }
});
test('main artwork is local WebP, originals are valid PNG and gallery paths exist', () => {
  for (const type of ['symbol','text','full']) {
    const webp=readFileSync(file(`brand/hl-${type}-20261014.webp`));
    assert.equal(webp.subarray(0,4).toString(),'RIFF'); assert.equal(webp.subarray(8,12).toString(),'WEBP');
    assert.ok(webp.length < 100000);
    assert.equal(readFileSync(file(`brand/originals/${type}.png`)).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  }
  const gallery=JSON.parse(readFileSync(file('galeria-imagens.json'),'utf8'));
  assert.equal(gallery.groups.length,22);
  assert.equal(new Set(gallery.groups.map((g: any)=>g.number)).size,22);
  for(const group of gallery.groups) for(const path of group.files) assert.ok(existsSync(file(path.slice(1))));
});
