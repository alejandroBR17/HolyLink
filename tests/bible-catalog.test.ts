import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BIBLE_BOOKS,readChapter,cachedChapter,rememberChapter} from '../src/utils/bible-catalog.ts';
test('canonical chapters cover the 66 books, including single chapter books',() => {
  assert.equal(BIBLE_BOOKS.length,66);
  assert.equal(new Set(BIBLE_BOOKS.map(b => b.id)).size,66);
  assert.equal(BIBLE_BOOKS.reduce((n,b) => n+b.chapters,0),1189);
  assert.equal(BIBLE_BOOKS.find(b => b.id === 'PSA')?.chapters,150);
  assert.equal(BIBLE_BOOKS.find(b => b.id === 'JUD')?.chapters,1);
});
test('chapter response must match selected book and chapter and ordered verses',() => {
  const verse={book_id:'JHN',chapter:3,verse:16,text:'  Exemplo  '};
  assert.deepEqual(readChapter({verses:[verse]},'JHN',3),[{verse:16,text:'Exemplo'}]);
  for (const data of [{verses:[null]},{verses:[{...verse,book_id:'JUD'}]},{verses:[{...verse,chapter:4}]},{verses:[verse,verse]},{verses:[{...verse,text:''}]},{verses:[]}]) assert.throws(() => readChapter(data,'JHN',3));
});
test('persistent chapter cache is bounded and invalid entries fail safely',() => {
  const storage = new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)}});
  for (let i=1;i<=30;i++) rememberChapter('GEN',i,[{verse:1,text:`Capítulo ${i}`}]);
  assert.equal(Object.keys(JSON.parse(storage.get('holylink_bible_chapters_v1')!)).length,24);
  assert.equal(cachedChapter('GEN',1),null);
  assert.deepEqual(cachedChapter('GEN',30),[{verse:1,text:'Capítulo 30'}]);
  storage.set('holylink_bible_chapters_v1','invalid');
  assert.equal(cachedChapter('GEN',30),null);
  rememberChapter('JUD',1,[{verse:1,text:'Texto'}]);
  assert.deepEqual(cachedChapter('JUD',1),[{verse:1,text:'Texto'}]);
  delete (globalThis as {localStorage?:unknown}).localStorage;
});
