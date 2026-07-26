import React from 'react';
import { BookOpen, Undo2, Shuffle, RefreshCw, Layout, Send } from 'lucide-react';
import { BibleSection } from '../BibleSection';
import { VERSES } from '../../data';

interface BiblePanelProps {
  activeVerseIndex: number | null;
  customVerseText: string | null;
  customVerseRef: string | null;
  updateStateAndBroadcast: (key: string, value: any) => void;
}

export function BiblePanel({
  activeVerseIndex,
  customVerseText,
  customVerseRef,
  updateStateAndBroadcast
}: BiblePanelProps) {

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

  const handleProjectCustomText = () => {
    const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
    const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
    if (textEl && textEl.value.trim()) {
      updateStateAndBroadcast('activeVerseIndex', null);
      updateStateAndBroadcast('customVerseText', textEl.value.trim());
      updateStateAndBroadcast('customVerseRef', refEl.value.trim() || null);
    }
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
      
      {/* TEXT STATE CARD */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Texto em Exibição</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Estado atual da projeção de escrituras</p>
            </div>
          </div>

          {(activeVerseIndex !== null || customVerseText) && (
            <button
              onClick={handleResetVerse}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-amber-500/20 transition-all font-bold cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Resetar Versículo
            </button>
          )}
        </div>

        {/* Live Content Display */}
        <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-850 flex flex-col justify-center min-h-[90px] relative">
          <span className="absolute top-2 left-3 text-[9px] font-black text-zinc-600 uppercase tracking-wider">
            Monitor do Texto Projetado
          </span>
          {customVerseText ? (
            <div className="mt-3">
              <p className="font-semibold text-amber-400 italic text-sm font-sans">"{customVerseText}"</p>
              <p className="text-zinc-400 text-[10px] mt-1.5 font-bold uppercase tracking-wider">— {customVerseRef || "Autor/Referência Oculto"}</p>
            </div>
          ) : activeVerseIndex !== null ? (
            <div className="mt-3">
              <p className="font-semibold text-amber-400 italic text-sm font-sans">"{VERSES[activeVerseIndex].text}"</p>
              <p className="text-zinc-400 text-[10px] mt-1.5 font-bold uppercase tracking-wider">— {VERSES[activeVerseIndex].ref}</p>
            </div>
          ) : (
            <div className="text-zinc-500 text-xs text-center mt-2 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>Versículos rotacionando automaticamente de 15 em 15 segundos.</span>
            </div>
          )}
        </div>

        {/* Action Toggle & Shuffle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleShuffle}
            className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 text-xs font-bold py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            <Shuffle className="w-4 h-4 text-amber-500 animate-pulse" />
            Embaralhar Versículo
          </button>
          
          <button
            onClick={handleResetVerse}
            disabled={activeVerseIndex === null && !customVerseText}
            className={`border text-xs font-bold py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeVerseIndex === null && !customVerseText
                ? "bg-zinc-950/20 border-zinc-900 text-zinc-600 cursor-not-allowed"
                : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            Voltar ao Automático
          </button>
        </div>
      </div>

      {/* FAVORITOS E BÍBLIA */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="border-b border-zinc-800/50 pb-3 flex items-center justify-between">
          <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Favoritos & Bíblia</h3>
          <span className="text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-500 font-mono px-2 py-0.5 rounded-md">
            {VERSES.length} Versículos Salvos
          </span>
        </div>

        <div>
          <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">
            Acesso Rápido a Favoritos
          </label>
          <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1 border border-zinc-850 bg-zinc-950/30 p-3 rounded-xl">
            {VERSES.map((verse, idx) => {
              const isSelected = activeVerseIndex === idx && !customVerseText;
              return (
                <button
                  key={idx}
                  title={verse.ref}
                  onClick={() => handleSelectFavorite(idx)}
                  className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-black font-black scale-105 shadow-[0_2px_8px_rgba(245,158,11,0.25)]"
                      : "bg-zinc-950 text-zinc-300 border border-zinc-800/80 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bible Section Component */}
        <div className="pt-2">
          <BibleSection 
            onShowVerse={(text, ref) => {
              updateStateAndBroadcast('activeVerseIndex', null);
              updateStateAndBroadcast('customVerseText', text);
              updateStateAndBroadcast('customVerseRef', ref);
            }} 
          />
        </div>
      </div>

      {/* PROJETOR DE TEXTO PERSONALIZADO */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider border-b border-zinc-800/50 pb-3">
          Projetar Texto Personalizado / Avisos
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2 block">
              Conteúdo da Mensagem
            </label>
            <textarea
              id="operator-custom-verse-textarea"
              placeholder="Digite qualquer recado, aviso ou texto para transmitir imediatamente..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-sans resize-none"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="operator-custom-verse-ref"
              type="text"
              placeholder="Assinatura / Referência (ex: Bispo Clodomir / João 3:16)"
              className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-sans"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleProjectCustomText}
                className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-amber-500/10 min-w-[110px]"
              >
                <Send className="w-3.5 h-3.5" /> Projetar
              </button>
              
              <button
                onClick={handleClearCustomText}
                className="bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
