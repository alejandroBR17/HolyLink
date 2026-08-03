import React, { useState, useMemo } from 'react';
import { Search, Sparkles, RefreshCw, BookOpen, Tag, Check } from 'lucide-react';
import { VERSES } from '../data';

interface BibleSectionProps {
  onShowVerse: (text: string, ref: string) => void;
}

const CATEGORIES = [
  { id: 'todos', label: 'Todos os Salvos' },
  { id: 'fe', label: 'Fé & Confiança' },
  { id: 'salmos', label: 'Salmos & Proteção' },
  { id: 'ofertas', label: 'Dízimos & Ofertas' },
  { id: 'vitoria', label: 'Vitória & Força' }
];

export function BibleSection({ onShowVerse }: BibleSectionProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; ref: string } | null>(null);

  const filteredLocalVerses = useMemo(() => {
    return VERSES.filter((v) => {
      // Filtro de Categoria simples por conteúdo
      if (activeCategory === 'fe') {
        if (!/fé|crê|confia|espera|deus/i.test(v.text + v.ref)) return false;
      } else if (activeCategory === 'salmos') {
        if (!/salmo|senhor|refúgio|rocha|pasto/i.test(v.text + v.ref)) return false;
      } else if (activeCategory === 'ofertas') {
        if (!/trazei|dízimo|mantimento|oferta|abenço/i.test(v.text + v.ref)) return false;
      } else if (activeCategory === 'vitoria') {
        if (!/tudo posso|vencedor|fortalec|paz|vitória/i.test(v.text + v.ref)) return false;
      }

      // Filtro de Busca
      if (query.trim()) {
        const q = query.toLowerCase();
        return v.text.toLowerCase().includes(q) || v.ref.toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, activeCategory]);

  const parseAndMapReference = (ref: string) => {
    const match = ref.match(/^(\d?\s*)?([a-zA-ZáéíóúÁÉÍÓÚçÇ]+)\s*(\d+)(:(\d+)(-(\d+))?)?$/);
    if (!match) return ref;

    const bookNumber = match[1] ? match[1].trim() + " " : "";
    const rawBookName = match[2].trim().toLowerCase();
    const chapter = match[3];
    const startVerse = match[4] || "";
    const endVerse = match[6] ? "-" + match[6] : "";

    const bookMap: Record<string, string> = {
      "gênesis": "GEN", "genesis": "GEN", "gn": "GEN",
      "êxodo": "EXO", "exodo": "EXO", "ex": "EXO",
      "levítico": "LEV", "levitico": "LEV", "lv": "LEV",
      "números": "NUM", "numeros": "NUM", "nm": "NUM",
      "deuteronômio": "DEU", "deuteronomio": "DEU", "dt": "DEU",
      "josué": "JOS", "josue": "JOS", "js": "JOS",
      "juízes": "JDG", "juizes": "JDG", "jz": "JDG",
      "rute": "RUT", "rt": "RUT",
      "samuel": "SA", "sm": "SA",
      "reis": "KI", "re": "KI",
      "crônicas": "CH", "cronicas": "CH", "cr": "CH",
      "esdras": "EZR", "es": "EZR",
      "neemias": "NEH", "ne": "NEH",
      "ester": "EST", "et": "EST",
      "jó": "JOB", "jo": "JHN", 
      "salmos": "PSA", "salmo": "PSA", "sl": "PSA",
      "provérbios": "PRO", "proverbios": "PRO", "pv": "PRO",
      "eclesiastes": "ECC", "ec": "ECC",
      "cantares": "SNG", "cântico dos cânticos": "SNG", "ct": "SNG",
      "isaías": "ISA", "isaias": "ISA", "is": "ISA",
      "jeremias": "JER", "jr": "JER",
      "lamentações": "LAM", "lamentacoes": "LAM", "lm": "LAM",
      "ezequiel": "EZK", "ez": "EZK",
      "daniel": "DAN", "dn": "DAN",
      "oséias": "HOS", "oseias": "HOS", "os": "HOS",
      "joel": "JOL", "jl": "JOL",
      "amós": "AMO", "amos": "AMO", "am": "AMO",
      "obadias": "OBA", "ob": "OBA",
      "jonas": "JON", "jn": "JON",
      "miquéias": "MIC", "miqueias": "MIC", "mq": "MIC",
      "naum": "NAM", "na": "NAM",
      "habacuque": "HAB", "hc": "HAB",
      "sofonias": "ZEP", "sf": "ZEP",
      "ageu": "HAG", "ag": "HAG",
      "zacarias": "ZEC", "zc": "ZEC",
      "malaquias": "MAL", "ml": "MAL",
      "mateus": "MAT", "mt": "MAT",
      "marcos": "MRK", "mc": "MRK",
      "lucas": "LUK", "lc": "LUK",
      "joão": "JHN", "joao": "JHN",
      "atos": "ACT", "at": "ACT",
      "romanos": "ROM", "rm": "ROM",
      "coríntios": "CO", "corintios": "CO", "co": "CO",
      "gálatas": "GAL", "galatas": "GAL", "gl": "GAL",
      "efésios": "EPH", "efesios": "EPH", "ef": "EPH",
      "filipenses": "PHP", "fp": "PHP",
      "colossenses": "COL", "cl": "COL",
      "tessalonicenses": "TH", "ts": "TH",
      "timóteo": "TI", "timoteo": "TI", "tm": "TI",
      "tito": "TIT", "tt": "TIT",
      "filemom": "PHM", "fl": "PHM",
      "hebreus": "HEB", "hb": "HEB",
      "tiago": "JAS", "tg": "JAS",
      "pedro": "PE", "pe": "PE",
      "judas": "JUD", "jd": "JUD",
      "apocalipse": "REV", "ap": "REV"
    };

    let mappedBook = bookMap[rawBookName] || rawBookName;
    if (mappedBook === "JHN" && bookNumber) {
      mappedBook = "JN";
    }

    let finalRef = bookNumber ? `${bookNumber.trim()}${mappedBook} ${chapter}` : `${mappedBook} ${chapter}`;
    if (startVerse) finalRef += `:${startVerse}${endVerse}`;
    return finalRef;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsedQueryRef = parseAndMapReference(query).toLowerCase().replace(/\s+/g, '');
      const localMatch = VERSES.find((v) => {
        const cleanedLocalRef = v.ref.replace(/\s*\([^)]*\)/g, '').trim();
        const parsedLocalRef = parseAndMapReference(cleanedLocalRef).toLowerCase().replace(/\s+/g, '');
        return parsedQueryRef === parsedLocalRef;
      });

      if (localMatch) {
        setResult({ text: localMatch.text, ref: localMatch.ref });
        setLoading(false);
        return;
      }

      const parsedRef = parseAndMapReference(query);
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(parsedRef)}?translation=almeida`);
      if (!response.ok) throw new Error('Versículo não encontrado. Tente buscar como "João 3:16" ou "Salmos 23:1".');
      
      const data = await response.json();
      if (!data.text) throw new Error('Texto não disponível.');

      setResult({ text: data.text.trim(), ref: query.trim().replace(/^\w/, (c) => c.toUpperCase()) });
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar versículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <h2 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4.5 h-4.5 text-amber-500" />
          <span>Pesquisa na Bíblia Sagrada (Almeida)</span>
        </h2>
        <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-mono font-bold">
          {VERSES.length} Versículos no Acervo
        </span>
      </div>
      
      {/* CAMPO DE BUSCA DA BÍBLIA */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="Digite trecho do versículo ou referência (ex: João 3:16, Sl 23:1, Malaquias 3:10)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-[#0c0c0c] border border-stone-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 shadow-md"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
            <>
              <Search className="w-4 h-4" />
              <span>Buscar Online</span>
            </>
          )}
        </button>
      </div>

      {/* CATEGORIAS RÁPIDAS DE FILTRO */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
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

      {error && (
        <p className="text-[11px] text-red-400 bg-red-950/30 p-2.5 rounded-xl border border-red-900/50">
          {error}
        </p>
      )}

      {/* RESULTADO DA BUSCA ONLINE */}
      {result && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider block mb-1">
                Resultado Encontrado: {result.ref}
              </span>
              <p className="text-xs text-stone-200 leading-relaxed italic font-serif">"{result.text}"</p>
            </div>
            <button
              type="button"
              onClick={() => onShowVerse(result.text, result.ref)}
              className="bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Projetar Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* LISTA FILTRADA DE VERSÍCULOS DO ACERVO */}
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
          Versículos Sugeridos ({filteredLocalVerses.length}):
        </span>
        {filteredLocalVerses.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-2">Nenhum versículo local corresponde ao filtro. Clique em "Buscar Online" para pesquisar em toda a Bíblia.</p>
        ) : (
          filteredLocalVerses.map((v, i) => (
            <div
              key={i}
              className="bg-stone-950/60 border border-stone-850 hover:border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-3 transition-all group"
            >
              <div className="overflow-hidden">
                <span className="text-[10px] font-extrabold text-amber-500/90 uppercase block font-mono">
                  {v.ref}
                </span>
                <p className="text-xs text-stone-300 truncate font-serif italic mt-0.5" title={v.text}>
                  "{v.text}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => onShowVerse(v.text, v.ref)}
                className="bg-stone-900 border border-stone-800 group-hover:border-amber-500/50 group-hover:bg-amber-500 group-hover:text-black text-stone-300 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                <span>Projetar</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
