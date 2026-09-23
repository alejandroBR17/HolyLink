import React, { useState, useMemo, useEffect } from 'react';
import { Search, Sparkles, RefreshCw, BookOpen, Tag, ChevronDown, X, Filter, Bookmark, Check, Trash2, ArrowRight } from 'lucide-react';
import { VERSES } from '../data';
import { getSetting, saveSetting } from '../utils';

interface BibleSectionProps {
  onShowVerse: (text: string, ref: string) => void;
  currentProjectedRef?: string | null;
}

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

const CATEGORIES = [
  { id: 'todos', label: 'Todos os Salvos' },
  { id: 'fe', label: 'Fé & Confiança' },
  { id: 'salmos', label: 'Salmos & Oração' },
  { id: 'promessas', label: 'Promessas & Guia' },
  { id: 'vitoria', label: 'Vitória & Força' }
];

export function BibleSection({ onShowVerse, currentProjectedRef }: BibleSectionProps) {
  const [mainTab, setMainTab] = useState<'search' | 'saved'>('search');

  // Estado local para controle visual da projeção
  const [internalProjectedRef, setInternalProjectedRef] = useState<string | null>(null);
  const [projectedToast, setProjectedToast] = useState<{ ref: string; text: string } | null>(null);

  const activeProjectedRef = currentProjectedRef !== undefined ? currentProjectedRef : internalProjectedRef;

  const handleProject = (text: string, ref: string) => {
    setInternalProjectedRef(ref);
    setProjectedToast({ ref, text });
    onShowVerse(text, ref);

    // Esconde o brinde de notificação após 4s
    setTimeout(() => {
      setProjectedToast(prev => (prev?.ref === ref ? null : prev));
    }, 4000);
  };

  // Estados de busca online
  const [query, setQuery] = useState('');
  const [selectedTestament, setSelectedTestament] = useState<'all' | 'old' | 'new'>('all');
  const [selectedBook, setSelectedBook] = useState('João');
  const [selectedChapter, setSelectedChapter] = useState('3');
  const [selectedVerse, setSelectedVerse] = useState('16');

  // Modal Customizado para Seleção de Livro
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookSearchFilter, setBookSearchFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; ref: string } | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Estados dos Versículos Salvos / Favoritos
  const [customBookmarks, setCustomBookmarks] = useState<Array<{ text: string; ref: string; category?: string; id?: string }>>([]);
  const [isBookmarksLoaded, setIsBookmarksLoaded] = useState(false);

  useEffect(() => {
    getSetting('custom_saved_bible_verses', []).then(saved => {
      setCustomBookmarks(saved);
      setIsBookmarksLoaded(true);
    });
  }, []);

  const [activeCategory, setActiveCategory] = useState('todos');
  const [savedSearchQuery, setSavedSearchQuery] = useState('');

  // Salva novos favoritos no IndexedDB
  useEffect(() => {
    if (!isBookmarksLoaded) return;
    saveSetting('custom_saved_bible_verses', customBookmarks).catch(e => {
      console.error('Erro ao salvar favoritos no DB', e);
    });
  }, [customBookmarks, isBookmarksLoaded]);

  // Versículos combinados (Iniciais + Customizados)
  const allSavedVerses = useMemo(() => {
    return [...customBookmarks, ...VERSES];
  }, [customBookmarks]);

  // Filtra os livros de acordo com o Testamento selecionado e busca dentro do modal
  const booksToDisplay = useMemo(() => {
    let list = ALL_BIBLE_BOOKS;
    if (selectedTestament === 'old') list = OLD_TESTAMENT_BOOKS;
    if (selectedTestament === 'new') list = NEW_TESTAMENT_BOOKS;

    if (bookSearchFilter.trim()) {
      const q = bookSearchFilter.toLowerCase();
      return list.filter(b => b.toLowerCase().includes(q));
    }
    return list;
  }, [selectedTestament, bookSearchFilter]);

  const handleTestamentChange = (testament: 'all' | 'old' | 'new') => {
    setSelectedTestament(testament);
    if (testament === 'old' && !OLD_TESTAMENT_BOOKS.includes(selectedBook)) {
      setSelectedBook('Gênesis');
    } else if (testament === 'new' && !NEW_TESTAMENT_BOOKS.includes(selectedBook)) {
      setSelectedBook('Mateus');
    }
  };

  // Filtra a lista de Versículos Salvos
  const filteredSavedVerses = useMemo(() => {
    return allSavedVerses.filter((v: any) => {
      if (activeCategory !== 'todos') {
        if (v.category && v.category === activeCategory) {
          // Ok
        } else {
          if (activeCategory === 'fe' && !/fé|crê|confia|espera|deus|paz/i.test(v.text + v.ref)) return false;
          if (activeCategory === 'salmos' && !/salmo/i.test(v.ref)) return false;
          if (activeCategory === 'promessas' && !/tudo|propósito|prover|promess|reino|buscar|saber/i.test(v.text + v.ref)) return false;
          if (activeCategory === 'vitoria' && !/posso|vencedor|fortalec|paz|vitória|esforça/i.test(v.text + v.ref)) return false;
        }
      }

      if (savedSearchQuery.trim()) {
        const q = savedSearchQuery.toLowerCase();
        return v.text.toLowerCase().includes(q) || v.ref.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allSavedVerses, activeCategory, savedSearchQuery]);

  const searchPassageOnline = async (searchStr: string) => {
    if (!searchStr.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setIsSavedSuccess(false);

    const term = searchStr.trim();

    try {
      let res = await fetch(`https://bible-api.com/${encodeURIComponent(term)}?translation=almeida`);
      
      if (!res.ok) {
        const sanitized = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        res = await fetch(`https://bible-api.com/${encodeURIComponent(sanitized)}?translation=almeida`);
      }

      if (!res.ok) {
        throw new Error('Passagem não encontrada. Verifique o livro, capítulo e versículo.');
      }

      const data = await res.json();
      if (!data || !data.text) {
        throw new Error('Texto não disponível para esta referência.');
      }

      setResult({
        text: data.text.trim(),
        ref: data.reference || term
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar versículo na Bíblia Online.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLookup = () => {
    const refStr = selectedVerse.trim() 
      ? `${selectedBook} ${selectedChapter}:${selectedVerse}`
      : `${selectedBook} ${selectedChapter}`;
    searchPassageOnline(refStr);
  };

  const handleSearchSubmit = () => {
    searchPassageOnline(query);
  };

  // Salva o resultado da pesquisa na lista de favoritos
  const handleSaveResultToBookmarks = () => {
    if (!result) return;
    const exists = allSavedVerses.some(v => v.ref.toLowerCase() === result.ref.toLowerCase());
    if (!exists) {
      setCustomBookmarks(prev => [{ text: result.text, ref: result.ref, id: Date.now().toString() }, ...prev]);
    }
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  const handleRemoveBookmark = (refToRemove: string) => {
    setCustomBookmarks(prev => prev.filter(b => b.ref !== refToRemove));
  };

  return (
    <div className="bg-[#030303] border border-[#222] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 relative shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
      
      {/* CABEÇALHO COM TABS DE MODO */}
      <div className="flex items-center justify-between border-b border-[#222] pb-3 flex-wrap gap-2">
        <h2 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 font-sans">
          <BookOpen className="w-4.5 h-4.5 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
          <span>Bíblia Sagrada (Almeida)</span>
        </h2>

        {/* MODO DE NAVEGAÇÃO: PESQUISA ONLINE VS SALVOS */}
        <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded-xl border border-[#222]">
          <button
            type="button"
            onClick={() => setMainTab('search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mainTab === 'search'
                ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)] font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pesquisa Online</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('saved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mainTab === 'saved'
                ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)] font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Salvos ({allSavedVerses.length})</span>
          </button>
        </div>
      </div>

      {/* BANNER NOTIFICAÇÃO DE FEEDBACK DE PROJEÇÃO */}
      {projectedToast && (
        <div className="bg-emerald-950/90 border border-emerald-500/80 text-emerald-100 p-3 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
            <div className="text-xs truncate">
              <span className="font-bold text-emerald-300">Enviado para o Telão:</span>{" "}
              <strong className="font-mono text-amber-300">[{projectedToast.ref}]</strong>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500 text-black font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ml-2 shadow flex items-center gap-1">
            <Check className="w-3 h-3 text-black shrink-0" />
            <span>Ao Vivo</span>
          </span>
        </div>
      )}

      {/* ================= TAB 1: PESQUISA NA BÍBLIA ONLINE ================= */}
      {mainTab === 'search' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          
          {/* SELEÇÃO POR LOTE: TESTAMENTO + LIVRO + CAPÍTULO/VERSÍCULO */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 flex flex-col gap-3">
            
            {/* FILTRO DE TESTAMENTO */}
            <div className="flex items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5 flex-wrap">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-500" />
                Filtrar Por Testamento:
              </span>
              <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-lg border border-stone-800">
                <button
                  type="button"
                  onClick={() => handleTestamentChange('all')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    selectedTestament === 'all'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Todos (66)
                </button>
                <button
                  type="button"
                  onClick={() => handleTestamentChange('old')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    selectedTestament === 'old'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Velho Testamento (39)
                </button>
                <button
                  type="button"
                  onClick={() => handleTestamentChange('new')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    selectedTestament === 'new'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Novo Testamento (27)
                </button>
              </div>
            </div>

            {/* SELEÇÃO DO LIVRO, CAPÍTULO E VERSÍCULO */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 sm:col-span-5 relative">
                <button
                  type="button"
                  onClick={() => {
                    setBookSearchFilter('');
                    setIsBookModalOpen(true);
                  }}
                  className="w-full bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/50 text-stone-200 text-xs font-bold rounded-lg px-3 py-2 flex items-center justify-between transition-all cursor-pointer shadow-sm group"
                >
                  <span className="flex items-center gap-2 truncate">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-amber-400 font-extrabold truncate">{selectedBook}</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400 transition-colors shrink-0 ml-1" />
                </button>
              </div>

              <div className="col-span-6 sm:col-span-3 flex items-center gap-1.5">
                <span className="text-[10px] text-stone-500 font-bold shrink-0">Cap:</span>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 text-stone-200 text-xs font-bold rounded-lg px-2.5 py-2 text-center focus:outline-none focus:border-amber-500"
                  placeholder="1"
                />
              </div>

              <div className="col-span-6 sm:col-span-2 flex items-center gap-1.5">
                <span className="text-[10px] text-stone-500 font-bold shrink-0">Ver:</span>
                <input
                  type="text"
                  value={selectedVerse}
                  onChange={(e) => setSelectedVerse(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 text-stone-200 text-xs font-bold rounded-lg px-2 py-2 text-center focus:outline-none focus:border-amber-500"
                  placeholder="16"
                />
              </div>

              <button
                type="button"
                onClick={handleQuickLookup}
                disabled={loading}
                className="col-span-12 sm:col-span-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shrink-0 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* CAMPO DE DIGITAÇÃO DIRETA */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Ou digite o texto da passagem (ex: Gênesis 1:1, Salmos 23, Romanos 8:28)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="w-full bg-[#0c0c0c] border border-stone-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleSearchSubmit}
              disabled={loading || !query.trim()}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 shrink-0 flex items-center justify-center gap-1.5 border border-stone-700"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                <>
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-[11px] text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-900/50">
              {error}
            </p>
          )}

          {/* ÁREA EXCLUSIVA DE EXIBIÇÃO DO RESULTADO DA PESQUISA ONLINE */}
          {result ? (() => {
            const isCurrentlyProjected = activeProjectedRef && activeProjectedRef.toLowerCase() === result.ref.toLowerCase();
            return (
              <div className={`rounded-xl p-4 flex flex-col gap-3 shadow-xl relative animate-in fade-in zoom-in-95 duration-200 transition-all ${
                isCurrentlyProjected
                  ? 'bg-emerald-950/30 border-2 border-emerald-500 shadow-emerald-950/80'
                  : 'bg-amber-950/20 border border-amber-500/40'
              }`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider font-mono">
                        ● Passagem Encontrada: {result.ref}
                      </span>
                      {isCurrentlyProjected && (
                        <span className="text-[10px] bg-emerald-500 text-black font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />
                          AO VIVO NO TELÃO
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-stone-100 leading-relaxed italic font-serif max-h-[160px] overflow-y-auto pr-1">
                      "{result.text}"
                    </p>
                  </div>
                </div>

                {/* BOTOES DE AÇÃO: PROJETAR E SALVAR */}
                <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleProject(result.text, result.ref)}
                    className={`text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                      isCurrentlyProjected
                        ? 'bg-emerald-500 text-black border border-emerald-400 shadow-emerald-900/50 font-black scale-102'
                        : 'bg-amber-500 hover:bg-amber-400 text-black'
                    }`}
                  >
                    {isCurrentlyProjected ? (
                      <>
                        <Check className="w-4 h-4 text-black" />
                        <span>Exibindo no Telão</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Projetar no Telão</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveResultToBookmarks}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isSavedSuccess
                        ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold'
                        : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {isSavedSuccess ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4 text-amber-400" />}
                    <span>{isSavedSuccess ? 'Salvo em Favoritos!' : 'Favoritar Passagem'}</span>
                  </button>
                </div>
              </div>
            );
          })() : (
            <div className="bg-stone-950/40 border border-dashed border-stone-800/80 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5">
              <BookOpen className="w-6 h-6 text-stone-600 mb-1" />
              <p className="text-xs text-stone-400 font-medium">Nenhuma passagem buscada no momento.</p>
              <p className="text-[10px] text-stone-600 max-w-sm">
                Selecione o livro, capítulo e versículo ou digite acima para consultar qualquer um dos 66 livros da Bíblia Sagrada.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: VERSÍCULOS SALVOS & FAVORITOS ================= */}
      {mainTab === 'saved' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-150">
          
          {/* BUSCA INTERNA NOS SALVOS */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
            <input
              type="text"
              placeholder="Filtrar nos versículos salvos (ex: amor, paz, Salmos 23)..."
              value={savedSearchQuery}
              onChange={(e) => setSavedSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* CATEGORIAS RÁPIDAS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Tag className="w-3.5 h-3.5 text-stone-500 shrink-0 mr-1" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-amber-500 text-black shadow-sm"
                    : "bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* LISTA DE VERSÍCULOS SALVOS */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {filteredSavedVerses.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-6 text-center">
                Nenhum versículo encontrado nesta categoria.
              </p>
            ) : (
              filteredSavedVerses.map((v: any, i: number) => {
                const isCustom = customBookmarks.some(b => b.ref === v.ref);
                const isVerseProjected = activeProjectedRef && activeProjectedRef.toLowerCase() === v.ref.toLowerCase();
                
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 transition-all group ${
                      isVerseProjected
                        ? 'bg-emerald-950/40 border-2 border-emerald-500/90 shadow-lg shadow-emerald-950/50'
                        : 'bg-stone-950/80 border border-stone-850 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold text-amber-500 uppercase font-mono">
                          {v.ref}
                        </span>
                        {isVerseProjected && (
                          <span className="text-[9px] bg-emerald-500 text-black font-extrabold px-1.5 py-0.2 rounded font-sans flex items-center gap-1 shadow">
                            <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />
                            No Telão
                          </span>
                        )}
                        {isCustom && !isVerseProjected && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-sans">
                            Meu Favorito
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-300 truncate font-serif italic mt-0.5" title={v.text}>
                        "{v.text}"
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleProject(v.text, v.ref)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                          isVerseProjected
                            ? 'bg-emerald-500 text-black font-black border border-emerald-400 shadow-md scale-102'
                            : 'bg-stone-900 border border-stone-800 group-hover:border-amber-500/50 group-hover:bg-amber-500 group-hover:text-black text-stone-300'
                        }`}
                      >
                        {isVerseProjected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-black" />
                            <span>No Telão</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Projetar</span>
                          </>
                        )}
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark(v.ref)}
                          title="Remover dos favoritos"
                          className="p-1.5 text-stone-600 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL CUSTOMIZADO DO SISTEMA PARA SELEÇÃO DE LIVROS DA BÍBLIA */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-stone-800 w-full max-w-xl rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xl max-h-[85vh] overflow-hidden">
            {/* CABEÇALHO DO MODAL */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <h3 className="text-stone-200 font-bold text-xs uppercase tracking-wider">
                  Selecione o Livro da Bíblia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BUSCA RÁPIDA DENTRO DO MODAL */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
              <input
                type="text"
                placeholder="Digitar nome do livro (ex: Salmos, Romanos, João)..."
                value={bookSearchFilter}
                onChange={(e) => setBookSearchFilter(e.target.value)}
                autoFocus
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* TABS DE TESTAMENTO DENTRO DO MODAL */}
            <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-lg border border-stone-800/80 text-[10px]">
              <button
                type="button"
                onClick={() => handleTestamentChange('all')}
                className={`flex-1 py-1 rounded text-center font-bold transition-all cursor-pointer ${
                  selectedTestament === 'all' ? 'bg-amber-500 text-black' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Todos (66)
              </button>
              <button
                type="button"
                onClick={() => handleTestamentChange('old')}
                className={`flex-1 py-1 rounded text-center font-bold transition-all cursor-pointer ${
                  selectedTestament === 'old' ? 'bg-amber-500 text-black' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Velho Testamento (39)
              </button>
              <button
                type="button"
                onClick={() => handleTestamentChange('new')}
                className={`flex-1 py-1 rounded text-center font-bold transition-all cursor-pointer ${
                  selectedTestament === 'new' ? 'bg-amber-500 text-black' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Novo Testamento (27)
              </button>
            </div>

            {/* GRID DE SELEÇÃO DE LIVROS */}
            <div className="overflow-y-auto max-h-[320px] pr-1 pt-1">
              {booksToDisplay.length === 0 ? (
                <p className="text-xs text-stone-500 italic text-center py-6">Nenhum livro encontrado com esse nome.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {booksToDisplay.map((bookName) => {
                    const isSelected = selectedBook === bookName;
                    const isOld = OLD_TESTAMENT_BOOKS.includes(bookName);
                    return (
                      <button
                        key={bookName}
                        type="button"
                        onClick={() => {
                          setSelectedBook(bookName);
                          setIsBookModalOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                            : 'bg-stone-950 hover:bg-stone-850 text-stone-300 border-stone-800/80 hover:border-amber-500/40'
                        }`}
                      >
                        <span className="truncate">{bookName}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ml-1 ${
                          isSelected ? 'bg-black/20 text-black' : isOld ? 'text-amber-500/70 bg-stone-900' : 'text-blue-400/70 bg-stone-900'
                        }`}>
                          {isOld ? 'VT' : 'NT'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


