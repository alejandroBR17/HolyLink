import React, {useEffect, useState} from 'react';
import {BookOpen, Send, Save, Trash2, ChevronLeft, ChevronRight, Eye, RotateCcw} from 'lucide-react';
import {BibleSection} from '../BibleSection';
import {VERSES} from '../../data';
import {getSetting, saveSetting} from '../../utils';
import {paginateProjectionText} from '../../utils/projection-text';
import {TextProjectionPreview} from '../ProjectionText';

interface NoticePreset {title: string; text: string; ref: string}
interface BiblePanelProps {
  activeVerseIndex: number | null;
  customVerseText: string | null;
  customVerseRef: string | null;
  updateStateAndBroadcast: (key: string, value: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  showAlert?: (message: string, type?: 'success' | 'error' | 'info') => void;
}
const DEFAULT_CHURCH_NOTICES: NoticePreset[] = [
  {title: 'Boas-vindas', text: 'Sejam todos muito bem-vindos à Casa do Senhor! Alegrei-me quando me disseram: Vamos à casa do Senhor.', ref: 'Salmos 122:1'},
  {title: 'Silenciar celular', text: 'Por gentileza, pedimos a todos que silenciem seus aparelhos celulares para o momento de oração e reflexão.', ref: 'Aviso de Culto'},
  {title: 'Santa Ceia', text: 'Domingo Especial da Santa Ceia do Senhor. Venha participar com toda a sua família e renovar suas alianças.', ref: '1 Coríntios 11:26'},
  {title: 'Dízimos & Ofertas', text: 'Trazei todos os dízimos à casa do tesouro, para que haja mantimento na minha casa, e depois fazei prova de mim.', ref: 'Malaquias 3:10'},
  {title: 'Escola da Fé', text: 'Quarta-feira às 19h30 — Noite da Salvação e Busca do Espírito Santo. Fortaleça sua fé!', ref: 'Reunião Semanal'},
  {title: 'Espaço infantil EBI', text: 'Atenção Pais: Acompanhem seus filhos até o espaço da Escola Bíblica Infantil (EBI) para as atividades da fé.', ref: 'Orientação aos Pais'}
];
const DRAFT_KEY = 'holylink_text_draft_v1';
function readDraft(): {text: string; ref: string} {
  try {const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); return {text: typeof value.text === 'string' ? value.text : '', ref: typeof value.ref === 'string' ? value.ref : ''};}
  catch {return {text: '', ref: ''};}
}
export const BiblePanel = React.memo(function BiblePanel({activeVerseIndex, customVerseText, customVerseRef, updateStateAndBroadcast, showToast, showAlert}: BiblePanelProps) {
  const [draft, setDraft] = useState(readDraft);
  const [pageIndex, setPageIndex] = useState(0);
  const [savedNotices, setSavedNotices] = useState<NoticePreset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const notify = showToast || showAlert;
  const pages = paginateProjectionText(draft.text);
  const selected = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const referenceFor = (index: number) => pages.length > 1 ? `${draft.ref.trim() || 'Aviso'} · ${index + 1}/${pages.length}` : pages.length ? draft.ref.trim() || 'Mensagem' : draft.ref.trim();
  const liveIndex = pages.findIndex((text, index) => text === customVerseText && referenceFor(index) === (customVerseRef || ''));
  const edit = (value: {text: string; ref: string}) => {
    setDraft(value); setPageIndex(0); setMessage('');
    try {localStorage.setItem(DRAFT_KEY, JSON.stringify(value));}
    catch {setMessage('O rascunho está disponível nesta tela, mas não pôde ser salvo neste aparelho.');}
  };
  const prepare = (value: {text: string; ref: string}) => {edit(value); document.getElementById('prepare-text-title')?.scrollIntoView({behavior: 'smooth', block: 'start'});};
  useEffect(() => {
    let active = true;
    getSetting('projection_saved_notices', []).then(value => {if (active) {setSavedNotices(Array.isArray(value) ? value.filter(n => typeof n?.text === 'string' && typeof n?.ref === 'string' && typeof n?.title === 'string') : []); setLoaded(true);}}).catch(() => {if (active) setMessage('Não foi possível carregar os avisos salvos.');});
    return () => {active = false;};
  }, []);
  const project = (index: number) => {
    if (!pages[index]) return;
    updateStateAndBroadcast('activeVerseIndex', null);
    updateStateAndBroadcast('customVerseRef', referenceFor(index) || null);
    updateStateAndBroadcast('customVerseText', pages[index]);
    setPageIndex(index);
    setMessage('Texto enviado. Confira a saída no monitor; o recebimento remoto ainda não é confirmado.');
  };
  const restore = () => {updateStateAndBroadcast('activeVerseIndex', null); updateStateAndBroadcast('customVerseText', null); updateStateAndBroadcast('customVerseRef', null);};
  const persist = async (next: NoticePreset[]) => {
    if (!loaded || saving) return;
    setSaving(true);
    try {await saveSetting('projection_saved_notices', next); const stored = await getSetting('projection_saved_notices', null); if (JSON.stringify(stored) !== JSON.stringify(next)) throw new Error('Storage unavailable'); setSavedNotices(next); notify?.('Avisos salvos neste aparelho.', 'success');}
    catch {setMessage('Não foi possível salvar os avisos. Tente novamente.');}
    finally {setSaving(false);}
  };
  const save = () => {
    const text = draft.text.trim(); if (!text) return;
    void persist([{title: text.length > 25 ? text.slice(0,25) + '…' : text, text, ref: draft.ref.trim()}, ...savedNotices.filter(n => n.text !== text)]);
  };
  const liveVerse = activeVerseIndex !== null ? VERSES[activeVerseIndex] : null;
  return <div className="bible-workspace">
    <section className="operator-card text-composer" aria-labelledby="prepare-text-title">
      <div className="operator-section-heading"><div><span className="operator-eyebrow"><Eye size={15} aria-hidden="true" />Preparação · fora da projeção</span><h3 id="prepare-text-title">Prepare, confira, projete.</h3><p>Editar e escolher uma página não altera o telão.</p></div><span className="operator-format-tag">16:9 · HDMI</span></div>
      <label htmlFor="operator-custom-verse-textarea">Texto do aviso ou versículo</label>
      <textarea id="operator-custom-verse-textarea" value={draft.text} onChange={event => edit({...draft, text: event.target.value})} rows={5} placeholder="Escreva aqui ou escolha um aviso e versículo abaixo." />
      <label htmlFor="operator-custom-verse-ref">Referência ou título</label>
      <input id="operator-custom-verse-ref" value={draft.ref} maxLength={120} onChange={event => edit({...draft, ref: event.target.value})} placeholder="Ex.: João 3:16 ou Aviso da igreja" />
      <div className="draft-page-heading"><span>Prévia da próxima tela</span><span>{pages.length ? `Página ${selected + 1} de ${pages.length}` : 'Nenhum texto preparado'}</span></div>
      <TextProjectionPreview text={pages[selected] || ''} reference={referenceFor(selected)} />
      {pages.length > 1 && <div className="operator-actions"><button type="button" disabled={selected === 0} onClick={() => setPageIndex(selected - 1)} aria-label="Página anterior na prévia"><ChevronLeft size={18} />Anterior</button><button type="button" disabled={selected >= pages.length - 1} onClick={() => setPageIndex(selected + 1)} aria-label="Próxima página na prévia">Próxima<ChevronRight size={18} /></button><small>O texto foi dividido para facilitar a leitura à distância.</small></div>}
      <div className="operator-actions"><button type="button" className="operator-primary" disabled={!pages.length} onClick={() => project(selected)}><Send size={18} />Enviar esta página ao telão</button><button type="button" disabled={!pages.length || !loaded || saving} onClick={save}><Save size={18} />Salvar aviso</button><button type="button" onClick={() => edit({text: '', ref: ''})}>Limpar rascunho</button></div>
      <p role="status" className="operator-notice">{message}</p>
    </section>
    <section className="operator-card" aria-labelledby="output-text-title">
      <div className="operator-section-heading"><div><span className="operator-eyebrow"><BookOpen size={15} aria-hidden="true" />Saída do operador</span><h3 id="output-text-title">Texto enviado à projeção</h3><p>Confira o telão ou o monitor para verificar a exibição.</p></div></div>
      {customVerseText || liveVerse ? <div className="operator-output-text"><p>{customVerseText || liveVerse?.text}</p><small>{customVerseRef || liveVerse?.ref}</small></div> : <p className="operator-muted">Nenhum texto manual: a sequência automática continua.</p>}
      {liveIndex >= 0 && pages.length > 1 && <div className="operator-actions" aria-label="Páginas enviadas"><button type="button" disabled={liveIndex === 0} onClick={() => project(liveIndex - 1)}><ChevronLeft size={18} />Anterior no telão</button><span>Página {liveIndex + 1} de {pages.length}</span><button type="button" disabled={liveIndex === pages.length - 1} onClick={() => project(liveIndex + 1)}>Próxima no telão<ChevronRight size={18} /></button></div>}
      <div className="operator-actions"><button type="button" disabled={!customVerseText && activeVerseIndex === null} onClick={restore}><RotateCcw size={18} />Retomar sequência automática</button></div>
    </section>
    <section className="operator-card" aria-labelledby="notice-library-title"><h3 id="notice-library-title">Avisos prontos para preparar</h3><p className="operator-muted">Escolha um aviso para conferir e editar antes de enviar.</p><div className="notice-library">{DEFAULT_CHURCH_NOTICES.map(notice => <button type="button" key={notice.title} onClick={() => prepare({text: notice.text, ref: notice.ref})}><span>{notice.title}</span><small>{notice.ref}</small></button>)}</div>
      {savedNotices.length > 0 && <><h4>Seus avisos salvos</h4><div className="notice-library">{savedNotices.map((notice, index) => <div className="saved-notice" key={index}><button type="button" onClick={() => prepare({text: notice.text, ref: notice.ref})}>{notice.title}</button><button type="button" disabled={saving} aria-label={`Excluir aviso ${notice.title}`} onClick={() => void persist(savedNotices.filter((_, i) => i !== index))}><Trash2 size={17} /></button></div>)}</div></>}
    </section>
    <section className="operator-card" aria-labelledby="bible-library-title"><h3 id="bible-library-title">Versículos e busca na Bíblia</h3><p className="operator-muted">A seleção carrega a prévia. Envie ao telão quando estiver pronto.</p><div className="operator-actions verse-library"><button type="button" onClick={() => {const verse = VERSES[Math.floor(Math.random() * VERSES.length)]; prepare({text: verse.text, ref: verse.ref});}}>Preparar versículo aleatório</button>{VERSES.map((verse,index) => <button type="button" key={index} onClick={() => prepare({text: verse.text, ref: verse.ref})}>{verse.ref}</button>)}</div><BibleSection prepareOnly currentProjectedRef={customVerseRef || liveVerse?.ref || null} onShowVerse={(text,ref) => prepare({text,ref})} /></section>
  </div>;
});
