import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
function walk(dir:string):string[] {return readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(join(dir,item.name)):[join(dir,item.name)]);}
const files=[...walk('src/components'), 'src/App.tsx',...walk('src/styles')].filter(file=>/\.(tsx|css)$/.test(file));
const roles=new Set(['canvas','panel','raised','line','line-soft','line-strong','gold','gold-bright','gold-strong','gold-muted','gold-well','copy','soft','muted','dim','ink']);
test('every shared color utility refers to a declared design role',()=>{
 const css=readFileSync('src/styles/design-system.css','utf8');
 for(const file of files) for(const match of readFileSync(file,'utf8').matchAll(/(?:bg|text|border|from|via|to|ring|divide|accent|outline|decoration)-hl-([a-z0-9-]+)/g)) {
  assert.ok(roles.has(match[1]), `${file}: unknown role ${match[1]}`);
  assert.ok(css.includes('--color-hl-'+match[1]+':'),`${file}: role missing declaration`);
 }
});
test('old neutral and brand utility palettes are absent from rendered components',()=>{
 for(const file of files.filter(file=>file.endsWith('.tsx'))) {
  const source=readFileSync(file,'utf8');
  assert.equal(/\b(?:bg|text|border|from|via|to|ring|accent)-(?:zinc|stone|gray|neutral|slate|amber|yellow)-[0-9]{2,3}\b/.test(source),false,`${file}: legacy palette`);
 }
});

test('installed app chrome uses the same canvas and keeps its existing identity',()=>{
 const manifest=JSON.parse(readFileSync('public/manifest.json','utf8'));
 assert.equal(manifest.background_color,'#030305');
 assert.equal(manifest.theme_color,'#030305');
 assert.equal(manifest.id,'./');
 assert.equal(manifest.start_url,'./');
 assert.ok(readFileSync('index.html','utf8').includes('name="theme-color" content="#030305"'));
 assert.ok(readFileSync('public/pwa-bootstrap.js','utf8').includes('setAttribute("content", "#030305")'));
});
