import React, {useEffect, useRef, useState} from 'react';
import {Search, BookOpen, LoaderCircle, ChevronLeft, ChevronRight, RefreshCw} from 'lucide-react';
import {BIBLE_BOOKS, cachedChapter, readChapter, rememberChapter, type BibleVerse} from '../utils/bible-catalog';
interface BibleSectionProps {onShowVerse: (text: string, ref: string) => void;selectionVersion?:number}
export function BibleSection({onShowVerse,selectionVersion=0}: BibleSectionProps) {
  const [bookId, setBookId] = useState('JHN');
  const book = BIBLE_BOOKS.find(item => item.id === bookId)!;
  const [chapter, setChapter] = useState(3);
  const [loaded,setLoaded]=useState<{book:string;chapter:number;verses:BibleVerse[]}|null>(null);
  const verses=loaded?.book===bookId&&loaded.chapter===chapter?loaded.verses:[];
  const [start, setStart] = useState(0), [end, setEnd] = useState(0);
  const [loading, setLoading] = useState(false), [searching, setSearching] = useState(false);
  const [error, setError] = useState(''), [query, setQuery] = useState('');
  const [lookupError,setLookupError]=useState('');
  const [retry, setRetry] = useState(0), [offlineCopy, setOfflineCopy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const cancelLookup=()=>{request.current?.abort();request.current=null;setSearching(false);setLookupError('');};
  useEffect(()=>{request.current?.abort();request.current=null;setSearching(false);setLookupError('');},[selectionVersion]);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    request.current?.abort();request.current=null;setSearching(false);setLookupError('');
    setLoaded(null); setError(''); setStart(0); setEnd(0);
    const cached = cachedChapter(bookId,chapter);
    if (cached) {setLoaded({book:bookId,chapter,verses:cached});setOfflineCopy(true); setLoading(false); return;}
    setLoading(true); setOfflineCopy(false);
    let timeout: number | undefined;
    const delay = window.setTimeout(async () => {
      timeout = window.setTimeout(() => controller.abort(),10000);
      try {
        const response = await fetch(`https://bible-api.com/data/almeida/${bookId}/${chapter}`,{signal:controller.signal});
        if (!response.ok) throw new Error(response.status === 429 ? 'Muitas consultas seguidas. Aguarde alguns segundos e tente novamente.' : 'Não foi possível carregar o capítulo. Tente novamente.');
        const result = readChapter(await response.json(),bookId,chapter);
        if (controller.signal.aborted || disposed) return;
        setLoaded({book:bookId,chapter,verses:result});rememberChapter(bookId,chapter,result);
      } catch (err) {
        if (!disposed) setError(controller.signal.aborted ? 'A consulta demorou demais. Tente novamente.' : err instanceof TypeError ? 'Sem conexão. Capítulos já consultados ficam salvos neste navegador.' : err instanceof Error ? err.message : 'Não foi possível consultar o capítulo.');
      } finally {window.clearTimeout(timeout); if (!disposed) setLoading(false);}
    },300);
    return () => {disposed = true; window.clearTimeout(delay); window.clearTimeout(timeout); controller.abort();};
  },[bookId,chapter,retry]);
  useEffect(() => () => request.current?.abort(),[]);
  const prepare = (first: number,last: number) => {
    cancelLookup();
    const selected = verses.filter(v => v.verse >= first && v.verse <= last);
    if (selected.length) onShowVerse(selected.map(v => v.text).join('\n'),`${book.name} ${chapter}:${first}${last > first ? '-' + last : ''}`);
  };
  const lookup = async () => {
    if (!query.trim()) return;
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    const reference=query.trim();
    setSearching(true); setLookupError(''); const timeout = window.setTimeout(() => controller.abort(),10000);
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=almeida&single_chapter_book_matching=indifferent`,{signal:controller.signal});
      if (!response.ok) throw new Error();
      const value = await response.json();
      if (typeof value.text !== 'string' || !value.text.trim() || value.text.length > 100000) throw new Error();
      if (!controller.signal.aborted&&request.current===controller){setStart(0);setEnd(0);onShowVerse(value.text.trim(),typeof value.reference === 'string'&&value.reference.trim()&&value.reference.length<=200 ? value.reference.trim() : reference);}
    } catch {if (request.current === controller) setLookupError('Não foi possível consultar esta referência. Confira o texto e tente novamente, ou use o seletor acima.');}
    finally {window.clearTimeout(timeout); if (request.current === controller) setSearching(false);}
  };
  return <div className="bible-search" aria-labelledby="bible-search-title">
    <div className="operator-section-heading"><div><span className="operator-eyebrow"><BookOpen size={16}/>Bíblia · Almeida</span><h3 id="bible-search-title">Escolha a passagem</h3><p>Toque no versículo para preparar. Só vai ao telão quando você projetar.</p></div></div>
    <div className="bible-fast-select">
      <label>Livro<select aria-label="Livro" value={bookId} onChange={e => {cancelLookup();setBookId(e.target.value); setChapter(1);}}>{[BIBLE_BOOKS.slice(0,39),BIBLE_BOOKS.slice(39)].map((items,index) => <optgroup key={index} label={index ? 'Novo Testamento' : 'Antigo Testamento'}>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>)}</select></label>
      <label>Capítulo<select aria-label="Capítulo" value={chapter} onChange={e => {cancelLookup();setChapter(Number(e.target.value));}}>{Array.from({length:book.chapters},(_,i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
    </div>
    <div className="operator-actions bible-chapter-nav"><button aria-label="Capítulo anterior" disabled={chapter === 1} onClick={() => {cancelLookup();setChapter(c => c-1);}}><ChevronLeft size={17}/>Anterior</button><strong>{book.name} {chapter}</strong><button aria-label="Próximo capítulo" disabled={chapter === book.chapters} onClick={() => {cancelLookup();setChapter(c => c+1);}}>Próximo<ChevronRight size={17}/></button></div>
    {loading && <p role="status" className="operator-notice"><LoaderCircle size={16} className="animate-spin"/>Carregando versículos…</p>}
    {!!verses.length && <>
      <div className="bible-verse-grid" role="group" aria-label="Versículos disponíveis">{verses.map(v => <button key={v.verse} aria-label={`Preparar ${book.name} ${chapter}:${v.verse}`} aria-pressed={v.verse >= start && v.verse <= end} onClick={() => {setStart(v.verse); setEnd(v.verse); prepare(v.verse,v.verse);}}>{v.verse}</button>)}</div>
      <div className="bible-range"><label>Do versículo<select aria-label="Do versículo" value={start} onChange={e => {const n=Number(e.target.value); setStart(n); setEnd(n); prepare(n,n);}}><option value={0} disabled>Escolher</option>{verses.map(v => <option key={v.verse}>{v.verse}</option>)}</select></label><label>Até o versículo<select aria-label="Até o versículo" value={end} disabled={!start} onChange={e => {const n=Number(e.target.value); setEnd(n); prepare(start,n);}}><option value={0} disabled>Escolher</option>{verses.filter(v => v.verse >= start).map(v => <option key={v.verse}>{v.verse}</option>)}</select></label></div>
      <div className="operator-actions"><button onClick={() => {const first=verses[0].verse,last=verses[verses.length-1].verse; setStart(first); setEnd(last); prepare(first,last);}}>Preparar capítulo inteiro</button></div>
      <small className="operator-muted">{verses.length} versículos disponíveis{offlineCopy ? ' · cópia salva neste navegador' : ' · capítulo salvo para consultar novamente'}.</small>
    </>}
    {error && <div role="alert" className="operator-notice">{error}<button onClick={() => setRetry(n => n+1)}><RefreshCw size={16}/>Tentar carregar capítulo</button></div>}
    <details className="bible-picker"><summary>Digitar uma referência (opcional)</summary><form className="bible-reference-form" onSubmit={e => {e.preventDefault(); void lookup();}}><label htmlFor="bible-reference">Referência</label><div><input id="bible-reference" value={query} onChange={e => {cancelLookup();setQuery(e.target.value);}} placeholder="Ex.: João 3:16 ou Salmos 23:1-3" maxLength={120}/><button type="submit" className="operator-primary" disabled={searching||!query.trim()}>{searching ? <LoaderCircle size={17} className="animate-spin"/> : <Search size={17}/>}Buscar</button></div>{lookupError&&<p role="alert" className="operator-notice">{lookupError}</p>}</form></details>
  </div>;
}
