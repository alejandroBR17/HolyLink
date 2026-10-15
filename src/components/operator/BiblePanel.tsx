import React, {useEffect, useMemo, useState} from 'react';
import {Send, ChevronLeft, ChevronRight, RotateCcw, Repeat2} from 'lucide-react';
import {BibleSection} from '../BibleSection';
import {getSetting} from '../../utils';
import {paginateProjectionText} from '../../utils/projection-text';
import type {BackgroundStyleOption} from '../ThreeBackground3D';
import {TextProjectionPreview} from '../ProjectionText';
import {readPassageHistory, rememberPassage, type Passage} from '../../utils/bible-history';
function readDraft():{passage:Passage|null;page:number}{
  try{
    const value=JSON.parse(localStorage.getItem('holylink_bible_draft_v1')||'null');
    if(value&&typeof value.passage?.text==='string'&&value.passage.text.trim()&&value.passage.text.length<=100000&&typeof value.passage.ref==='string'&&value.passage.ref.length<=200){
      return{passage:{text:value.passage.text,ref:value.passage.ref},page:Number.isInteger(value.page)&&value.page>=0?value.page:0};
    }
  }catch{/* Invalid drafts must not prevent opening the Bible. */}
  return{passage:null,page:0};
}
const referenceFor = (index: number, source: Passage, total: number) => total > 1 ? `${source.ref} · ${index + 1}/${total}` : source.ref;
interface BiblePanelProps {
  backgroundStyle?: BackgroundStyleOption;
  isFJU?: boolean;
  activeVerseIndex: number | null;
  customVerseText: string | null;
  customVerseRef: string | null;
  updateStateAndBroadcast: (key: string, value: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  showAlert?: (message: string, type?: 'success' | 'error' | 'info') => void;
}
export const BiblePanel = React.memo(function BiblePanel({isFJU, backgroundStyle, activeVerseIndex, customVerseText, customVerseRef, updateStateAndBroadcast}: BiblePanelProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draft]=useState(readDraft);
  const [passage, setPassage] = useState<Passage | null>(draft.passage);
  const [pageIndex, setPageIndex] = useState(draft.page);
  const [lastSent,setLastSent]=useState<Passage|null>(null);
  const [selectionVersion,setSelectionVersion]=useState(0);
  const [recent, setRecent] = useState(readPassageHistory);
  const [bookmarks, setBookmarks] = useState<Passage[]>([]);
  const [message, setMessage] = useState('');
  useEffect(()=>{try{if(passage)localStorage.setItem('holylink_bible_draft_v1',JSON.stringify({passage,page:pageIndex}));}catch{/* Preparing and projecting remain available without draft storage. */}},[passage,pageIndex]);
  useEffect(() => {
    let active = true;
    getSetting('custom_saved_bible_verses', []).then(value => {
      if (active && Array.isArray(value)) setBookmarks(value.filter(v => typeof v?.text === 'string' && typeof v?.ref === 'string'));
    }).catch(() => {if (active) setMessage('Os favoritos deste aparelho não puderam ser carregados.');});
    return () => {active = false;};
  }, []);
  const pages = useMemo(()=>paginateProjectionText(passage?.text || ''),[passage]);
  const selected = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const prepare = (text: string, ref: string) => {setSelectionVersion(value=>value+1);setPassage({text, ref}); setPageIndex(0); setMessage('Passagem preparada. A projeção não foi alterada.');};
  const project = (source: Passage, index = 0, updatePreview=true) => {
    const chunks = paginateProjectionText(source.text);
    if (!chunks[index]) return;
    setSelectionVersion(value=>value+1);
    if(updatePreview){setPassage(source);setPageIndex(index);}setLastSent(source);
    updateStateAndBroadcast('activeVerseIndex', null);
    updateStateAndBroadcast('customVerseRef', referenceFor(index, source, chunks.length));
    updateStateAndBroadcast('customVerseText', chunks[index]);
    const next = rememberPassage(recent, source);
    setRecent(next);
    try {localStorage.setItem('holylink_bible_history_v1', JSON.stringify(next)); setMessage('Enviado. Confira a exibição no telão ou no monitor.');}
    catch {setMessage('Enviado. O histórico não pôde ser salvo neste aparelho. Confira o telão.');}
  };
  const liveIndex = passage ? pages.findIndex((text, index) => text === customVerseText && referenceFor(index, passage, pages.length) === customVerseRef) : -1;
  const liveSelection=useMemo(()=>{
    if(customVerseText)for(const source of [lastSent,...recent]){
      if(!source)continue;
      const chunks=paginateProjectionText(source.text);
      const index=chunks.findIndex((text,index)=>text===customVerseText&&referenceFor(index,source,chunks.length)===customVerseRef);
      if(index>=0)return{source,pages:chunks,index};
    }
    return null;
  },[lastSent,recent,customVerseText,customVerseRef]);
  const livePassage=liveSelection?.source,livePages=liveSelection?.pages||[],livePage=liveSelection?.index??-1;
  const restore = () => {updateStateAndBroadcast('activeVerseIndex', null); updateStateAndBroadcast('customVerseText', null); updateStateAndBroadcast('customVerseRef', null);updateStateAndBroadcast('manualSlideOverride',null); setMessage('Sequência automática retomada.');};
  return <section className="operator-card bible-workspace bible-unified" aria-labelledby="bible-search-title">
    <BibleSection onShowVerse={prepare} selectionVersion={selectionVersion}/>
    <div className="bible-reading-flow">
      <div className="bible-passage">
        {passage && <div className="operator-section-heading"><div><span className="operator-eyebrow">Passagem preparada</span><h3 id="bible-passage-title">{passage.ref}</h3></div>{pages.length > 1 && <span className="operator-format-tag">Página {selected + 1} de {pages.length}</span>}</div>}
        {passage ? <>
          <p className="bible-readable-text">{pages[selected]}</p>
          {pages.length > 1 && <div className="operator-actions"><button disabled={selected === 0} onClick={() => setPageIndex(selected - 1)} aria-label="Página anterior na prévia"><ChevronLeft size={18}/>Anterior</button><button disabled={selected === pages.length - 1} onClick={() => setPageIndex(selected + 1)} aria-label="Próxima página na prévia">Próxima<ChevronRight size={18}/></button><small>Passagens longas são divididas para leitura no telão.</small></div>}
          <div className="operator-actions"><button className="operator-primary" onClick={() => project(passage, selected)}><Send size={18}/>{liveIndex === selected ? 'Enviar novamente' : 'Projetar esta página'}</button></div>
        </> : null}
        {passage && <details className="bible-picker bible-preview" onToggle={event => setPreviewOpen(event.currentTarget.open)}><summary>Conferir aparência no telão · 16:9</summary>{previewOpen && <TextProjectionPreview isFJU={isFJU} backgroundStyle={backgroundStyle} text={pages[selected]} reference={referenceFor(selected, passage, pages.length)}/>}</details>}<p className="operator-notice" role="status">{message}</p>
        {(customVerseText || activeVerseIndex !== null) && <div className="bible-current"><span className="operator-eyebrow">Último envio{customVerseRef ? ` · ${customVerseRef}` : ''}</span>{livePage >= 0 && livePages.length > 1 && <div className="operator-actions"><button disabled={livePage === 0} onClick={() => livePassage && project(livePassage, livePage - 1,false)}><ChevronLeft size={18}/>Anterior no telão</button><button disabled={livePage === livePages.length - 1} onClick={() => livePassage && project(livePassage, livePage + 1,false)}>Próxima no telão<ChevronRight size={18}/></button></div>}<div className="operator-actions"><button onClick={restore}><RotateCcw size={17}/>Retomar sequência</button></div></div>}
      </div>
      <details className="bible-picker bible-recent">
        <summary>Repetir uma passagem ({recent.length})</summary>
        {recent.length ? <ol>{recent.map(item => <li key={item.ref + item.text}><div><strong>{item.ref}</strong><p>{item.text}</p></div><button onClick={() => project(item)} aria-label={`Repetir ${item.ref}`} title={`Repetir ${item.ref}`}><Repeat2 size={18}/></button></li>)}</ol> : <p className="bible-history-empty">O histórico aparece depois do primeiro envio.</p>}
      </details>
        {bookmarks.length > 0 && <details className="bible-picker"><summary>Favoritos que você salvou ({bookmarks.length})</summary><ul>{bookmarks.map((item, index) => <li key={index}><button onClick={() => prepare(item.text, item.ref)}>{item.ref}</button></li>)}</ul></details>}
    </div>
  </section>;
});
