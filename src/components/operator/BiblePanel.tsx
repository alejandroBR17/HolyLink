import React, { useState, useEffect } from 'react';
import { BookOpen, Undo2, Shuffle, RefreshCw, Send, MessageSquarePlus, Sparkles, Bell, Check, Trash2 } from 'lucide-react';
import { BibleSection } from '../BibleSection';
import { VERSES } from '../../data';

interface BiblePanelProps {
  activeVerseIndex: number | null;
  customVerseText: string | null;
  customVerseRef: string | null;
  updateStateAndBroadcast: (key: string, value: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  showAlert?: (message: string, type?: 'success' | 'error' | 'info') => void;
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
  updateStateAndBroadcast,
  showToast,
  showAlert
}: BiblePanelProps) {
  const notify = showToast || showAlert;
  const [savedNotices, setSavedNotices] = useState<NoticePreset[]>([]);
  const [isNoticesLoaded, setIsNoticesLoaded] = useState(false);

  useEffect(() => {
    import('../../utils').then(({ getSetting }) => {
      getSetting('projection_saved_notices', []).then(saved => {
        setSavedNotices(saved);
        setIsNoticesLoaded(true);
      });
    });
  }, []);

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
      if (notify) notify("Texto/Aviso projetado no telão com sucesso!", "success");
    } else {
      if (notify) notify("Por favor, digite o texto ou versículo antes de projetar.", "error");
    }
  };

  const handleSaveAsNotice = () => {
    const textEl = document.getElementById('operator-custom-verse-textarea') as HTMLTextAreaElement;
    const refEl = document.getElementById('operator-custom-verse-ref') as HTMLInputElement;
    const text = textEl?.value.trim();
    const ref = refEl?.value.trim() || "Aviso do Operador";

    if (!text) {
      if (notify) notify("Digite o texto do aviso antes de salvar.", "error");
      return;
    }

    const newNotice: NoticePreset = {
      title: text.length > 25 ? text.substring(0, 25) + '...' : text,
      text,
      ref
    };

    const updated = [newNotice, ...savedNotices.filter(n => n.text !== text)];
    setSavedNotices(updated);
    import('../../utils').then(({ saveSetting }) => {
      saveSetting('projection_saved_notices', updated);
      if (notify) notify("Aviso salvo na lista rápida!", "success");
    });
  };

  const handleDeleteSavedNotice = (idx: number) => {
    const updated = savedNotices.filter((_, i) => i !== idx);
    setSavedNotices(updated);
    import('../../utils').then(({ saveSetting }) => {
      saveSetting('projection_saved_notices', updated);
    });
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
      <section aria-label="Texto Transmitido" className="relative bg-[#09090b] border border-[#27272a] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-5 group">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 flex items-center justify-between border-b border-[#333] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#111113] border border-amber-900/50 rounded-xl text-amber-500 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <BookOpen className="w-5 h-5 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider font-sans">Texto & Versículo Transmitido</h3>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Texto exibido atualmente na projeção</p>
            </div>
          </div>

          {(activeVerseIndex !== null || customVerseText) && (
            <button
              type="button"
              onClick={handleResetVerse}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:translate-y-[1px] cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Voltar ao Automático</span>
            </button>
          )}
        </div>

        {/* MONITOR DO TELÃO */}
        <div className="relative z-10 bg-[#030303] p-4 rounded-xl border border-[#222] flex flex-col justify-center min-h-[95px] shadow-[inset_0_2px_10px_rgba(0,0,0,1)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"></div>
          <span className="absolute top-2.5 left-3.5 text-[9px] font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            ● TRANSMISSÃO NO TELÃO
          </span>
          {customVerseText ? (
            <div className="mt-4">
              <p className="font-semibold text-amber-400 italic text-sm font-sans leading-snug drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">"{customVerseText}"</p>
              <p className="text-zinc-400 text-[10px] mt-1.5 font-mono font-bold uppercase tracking-wider">— {customVerseRef || "Aviso / Texto Personalizado"}</p>
            </div>
          ) : activeVerseIndex !== null ? (
            <div className="mt-4">
              <p className="font-semibold text-amber-400 italic text-sm font-sans leading-snug drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">"{VERSES[activeVerseIndex].text}"</p>
              <p className="text-zinc-400 text-[10px] mt-1.5 font-mono font-bold uppercase tracking-wider">— {VERSES[activeVerseIndex].ref}</p>
            </div>
          ) : (
            <div className="text-zinc-400 text-xs text-center mt-4 flex items-center justify-center gap-2 font-mono">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>Modo Carrossel Ativo: Versículos bíblicos alternando automaticamente a cada 15s.</span>
            </div>
          )}
        </div>

        {/* CONTROLES RÁPIDOS DE ALTERAÇÃO */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleShuffle}
            className="bg-gradient-to-b from-[#1c1c1f] to-[#121214] border border-[#333] hover:border-amber-500/50 text-zinc-200 hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[2px]"
          >
            <Shuffle className="w-4 h-4 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.6)]" />
            <span>Versículo Aleatório</span>
          </button>
          
          <button
            type="button"
            onClick={handleResetVerse}
            disabled={activeVerseIndex === null && !customVerseText}
            className={`border text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
              activeVerseIndex === null && !customVerseText
                ? "bg-[#050507] border-[#1a1a1c] text-zinc-700 cursor-not-allowed"
                : "bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] hover:border-amber-500/50 text-zinc-200 hover:text-white cursor-pointer shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[2px]"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            <span>Restaurar Rotação</span>
          </button>
        </div>
      </section>

      {/* AVISOS RÁPIDOS & TEXTO PERSONALIZADO */}
      <section aria-label="Avisos e Texto Personalizado" className="relative bg-[#09090b] border border-[#27272a] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-5 group">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 flex items-center justify-between border-b border-[#333] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#111113] border border-amber-900/50 rounded-xl text-amber-500 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <Bell className="w-5 h-5 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider font-sans">Avisos Rápidos & Texto Personalizado</h3>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Crie e envie recados direto para o telão</p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-950/80 border border-amber-900/50 text-amber-500 font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            Projeção Direta
          </span>
        </div>

        {/* PRESETS DE AVISOS DE CULTO */}
        <div className="relative z-10">
          <label className="text-zinc-400 text-[10px] font-sans font-bold uppercase tracking-wider mb-2.5 block">
            Avisos Pré-Cadastrados:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DEFAULT_CHURCH_NOTICES.map((notice, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleProjectNotice(notice)}
                className="bg-[#030303] border border-[#222] hover:border-amber-500/50 hover:bg-[#0c0c0e] text-left p-3 rounded-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[64px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
              >
                <span className="text-amber-400 font-sans font-bold text-xs group-hover:text-amber-300 transition-colors">
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
        <div className="relative z-10 flex flex-col gap-3 pt-3 border-t border-[#222]">
          <div>
            <label className="text-zinc-400 text-[10px] font-sans font-bold uppercase tracking-wider mb-2 block">
              Texto Personalizado:
            </label>
            <textarea
              id="operator-custom-verse-textarea"
              placeholder="Digite o aviso ou versículo para projetar..."
              rows={3}
              className="w-full bg-[#030303] border border-[#27272a] rounded-xl px-4 py-3 text-sm font-sans font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 resize-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,1)]"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="operator-custom-verse-ref"
              type="text"
              placeholder="Referência ou Assinatura (ex: João 3:16)"
              className="flex-1 bg-[#030303] border border-[#27272a] rounded-xl px-4 py-2.5 text-xs font-sans font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]"
            />
            
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleProjectCustomText}
                className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] active:translate-y-[1px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Projetar</span>
              </button>
              
              <button
                type="button"
                onClick={handleSaveAsNotice}
                title="Salvar esta mensagem para reusar no futuro"
                className="bg-[#111113] border border-[#333] hover:border-[#444] text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.5)] active:translate-y-[1px]"
              >
                <MessageSquarePlus className="w-4 h-4 text-amber-500" />
              </button>

              <button
                type="button"
                onClick={handleClearCustomText}
                className="bg-[#111113] border border-[#222] hover:border-[#333] text-zinc-400 hover:text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* MENSAGENS SALVAS PELO OPERADOR */}
        {savedNotices.length > 0 && (
          <div className="relative z-10 pt-3 border-t border-[#222]">
            <label className="text-zinc-400 text-[10px] font-sans font-bold uppercase tracking-wider mb-2 block">
              Minhas Mensagens Salvas ({savedNotices.length}):
            </label>
            <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1">
              {savedNotices.map((n, idx) => (
                <div
                  key={idx}
                  className="bg-[#030303] border border-[#222] hover:border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2 group shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]"
                >
                  <button
                    type="button"
                    onClick={() => handleProjectNotice(n)}
                    className="text-xs text-zinc-200 hover:text-amber-400 font-sans font-medium truncate max-w-[180px] text-left cursor-pointer"
                  >
                    {n.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedNotice(idx)}
                    title="Excluir mensagem salva"
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ACESSO RÁPIDO A FAVORITOS & BÍBLIA SAGRADA */}
      <section aria-label="Bíblia e Favoritos" className="relative bg-[#09090b] border border-[#27272a] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-5 group">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 border-b border-[#333] pb-3.5 flex items-center justify-between">
          <h3 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider font-sans">Acesso Rápido a Versículos Favoritos</h3>
          <span className="text-[10px] bg-[#030303] border border-[#222] text-zinc-400 font-mono font-bold px-2.5 py-1 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            {VERSES.length} Versículos
          </span>
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap gap-2 max-h-[130px] overflow-y-auto pr-1 border border-[#222] bg-[#030303] p-3 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
            {VERSES.map((verse, idx) => {
              const isSelected = activeVerseIndex === idx && !customVerseText;
              return (
                <button
                  key={idx}
                  title={`${verse.ref}: ${verse.text}`}
                  onClick={() => handleSelectFavorite(idx)}
                  className={`h-9 px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-black font-black scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                      : "bg-[#111113] text-zinc-300 border border-[#27272a] hover:border-[#444] hover:text-white shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
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
        <div className="relative z-10 pt-2">
          <BibleSection 
            currentProjectedRef={customVerseRef || (activeVerseIndex !== null ? VERSES[activeVerseIndex]?.ref : null)}
            onShowVerse={(text, ref) => {
              updateStateAndBroadcast('activeVerseIndex', null);
              updateStateAndBroadcast('customVerseText', text);
              updateStateAndBroadcast('customVerseRef', ref);
            }} 
          />
        </div>
      </section>

    </div>
  );
});

