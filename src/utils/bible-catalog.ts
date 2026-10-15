// Canonical chapter counts; verse options come from the selected Almeida chapter.
const names = 'Gênesis|Êxodo|Levítico|Números|Deuteronômio|Josué|Juízes|Rute|1 Samuel|2 Samuel|1 Reis|2 Reis|1 Crônicas|2 Crônicas|Esdras|Neemias|Ester|Jó|Salmos|Provérbios|Eclesiastes|Cânticos|Isaías|Jeremias|Lamentações|Ezequiel|Daniel|Oséias|Joel|Amós|Obadias|Jonas|Miquéias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|João|Atos|Romanos|1 Coríntios|2 Coríntios|Gálatas|Efésios|Filipenses|Colossenses|1 Tessalonicenses|2 Tessalonicenses|1 Timóteo|2 Timóteo|Tito|Filemom|Hebreus|Tiago|1 Pedro|2 Pedro|1 João|2 João|3 João|Judas|Apocalipse'.split('|');
const ids = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');
const chapters = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
export const BIBLE_BOOKS = ids.map((id,index) => ({id, name:names[index], chapters:chapters[index]}));
export interface BibleVerse {verse: number; text: string}
export function readChapter(value: unknown, book: string, chapter: number): BibleVerse[] {
  const verses = (value as {verses?: unknown})?.verses;
  if (!Array.isArray(verses) || !verses.length || verses.length > 200) throw new Error('Capítulo indisponível.');
  let previous = 0;
  return verses.map(item => {
    if (!item || item.book_id !== book || item.chapter !== chapter || !Number.isInteger(item.verse) || item.verse <= previous || item.verse > 200 || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 10000) throw new Error('Resposta bíblica inválida.');
    previous = item.verse;
    return {verse:item.verse, text:item.text.trim()};
  });
}
const CACHE_KEY = 'holylink_bible_chapters_v1';
export function cachedChapter(book: string, chapter: number): BibleVerse[] | null {
  try {const value = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')[`${book}:${chapter}`]; return value ? readChapter(value,book,chapter) : null;} catch {return null;}
}
export function rememberChapter(book: string, chapter: number, verses: BibleVerse[]) {
  try {
    let cache: Record<string, unknown>;
    try {cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); if (!cache || typeof cache !== 'object' || Array.isArray(cache)) cache = {};} catch {cache = {};}
    const key = `${book}:${chapter}`;
    delete cache[key]; cache[key] = {verses:verses.map(v => ({...v,book_id:book,chapter}))};
    while (Object.keys(cache).length > 24) delete cache[Object.keys(cache)[0]];
    localStorage.setItem(CACHE_KEY,JSON.stringify(cache));
  } catch { /* Storage failure must not prevent preparing a fetched passage. */ }
}
