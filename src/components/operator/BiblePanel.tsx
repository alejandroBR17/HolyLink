import React, {useEffect, useState} from 'react';
import {Send, ChevronLeft, ChevronRight, RotateCcw, History, Repeat2} from 'lucide-react';
import {BibleSection} from '../BibleSection';
import {getSetting} from '../../utils';
import {paginateProjectionText} from '../../utils/projection-text';
import {TextProjectionPreview} from '../ProjectionText';
import {readPassageHistory, rememberPassage, type Passage} from '../../utils/bible-history';

interface BiblePanelProps {
  activeVerseIndex: number | null;
  customVerseText: string | null;
  customVerseRef: string | null;
  updateStateAndBroadcast: (key: string, value: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  showAlert?: (message: string, type?: 'success' | 'error' | 'info') => void;
}
export const BiblePanel = React.memo(function BiblePanel({activeVerseIndex, customVerseText, customVerseRef, updateStateAndBroadcast}: BiblePanelProps) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [recent, setRecent] = useState(readPassageHistory);
  const [bookmarks, setBookmarks] = useState<Passage[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    getSetting('custom_saved_bible_verses', []).then(value => {
      if (active && Array.isArray(value)) setBookmarks(value.filter(v => typeof v?.text === 'string' && typeof v?.ref === 'string'));
    }).catch(() => {if (active) setMessage('Os favoritos deste aparelho não puderam ser carregados.');});
    return () => {active = false;};
  }, []);
  const pages = paginateProjectionText(passage?.text || '');
  const selected = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const referenceFor = (index: number, source: Passage, total: number) => total > 1 ? `${source.ref} · ${index + 1}/${total}` : source.ref;
  const prepare = (text: string, ref: string) => {setPassage({text, ref}); setPageIndex(0); setMessage('Passagem preparada. A projeção não foi alterada.'); requestAnimationFrame(() => document.getElementById('bible-passage-title')?.scrollIntoView({behavior: 'smooth', block: 'start'}));};
  const project = (source: Passage, index = 0) => {
    const chunks = paginateProjectionText(source.text);
    if (!chunks[index]) return;
    setPassage(source); setPageIndex(index);
    updateStateAndBroadcast('activeVerseIndex', null);
    updateStateAndBroadcast('customVerseRef', referenceFor(index, source, chunks.length));
    updateStateAndBroadcast('customVerseText', chunks[index]);
    const next = rememberPassage(recent, source);
    setRecent(next);
    try {localStorage.setItem('holylink_bible_history_v1', JSON.stringify(next)); setMessage('Enviado. Confira a exibição no telão ou no monitor.');}
    catch {setMessage('Enviado. O histórico não pôde ser salvo neste aparelho. Confira o telão.');}
  };
  const liveIndex = passage ? pages.findIndex((text, index) => text === customVerseText && referenceFor(index, passage, pages.length) === customVerseRef) : -1;
  const restore = () => {updateStateAndBroadcast('activeVerseIndex', null); updateStateAndBroadcast('customVerseText', null); updateStateAndBroadcast('customVerseRef', null); setMessage('Sequência automática retomada.');};
  return <div className="bible-workspace">
    <BibleSection onShowVerse={prepare}/>
    <div className="bible-reading-grid">
      <section className="operator-card bible-passage" aria-labelledby="bible-passage-title">
        <div className="operator-section-heading"><div><span className="operator-eyebrow">Conferir antes de enviar</span><h3 id="bible-passage-title">{passage?.ref || 'Sua próxima passagem'}</h3></div>{passage && <span className="operator-format-tag">{selected + 1} / {pages.length}</span>}</div>
        {passage ? <>

          <p className="bible-readable-text">{pages[selected]}</p>
          {pages.length > 1 && <div className="operator-actions"><button disabled={selected === 0} onClick={() => setPageIndex(selected - 1)} aria-label="Página anterior na prévia"><ChevronLeft size={18}/>Anterior</button><button disabled={selected === pages.length - 1} onClick={() => setPageIndex(selected + 1)} aria-label="Próxima página na prévia">Próxima<ChevronRight size={18}/></button><small>Passagens longas são divididas para leitura no telão.</small></div>}
          <div className="operator-actions"><button className="operator-primary" onClick={() => project(passage, selected)}><Send size={18}/>{liveIndex === selected ? 'Enviar novamente' : 'Projetar esta página'}</button></div>
        </> : <div className="bible-empty"><p>Digite a referência acima ou escolha um livro.</p><small>Sem digitar o texto, sem versículos aleatórios no caminho.</small></div>}
        {passage && <details className="bible-picker bible-preview"><summary>Conferir aparência no telão · 16:9</summary><TextProjectionPreview text={pages[selected]} reference={referenceFor(selected, passage, pages.length)}/></details>}<p className="operator-notice" role="status">{message}</p>
        {(customVerseText || activeVerseIndex !== null) && <div className="bible-current"><span className="operator-eyebrow">Último envio{customVerseRef ? ` · ${customVerseRef}` : ''}</span>{liveIndex >= 0 && pages.length > 1 && <div className="operator-actions"><button disabled={liveIndex === 0} onClick={() => passage && project(passage, liveIndex - 1)}><ChevronLeft size={18}/>Anterior no telão</button><button disabled={liveIndex === pages.length - 1} onClick={() => passage && project(passage, liveIndex + 1)}>Próxima no telão<ChevronRight size={18}/></button></div>}<div className="operator-actions"><button onClick={restore}><RotateCcw size={17}/>Retomar sequência</button></div></div>}
      </section>
      <section className="operator-card bible-recent" aria-labelledby="bible-history-title">
        <span className="operator-eyebrow"><History size={16}/>Repetir uma leitura</span><h3 id="bible-history-title">Últimas passagens enviadas</h3><p className="operator-muted">Só o que você projetou, neste navegador.</p>
        {recent.length ? <ol>{recent.map(item => <li key={item.ref + item.text}><div><strong>{item.ref}</strong><p>{item.text}</p></div><button onClick={() => project(item)} aria-label={`Repetir ${item.ref}`} title={`Repetir ${item.ref}`}><Repeat2 size={18}/></button></li>)}</ol> : <p className="bible-history-empty">O histórico aparece depois do primeiro envio.</p>}
        {bookmarks.length > 0 && <details className="bible-picker"><summary>Favoritos que você salvou ({bookmarks.length})</summary><ul>{bookmarks.map((item, index) => <li key={index}><button onClick={() => prepare(item.text, item.ref)}>{item.ref}</button></li>)}</ul></details>}
      </section>
    </div>
  </div>;
});
