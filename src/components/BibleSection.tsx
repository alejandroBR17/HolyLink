import React, { useState } from 'react';
import { Search, Sparkles, RefreshCw, BookOpen } from 'lucide-react';
import { VERSES } from '../data';

interface BibleSectionProps {
  onShowVerse: (text: string, ref: string) => void;
}

export function BibleSection({ onShowVerse }: BibleSectionProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; ref: string } | null>(null);

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
      if (!response.ok) throw new Error('Versículo não encontrado.');
      
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
    <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
        <BookOpen className="w-4.5 h-4.5 text-blue-500" />
        Bíblia Online (Almeida)
      </h2>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
          <input
            type="text"
            placeholder="Ex: João 3:16 ou Sl 23:1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-[#0c0c0c] border border-stone-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-stone-600 transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 text-xs font-bold px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </button>
      </div>

      {error && <p className="text-[10px] text-red-400 bg-red-950/20 p-2 rounded-lg border border-red-900/50">{error}</p>}

      {result && (
        <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">{result.ref}</span>
              <p className="text-xs text-stone-300 leading-relaxed italic">"{result.text}"</p>
            </div>
            <button
              onClick={() => onShowVerse(result.text, result.ref)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-lg"
            >
              <Sparkles className="w-3 h-3" />
              Projetar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
