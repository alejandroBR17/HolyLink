import React, { useState } from 'react';
import { BookOpen, Undo2, Shuffle, RefreshCw, Send, MessageSquarePlus, Sparkles, Bell, Check, Trash2 } from 'lucide-react';
import { BibleSection } from '../BibleSection';
import { VERSES } from '../../data';

interface BiblePanelProps {
  activeVerseIndex: number | null;
  customVerseText: string | null;
  customVerseRef: string | null;
  updateStateAndBroadcast: (key: string, value: any) => void;
}

interface NoticePreset {
  title: string;
  text: string;
  ref: string;
}

const DEFAULT_CHURCH_NOTICES: NoticePreset[] = [
  {
    title: "Boas-Vindas",
    text: "Sejam todos muito bem-vindos à Casa do Senhor! Alegrei-me quando me disseram: Vamos à casa do Senhor.",
    ref: "Salmos 122:1"
  },
  {
    title: "Silenciar Celular",
    text: "Por gentileza, pedimos a todos que silenciem seus aparelhos celulares para o momento de oração e reflexão.",
    ref: "Aviso de Culto"
  },
  {
    title: "Santa Ceia",
    text: "Domingo Especial da Santa Ceia do Senhor. Venha participar com toda a sua família e renovar suas alianças.",
    ref: "1 Coríntios 11:26"
  },
  {
    title: "Dízimos & Ofertas",
    text: "Trazei todos os dízimos à casa do tesouro, para que haja mantimento na minha casa, e depois fazei prova de mim.",
    ref: "Malaquias 3:10"
  },
  {
    title: "Escola da Fé",
    text: "Quarta-feira às 19h30 — Noite da Salvação e Busca do Espírito Santo. Fortaleça sua fé!",
    ref: "Reunião Semanal"
  },
  {
    title: "Espaço Infantil EBI",
    text: "Atenção Pais: Acompanhem seus filhos até o espaço da Escola Bíblica Infantil (EBI) para as atividades da fé.",
    ref: "Orientação aos Pais"
  }
];

export const BiblePanel = React.memo(function BiblePanel({
  activeVerseIndex,
  customVerseText,
  customVerseRef,
  updateStateAndBroadcast
}: BiblePanelProps) {
  const [savedNotices, setSavedNotices] = useState<NoticePreset[]>(() => {
    try {
      const stored = localStorage.getItem('projection_saved_notices');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const handleResetVerse = () => {
    updateStateAndBroadcast('activeVerseIndex', null);
    updateStateAndBroadcast('customVerseText', null);
    updateStateAndBroadcast('customVerseRef', null);
  };

  const handleSelectFavorite = (idx: number) => {
    updateStateAndBroadcast('customVerseText', null);
    updateStateAndBroadcast('customVerseRef', null);
    updateStateAndBroadcast('activeVerseIndex', idx);
  };

  const handleShuffle = () => {
    const randomIdx = Math.floor(Math.random() * VERSES.length);
    updateStateAndBroadcast('customVerseText', null);
    updateStateAndBroadcast('customVerseRef', null);
    updateStateAndBroadcast('activeVerseIndex', randomIdx);
  };

  const handleProjectNotice = (notice: NoticePreset) => {
    updateStateAndBroadcast('activeVerseIndex', null);
    updateStateAndBroadcast('customVerseText', notice.text);
    updateStateAndBroadcast('customVerseRef', notice.ref);

    // Preenche também nos campos de texto caso o operador queira editar
    const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
    const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
    if (textEl) textEl.value = notice.text;
    if (refEl) refEl.value = notice.ref;
  };

  const handleProjectCustomText = () => {
    const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
    const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
    if (textEl && textEl.value.trim()) {
      updateStateAndBroadcast('activeVerseIndex', null);
      updateStateAndBroadcast('customVerseText', textEl.value.trim());
      updateStateAndBroadcast('customVerseRef', refEl.value.trim() || null);
    }
  };

  const handleSaveAsNotice = () => {
    const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
    const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
    const text = textEl?.value.trim();
    const ref = refEl?.value.trim() || "Aviso do Operador";

    if (!text) return;

    const newNotice: NoticePreset = {
      title: text.length > 25 ? text.substring(0, 25) + '...' : text,
      text,
      ref
    };

    const updated = [newNotice, ...savedNotices.filter(n => n.text !== text)];
    setSavedNotices(updated);
    localStorage.setItem('projection_saved_notices', JSON.stringify(updated));
  };

  const handleDeleteSavedNotice = (idx: number) => {
    const updated = savedNotices.filter((_, i) => i !== idx);
    setSavedNotices(updated);
    localStorage.setItem('projection_saved_notices', JSON.stringify(updated));
  };

  const handleClearCustomText = () => {
    const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
    const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
    if (textEl) textEl.value = "";
    if (refEl) refEl.value = "";
    updateStateAndBroadcast('customVerseText', null);
    updateStateAndBroadcast('customVerseRef', null);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      
      {/* CARD DE MONITOR DE TEXTO AO VIVO */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Texto & Versículo Transmitido</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Texto exibido atualmente na projeção</p>
            </div>
          </div>

          {(activeVerseIndex !== null || customVerseText) && (
            <button
              onClick={handleResetVerse}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-amber-500/20 transition-all font-bold cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Voltar ao Automático</span>
            </button>
          )}
        </div>

        {/* MONITOR DO TELÃO */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col justify-center min-h-[95px] relative">
          <span className="absolute top-2 left-3 text-[9px] font-black text-amber-500/80 uppercase tracking-wider">
            ● Transmissão no Telão
          </span>
          {customVerseText ? (
            <div className="mt-3">
              <p className="font-semibold text-amber-400 italic text-sm font-sans leading-snug">"{customVerseText}"</p>
              <p className="text-zinc-400 text-[10px] mt-1.5 font-bold uppercase tracking-wider">— {customVerseRef || "Aviso / Texto Personalizado"}</p>
            </div>
          ) : activeVerseIndex !== null ? (
            <div className="mt-3">
              <p className="font-semibold text-amber-400 italic text-sm font-sans leading-snug">"{VERSES[activeVerseIndex].text}"</p>
              <p className="text-zinc-400 text-[10px] mt-1.5 font-bold uppercase tracking-wider">— {VERSES[activeVerseIndex].ref}</p>
            </div>
          ) : (
            <div className="text-zinc-400 text-xs text-center mt-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>Modo Carrossel Ativo: Versículos bíblicos alternando automaticamente a cada 15s.</span>
            </div>
          )}
        </div>

        {/* CONTROLES RÁPIDOS DE ALTERAÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShuffle}
            className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 text-zinc-200 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            <Shuffle className="w-4 h-4 text-amber-500" />
            <span>Versículo Aleatório</span>
          </button>
          
          <button
            type="button"
            onClick={handleResetVerse}
            disabled={activeVerseIndex === null && !customVerseText}
            className={`border text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeVerseIndex === null && !customVerseText
                ? "bg-zinc-950/40 border-zinc-900 text-zinc-600 cursor-not-allowed"
                : "bg-zinc-950 border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 text-zinc-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            <span>Restaurar Rotação</span>
          </button>
        </div>
      </div>

      {/* AVISOS RÁPIDOS & TEXTO PERSONALIZADO */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4.5 h-4.5 text-amber-500" />
            <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Avisos Rápidos & Texto Personalizado</h3>
          </div>
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold px-2.5 py-0.5 rounded-full">
            Projeção Direta
          </span>
        </div>

        {/* PRESETS DE AVISOS DE CULTO */}
        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
            Avisos Pré-Cadastrados:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEFAULT_CHURCH_NOTICES.map((notice, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleProjectNotice(notice)}
                className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 text-left p-2.5 rounded-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[60px]"
              >
                <span className="text-amber-400 font-bold text-[11px] group-hover:text-amber-300">
                  {notice.title}
                </span>
                <span className="text-zinc-500 text-[9px] font-mono truncate mt-1">
                  {notice.ref}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* EDITOR DE TEXTO / RECADO PERSONALIZADO */}
        <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800/60">
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
              Texto Personalizado:
            </label>
            <textarea
              id="operator-custom-verse-textarea"
              placeholder="Digite o aviso ou versículo para projetar..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-sans resize-none transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="operator-custom-verse-ref"
              type="text"
              placeholder="Referência ou Assinatura (ex: João 3:16)"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-sans"
            />
            
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleProjectCustomText}
                className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Projetar</span>
              </button>
              
              <button
                type="button"
                onClick={handleSaveAsNotice}
                title="Salvar esta mensagem para reusar no futuro"
                className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-750 text-zinc-200 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={handleClearCustomText}
                className="bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* MENSAGENS SALVAS PELO OPERADOR */}
        {savedNotices.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/60">
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
              Minhas Mensagens Salvas ({savedNotices.length}):
            </label>
            <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1">
              {savedNotices.map((n, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() => handleProjectNotice(n)}
                    className="text-xs text-zinc-200 hover:text-amber-400 font-medium truncate max-w-[180px] text-left cursor-pointer"
                  >
                    {n.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedNotice(idx)}
                    title="Excluir mensagem salva"
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ACESSO RÁPIDO A FAVORITOS & BÍBLIA SAGRADA */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="border-b border-zinc-800/50 pb-3 flex items-center justify-between">
          <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Acesso Rápido a Versículos Favoritos</h3>
          <span className="text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono font-bold px-2.5 py-0.5 rounded-md">
            {VERSES.length} Versículos
          </span>
        </div>

        <div>
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 border border-zinc-800/80 bg-zinc-950 p-3 rounded-xl">
            {VERSES.map((verse, idx) => {
              const isSelected = activeVerseIndex === idx && !customVerseText;
              return (
                <button
                  key={idx}
                  title={`${verse.ref}: ${verse.text}`}
                  onClick={() => handleSelectFavorite(idx)}
                  className={`h-9 px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-black font-black scale-105 shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
                      : "bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <span className="text-[10px] text-amber-500/80 mr-1.5 font-sans">#{idx + 1}</span>
                  <span>{verse.ref}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BUSCADOR DA BÍBLIA SAGRADA */}
        <div className="pt-2">
          <BibleSection 
            currentProjectedRef={customVerseRef || (activeVerseIndex !== null ? VERSES[activeVerseIndex]?.ref : null)}
            onShowVerse={(text, ref) => {
              updateStateAndBroadcast('activeVerseIndex', null);
              updateStateAndBroadcast('customVerseText', text);
              updateStateAndBroadcast('customVerseRef', ref);
            }} 
          />
        </div>
      </div>

    </div>
  );
});

