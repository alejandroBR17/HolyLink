import React, {useEffect, useRef, useState} from 'react';
import {Search, BookOpen, LoaderCircle} from 'lucide-react';

const OLD_TESTAMENT_BOOKS = [
  "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute",
  "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Ester",
  "Jó", "Salmos", "Provérbios", "Eclesiastes", "Cânticos", "Isaías", "Jeremias", "Lamentações",
  "Ezequiel", "Daniel", "Oséias", "Joel", "Amós", "Obadias", "Jonas", "Miquéias", "Naum",
  "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias"
];

const NEW_TESTAMENT_BOOKS = [
  "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios",
  "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses",
  "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro",
  "1 João", "2 João", "3 João", "Judas", "Apocalipse"
];

const ALL_BIBLE_BOOKS = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];


interface BibleSectionProps {
  onShowVerse: (text: string, ref: string) => void;
}
export function BibleSection({onShowVerse}: BibleSectionProps) {
  const [query, setQuery] = useState('');
  const [book, setBook] = useState('João');
  const [chapter, setChapter] = useState('3');
  const [verse, setVerse] = useState('16');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const cache = useRef(new Map<string, {text: string; ref: string}>());
  useEffect(() => () => {request.current?.abort(); request.current = null;}, []);
  const lookup = async (reference: string) => {
    const term = reference.trim();
    if (!term) {setError('Informe uma referência, como João 3:16.'); return;}
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setError('');
    const key = term.toLocaleLowerCase('pt-BR');
    const cached = cache.current.get(key);
    if (cached) {setLoading(false); onShowVerse(cached.text, cached.ref); return;}
    setLoading(true);
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const normalized = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      let response = await fetch(`https://bible-api.com/${encodeURIComponent(term)}?translation=almeida`, {signal: controller.signal});
      if (response.status === 404 && normalized !== term) response = await fetch(`https://bible-api.com/${encodeURIComponent(normalized)}?translation=almeida`, {signal: controller.signal});
      if (!response.ok) throw new Error(response.status === 404 ? 'Referência não encontrada. Confira o livro, capítulo e versículo.' : 'A Bíblia online não respondeu. Tente novamente.');
      const value = await response.json();
      if (typeof value.text !== 'string' || !value.text.trim() || value.text.length > 100000) throw new Error('Esta referência não tem texto disponível.');
      if (controller.signal.aborted || request.current !== controller) return;
      const passage = {text: value.text.trim(), ref: typeof value.reference === 'string' ? value.reference : term};
      if (cache.current.size >= 20) cache.current.delete(cache.current.keys().next().value!);
      cache.current.set(key, passage);
      onShowVerse(passage.text, passage.ref);
    } catch (err) {
      if (request.current !== controller) return;
      setError(controller.signal.aborted ? 'A busca demorou demais. Tente novamente ou repita uma passagem recente.' : err instanceof TypeError ? 'Sem conexão com a Bíblia online. Tente novamente.' : err instanceof Error ? err.message : 'Sem conexão com a Bíblia online. Tente novamente.');
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) setLoading(false);
    }
  };
  return <section className="operator-card bible-search" aria-labelledby="bible-search-title">
    <div className="operator-section-heading"><div><span className="operator-eyebrow"><BookOpen size={16} />Bíblia · Almeida</span><h3 id="bible-search-title">Qual passagem vamos ler?</h3><p>Busque a referência. O texto vem pronto; você só confere e projeta.</p></div></div>
    <form onSubmit={event => {event.preventDefault(); void lookup(query);}} className="bible-reference-form">
      <label htmlFor="bible-reference">Referência</label>
      <div><input id="bible-reference" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: João 3:16 ou Salmos 23:1-3" autoComplete="off" maxLength={120} /><button className="operator-primary" type="submit" aria-label="Buscar passagem">{loading ? <LoaderCircle className="animate-spin" size={18}/> : <Search size={18}/>}Buscar</button></div>
    </form>
    <details className="bible-picker"><summary>Prefiro escolher livro, capítulo e versículo</summary>
      <form onSubmit={event => {event.preventDefault(); const ref = `${book} ${chapter}${verse.trim() ? ':' + verse.trim() : ''}`; setQuery(ref); void lookup(ref);}}>
        <label htmlFor="bible-book">Livro<select id="bible-book" aria-label="Livro" value={book} onChange={event => setBook(event.target.value)}>{ALL_BIBLE_BOOKS.map(name => <option key={name}>{name}</option>)}</select></label>
        <label htmlFor="bible-chapter">Capítulo<input id="bible-chapter" type="number" min="1" max="150" required value={chapter} onChange={event => setChapter(event.target.value)} /></label>
        <label htmlFor="bible-verse">Versículo ou intervalo<input id="bible-verse" value={verse} pattern="[0-9]+(-[0-9]+)?" placeholder="Todos ou 1-3" onChange={event => setVerse(event.target.value)} inputMode="text" maxLength={12}/></label>
        <button type="submit"><Search size={17}/>Buscar seleção</button>
      </form><p className="operator-muted">Deixe o versículo vazio para buscar o capítulo inteiro.</p>
    </details>
    <p role="status" className="operator-notice">{loading ? 'Buscando passagem… A projeção continua como está.' : error}</p>
  </section>;
}
