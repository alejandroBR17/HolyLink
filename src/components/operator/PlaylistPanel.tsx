import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, RefreshCw, ArrowUp, ArrowDown, Film, Plus, VolumeX, Volume2, 
  Maximize, Zap, Minimize, Send, Trash2, Image as ImageIcon, AlertTriangle,
  Eye, EyeOff, Search, Layers, ChevronsUp, ChevronsDown, Filter, Sparkles, Check,
  LayoutGrid, List, Edit3, Maximize2, X, Clock
} from 'lucide-react';

interface CustomMedia {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number;
  enabledInLoop: boolean;
  url: string;
  muted?: boolean;
  order?: number;
  fit?: 'contain' | 'cover' | 'fill';
}

interface PlaylistPanelProps {
  currentSlideId: string;
  manualSlideOverride: string | null;
  activeSlides: string[];
  allAvailableSlides?: string[];
  disabledSlides?: string[];
  customMediaList: CustomMedia[];
  getSlideDuration: (id: string, list: CustomMedia[]) => number;
  updateStateAndBroadcast: (key: string, value: any) => void;
  handleMoveSlide: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  handleToggleDisableSlide?: (id: string) => void;
  handleReorderGrouped?: () => void;
  handleReorderInterleaved?: () => void;
  handleResetSlidesOrder?: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadError: string | null;
  videoPinBehavior: 'loop' | 'unpin';
  handleMoveMedia: (id: string, direction: 'up' | 'down') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'info') => void;
  showAlert: (message: string, type?: 'success' | 'error' | 'info') => void;
  deleteMediaItem: (id: string) => Promise<void>;
  broadcastMediaDelete: (id: string) => void;
  broadcastMediaSave: (item: CustomMedia) => void;
  saveMediaItem: (item: any) => Promise<void>;
  customMeetings: any[];
}

type QueueFilterMode = 'all' | 'active' | 'disabled' | 'media' | 'agenda';

export const PlaylistPanel = React.memo(function PlaylistPanel({
  currentSlideId,
  manualSlideOverride,
  activeSlides,
  allAvailableSlides = [],
  disabledSlides = [],
  customMediaList,
  getSlideDuration,
  updateStateAndBroadcast,
  handleMoveSlide,
  handleToggleDisableSlide,
  handleReorderGrouped,
  handleReorderInterleaved,
  handleResetSlidesOrder,
  handleFileUpload,
  isUploading,
  uploadError,
  videoPinBehavior,
  handleMoveMedia,
  showConfirm,
  showAlert,
  deleteMediaItem,
  broadcastMediaDelete,
  broadcastMediaSave,
  saveMediaItem,
  customMeetings
}: PlaylistPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterMode, setFilterMode] = useState<QueueFilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para a central de gestão de mídias
  const [mediaViewMode, setMediaViewMode] = useState<'list' | 'grid'>('list');
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editingMediaName, setEditingMediaName] = useState('');
  const [previewMedia, setPreviewMedia] = useState<CustomMedia | null>(null);
  const [defaultImgSeconds, setDefaultImgSeconds] = useState<number>(() => {
    const customDefDur = Number(localStorage.getItem('projection_default_img_duration'));
    return (customDefDur && customDefDur >= 2000) ? Math.round(customDefDur / 1000) : 10;
  });

  const filteredCustomMedia = useMemo(() => {
    return customMediaList.filter((media) => {
      if (mediaTypeFilter === 'image' && media.type !== 'image') return false;
      if (mediaTypeFilter === 'video' && media.type !== 'video') return false;
      if (mediaSearchTerm) {
        const q = mediaSearchTerm.toLowerCase();
        if (!media.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [customMediaList, mediaTypeFilter, mediaSearchTerm]);

  const handleStartRename = (media: CustomMedia) => {
    setEditingMediaId(media.id);
    setEditingMediaName(media.name);
  };

  const handleSaveRename = async (media: CustomMedia) => {
    if (!editingMediaName.trim()) {
      setEditingMediaId(null);
      return;
    }
    const updatedMedia = { ...media, name: editingMediaName.trim() };
    await saveMediaItem(updatedMedia);
    broadcastMediaSave(updatedMedia);
    updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
    setEditingMediaId(null);
    showAlert(`Nome da mídia alterado para "${editingMediaName.trim()}"`, 'success');
  };

  const handleDefaultImgDurationChange = (seconds: number) => {
    setDefaultImgSeconds(seconds);
    localStorage.setItem('projection_default_img_duration', (seconds * 1000).toString());
    showAlert(`Duração padrão para novas imagens configurada em ${seconds}s`, 'info');
  };

  // Combina todos os slides conhecidos respeitando a ordem atual de slidesOrder
  const fullSlideList = useMemo(() => {
    const list = [...activeSlides];
    allAvailableSlides.forEach((id) => {
      if (!list.includes(id)) {
        list.push(id);
      }
    });
    return list;
  }, [activeSlides, allAvailableSlides]);

  const getSlideDetails = (slideId: string) => {
    let name = slideId;
    let desc = "";
    let category: 'fixo' | 'agenda' | 'campanha' | 'midia' | 'evento' = 'fixo';

    if (slideId.startsWith("agenda_day_")) {
      category = 'agenda';
      if (slideId === "agenda_day_6_causas") {
        name = "Agenda: Sábado (Causas Impossíveis)";
        desc = "Jejum das Causas Impossíveis";
      } else if (slideId === "agenda_day_6_fju") {
        name = "Agenda: Sábado (FJU)";
        desc = "Força Jovem Universal";
      } else {
        const dayIdx = parseInt(slideId.replace("agenda_day_", ""), 10);
        const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        name = `Agenda: ${days[dayIdx] || "Semana"}`;
        desc = "Programação semanal da igreja";
      }
    } else if (slideId.startsWith("meeting_event_")) {
      category = 'evento';
      const meetId = slideId.replace("meeting_event_", "");
      const meeting = customMeetings.find(m => m.id === meetId);
      name = meeting ? meeting.theme : "Evento Único";
      desc = meeting ? `Evento: ${meeting.dayName} às ${meeting.time}` : "Programação especial";
    } else if (slideId.startsWith("custom_")) {
      category = 'midia';
      const media = customMediaList.find(m => m.id === slideId);
      name = media ? media.name : "Mídia Customizada";
      desc = media ? `Mídia: ${media.type === 'image' ? 'Imagem' : 'Vídeo MP4/WebM'}` : "Arquivo local enviado";
    } else {
      switch (slideId) {
        case 'seat': name = "Fique à vontade"; desc = "Acomode-se no seu lugar"; category = 'fixo'; break;
        case 'bathroom': name = "Vá ao banheiro"; desc = "Ir antes do início do culto"; category = 'fixo'; break;
        case 'phone': name = "Celular no Silencioso"; desc = "Evitar distrações no culto"; category = 'fixo'; break;
        case 'no_chat': name = "Silêncio / Concentração"; desc = "Momento de oração e reflexão"; category = 'fixo'; break;
        case 'soon': name = "Começa em Instantes"; desc = "Contador curto pré-culto"; category = 'fixo'; break;
        case 'social': name = "Redes Sociais"; desc = "@universaljardimosasco"; category = 'fixo'; break;
        case 'donations': name = "Doações / Dízimos"; desc = "QR Code PIX e Dados Bancários"; category = 'fixo'; break;
        case 'campaigns': name = "Campanhas da Igreja"; desc = "Fogueira Santa e propósitos"; category = 'campanha'; break;
        case 'world_god': name = "Universal pelo Mundo"; desc = "Fotos de templos globais"; category = 'fixo'; break;
        default: name = slideId; desc = "Slide da projeção"; category = 'fixo'; break;
      }
    }
    return { name, desc, category };
  };

  // Filtra e pesquisa a lista de slides
  const filteredSlides = useMemo(() => {
    return fullSlideList.filter((slideId) => {
      const { name, desc, category } = getSlideDetails(slideId);
      const isDisabled = disabledSlides.includes(slideId);
      const isMedia = slideId.startsWith('custom_');

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        if (!name.toLowerCase().includes(query) && !desc.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (filterMode === 'active') return !isDisabled;
      if (filterMode === 'disabled') return isDisabled;
      if (filterMode === 'media') return isMedia;
      if (filterMode === 'agenda') return category === 'agenda' || category === 'evento';
      return true;
    });
  }, [fullSlideList, disabledSlides, searchTerm, filterMode, customMeetings, customMediaList]);

  // Duração total do loop ativo
  const totalLoopDuration = useMemo(() => {
    return activeSlides.reduce((sum, id) => sum + getSlideDuration(id, customMediaList), 0);
  }, [activeSlides, customMediaList, getSlideDuration]);

  const formatTotalTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const handleCycleFit = async (media: CustomMedia) => {
    const currentFit = media.fit || 'contain';
    let nextFit: 'contain' | 'cover' | 'fill' = 'contain';
    if (currentFit === 'contain') nextFit = 'cover';
    else if (currentFit === 'cover') nextFit = 'fill';
    else nextFit = 'contain';

    const updatedMedia = { ...media, fit: nextFit };
    await saveMediaItem(updatedMedia);
    broadcastMediaSave(updatedMedia);
    updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
  };

  const handleToggleMute = async (media: CustomMedia) => {
    const updatedMedia = { ...media, muted: !media.muted };
    await saveMediaItem(updatedMedia);
    broadcastMediaSave(updatedMedia);
    updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
  };

  const handleAdjustDuration = async (media: CustomMedia, amount: number) => {
    const newDur = Math.max(2000, media.duration + amount);
    const updatedMedia = { ...media, duration: newDur };
    await saveMediaItem(updatedMedia);
    broadcastMediaSave(updatedMedia);
    updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
  };

  const handleToggleLoopEnable = async (media: CustomMedia, checked: boolean) => {
    const updatedMedia = { ...media, enabledInLoop: checked };
    await saveMediaItem(updatedMedia);
    broadcastMediaSave(updatedMedia);
    updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
  };

  // Exclusão segura de mídia sincronizada em tempo real
  const handleRemoveMedia = (media: CustomMedia) => {
    showConfirm(
      'Excluir Mídia',
      `Tem certeza que deseja excluir "${media.name}"? Esta ação vai removê-la da fila no computador e no celular.`,
      async () => {
        try {
          if (currentSlideId === media.id || manualSlideOverride === media.id) {
            updateStateAndBroadcast('manualSlideOverride', null);
          }

          // 1. Deleta do banco IndexedDB local
          await deleteMediaItem(media.id);

          // 2. Transmite sinal de exclusão via PeerJS para todos os aparelhos
          broadcastMediaDelete(media.id);

          // 3. Limpa o ID da mídia do slidesOrder local e transmite a nova ordem
          const savedOrderStr = localStorage.getItem('projection_slidesOrder');
          if (savedOrderStr) {
            try {
              const savedOrder = JSON.parse(savedOrderStr);
              if (Array.isArray(savedOrder)) {
                const newOrder = savedOrder.filter((id: string) => id !== media.id);
                updateStateAndBroadcast('slidesOrder', JSON.stringify(newOrder));
              }
            } catch (e) {}
          }

          // 4. Dispara trigger de atualização
          updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
          showAlert(`Mídia "${media.name}" excluída e removida da fila`, 'success');
        } catch (err) {
          console.error("Erro ao excluir mídia:", err);
          showAlert("Não foi possível excluir a mídia", "error");
        }
      },
      'danger'
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      
      {/* SEÇÃO DA FILA DE REPRODUÇÃO */}
      <section aria-label="Playlists e Fila de Slides" className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
        
        {/* CABEÇALHO DA FILA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-zinc-100 font-extrabold text-sm uppercase tracking-wider">Fila e Sequência de Projeção</h2>
                <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  {activeSlides.length} Ativos • {formatTotalTime(totalLoopDuration)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Organize a sequência exata de avisos, vídeos e agendas exibidos na projeção</p>
            </div>
          </div>

          {/* CONTROLES DE MODO DE PROJEÇÃO */}
          <div className="flex flex-wrap items-center gap-2">
            {handleReorderInterleaved && (
              <button
                type="button"
                onClick={() => {
                  handleReorderInterleaved();
                  showAlert("Fila intercalada dinamicamente (1 slide por categoria por vez)", "success");
                }}
                title="Intercalar dinamicamente: 1 de cada categoria por vez (Aviso -> Agenda -> Dízimo -> Campanha -> Mídia)"
                className="bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[38px]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Intercalar Categoria</span>
              </button>
            )}

            {handleReorderGrouped && (
              <button
                type="button"
                onClick={() => {
                  handleReorderGrouped();
                  showAlert("Fila reorganizada por categoria com sucesso", "info");
                }}
                title="Agrupar por categoria (Avisos -> Agendas -> Dízimos -> Campanhas -> Mídias)"
                className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[38px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Agrupar por Tipo</span>
              </button>
            )}

            {handleResetSlidesOrder && (
              <button
                type="button"
                onClick={() => {
                  showConfirm(
                    "Restaurar Ordem Padrão",
                    "Deseja restaurar a sequência recomendada original dos slides?",
                    () => {
                      handleResetSlidesOrder();
                      showAlert("Ordem original restaurada", "success");
                    }
                  );
                }}
                title="Restaurar a sequência padrão de fábrica"
                className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[38px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurar Padrão</span>
              </button>
            )}

            {manualSlideOverride ? (
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('manualSlideOverride', null)}
                className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 hover:bg-amber-500/20 transition-all font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[38px]"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                <span>Voltar ao Carrossel Automático</span>
              </button>
            ) : (
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-2 min-h-[32px]">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
                <span>Loop Automático Ativo</span>
              </span>
            )}
          </div>
        </div>

        {/* FERRAMENTAS DE BUSCA E FILTROS DA FILA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
          
          {/* CAMPO DE BUSCA */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar slide na fila por nome ou tipo..."
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 placeholder-zinc-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* BOTÕES DE FILTRO */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? "bg-amber-500 text-black shadow-md font-extrabold"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              }`}
            >
              Todos ({fullSlideList.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('active')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'active'
                  ? "bg-amber-500 text-black shadow-md font-extrabold"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              }`}
            >
              Ativos ({activeSlides.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('disabled')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'disabled'
                  ? "bg-amber-500 text-black shadow-md font-extrabold"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              }`}
            >
              Ocultos ({disabledSlides.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('media')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'media'
                  ? "bg-amber-500 text-black shadow-md font-extrabold"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              }`}
            >
              Mídias ({customMediaList.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterMode === 'agenda'
                  ? "bg-amber-500 text-black shadow-md font-extrabold"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              }`}
            >
              Agendas
            </button>
          </div>
        </div>

        {/* CARDS DOS SLIDES NA FILA */}
        {filteredSlides.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
            <Filter className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
            <p className="font-semibold text-zinc-300">Nenhum slide encontrado com este filtro.</p>
            <p className="text-[11px] text-zinc-500">Tente ajustar o termo de pesquisa ou trocar de categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSlides.map((slideId) => {
              const isActiveInLoop = activeSlides.includes(slideId);
              const isCurrentOnAir = currentSlideId === slideId;
              const isFixedOverride = manualSlideOverride === slideId;
              const isDisabled = disabledSlides.includes(slideId);
              const activeIndexInQueue = activeSlides.indexOf(slideId);
              const { name, desc, category } = getSlideDetails(slideId);

              // Cores das badges por tipo
              const getCategoryBadge = () => {
                switch (category) {
                  case 'agenda':
                  case 'evento':
                    return <span className="bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">Agenda</span>;
                  case 'campanha':
                    return <span className="bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">Campanha</span>;
                  case 'midia':
                    return <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">Mídia Local</span>;
                  default:
                    return <span className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">Slide Fixo</span>;
                }
              };

              return (
                <div
                  key={slideId}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[135px] ${
                    isDisabled
                      ? "bg-zinc-950/40 border-zinc-800/50 opacity-60"
                      : isCurrentOnAir
                        ? "bg-amber-950/25 border-amber-500/90 shadow-[0_4px_25px_rgba(245,158,11,0.18)] ring-1 ring-amber-500/50"
                        : "bg-zinc-950/70 border-zinc-800 hover:bg-zinc-850/80 hover:border-zinc-700"
                  }`}
                >
                  {/* FLAG DE STATUS NO AR OU FIXADO */}
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      {/* POSIÇÃO NA FILA */}
                      {isActiveInLoop ? (
                        <span className="font-mono text-[10px] font-black bg-amber-500/20 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded-md shrink-0">
                          {activeIndexInQueue + 1}º na Fila
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md shrink-0">
                          Oculto do Loop
                        </span>
                      )}

                      {getCategoryBadge()}
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrentOnAir && (
                        <span className="bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                          NO AR
                        </span>
                      )}
                      
                      {isFixedOverride && (
                        <span className="bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded uppercase shrink-0">
                          Fixado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* INFO DO SLIDE */}
                  <div className="pr-2">
                    <h3 className={`font-bold text-sm leading-snug ${isCurrentOnAir ? "text-amber-400" : isDisabled ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                      {name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-normal font-sans line-clamp-1">{desc}</p>
                  </div>

                  {/* CONTROLES E BOTÕES DE REORDENAÇÃO */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 text-zinc-300 text-[11px] font-semibold shrink-0">
                        {getSlideDuration(slideId, customMediaList) / 1000}s
                      </span>

                      {/* TOGGLE VISIBILIDADE / DESATIVAR SLIDE */}
                      {handleToggleDisableSlide && (
                        <button
                          type="button"
                          onClick={() => handleToggleDisableSlide(slideId)}
                          aria-label={isDisabled ? "Ativar slide na fila" : "Ocultar slide da fila"}
                          title={isDisabled ? "Ativar e incluir no loop" : "Ocultar e desativar do loop"}
                          className={`p-1.5 rounded-lg border transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                            isDisabled
                              ? "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                          }`}
                        >
                          {isDisabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* BOTÕES DE DIREÇÃO E PROJEÇÃO */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      
                      {/* BOTÃO PROJETAR DADOS FIXOS */}
                      <button
                        type="button"
                        onClick={() => updateStateAndBroadcast('manualSlideOverride', isFixedOverride ? null : slideId)}
                        title={isFixedOverride ? "Desafixar e voltar ao automático" : "Projetar este slide imediatamente"}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                          isFixedOverride
                            ? "bg-amber-500 border-amber-500 text-black hover:bg-amber-400 font-extrabold"
                            : "bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40"
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span className="hidden sm:inline">{isFixedOverride ? "Desafixar" : "Projetar"}</span>
                      </button>

                      {/* SUBIR AO TOPO */}
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(slideId, 'top')}
                        title="Subir para a 1ª Posição da Fila"
                        className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center active:scale-95 cursor-pointer focus-visible:outline-none"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>

                      {/* SUBIR 1 */}
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(slideId, 'up')}
                        title="Mover para Cima"
                        className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center active:scale-95 cursor-pointer focus-visible:outline-none"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* DESCER 1 */}
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(slideId, 'down')}
                        title="Mover para Baixo"
                        className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center active:scale-95 cursor-pointer focus-visible:outline-none"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* ENVIAR PRO FIM */}
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(slideId, 'bottom')}
                        title="Enviar para o Fim da Fila"
                        className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center active:scale-95 cursor-pointer focus-visible:outline-none"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* GERENCIADOR DE MÍDIAS CUSTOMIZADAS */}
      <section aria-label="Gerenciador de Mídias Customizadas" className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
        {/* CABEÇALHO DA SEÇÃO DE MÍDIAS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider">Central de Mídias & Arquivos Local</h2>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Envio, pré-visualização, enquadramento e renomeação de imagens e vídeos</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* BADGE COM CONTAGEM */}
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0">
              {customMediaList.length} Mídias ({customMediaList.filter(m => m.type === 'image').length} Imagens • {customMediaList.filter(m => m.type === 'video').length} Vídeos)
            </span>

            {/* SELETOR DE MODO DE VISÃO (GRADE X LISTA) */}
            <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMediaViewMode('list')}
                title="Modo de exibição em Lista detalhada"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  mediaViewMode === 'list'
                    ? "bg-amber-500 text-black font-bold shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMediaViewMode('grid')}
                title="Modo de exibição em Grade (Galeria)"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  mediaViewMode === 'grid'
                    ? "bg-amber-500 text-black font-bold shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CONTROLES DE DURAÇÃO PADRÃO & DROPZONE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          
          {/* DROPZONE DE UPLOAD */}
          <div 
            tabIndex={0}
            role="button"
            aria-label="Adicionar arquivos de mídia"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className="lg:col-span-2 relative border-2 border-dashed border-zinc-750 hover:border-amber-500/60 focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl p-4 sm:p-5 transition-all bg-zinc-950/40 text-center group cursor-pointer flex flex-col items-center justify-center min-h-[110px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isUploading}
              aria-label="Upload de imagem ou vídeo"
            />
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full group-hover:scale-110 transition-transform shrink-0">
                <Plus className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-zinc-200">Clique ou arraste Imagens e Vídeos para adicionar</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">PNG, JPG, WEBP, MP4, WEBM (salvo localmente e sincronizado via PeerJS)</p>
              </div>
            </div>
          </div>

          {/* DURAÇÃO PADRÃO NOVAS IMAGENS */}
          <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800 flex flex-col justify-between gap-2">
            <div className="flex items-center gap-1.5 text-zinc-300 text-[11px] font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Duração Padrão (Novas Imagens):</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[5, 8, 10, 15, 20].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleDefaultImgDurationChange(sec)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-extrabold transition-all cursor-pointer ${
                    defaultImgSeconds === sec
                      ? "bg-amber-500 text-black shadow-md"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="flex items-center justify-center gap-2.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl font-medium animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Processando, salvando e enviando arquivo de mídia...</span>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-2 text-red-300 text-xs bg-red-950/40 border border-red-800/50 p-3.5 rounded-xl font-medium">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* FERRAMENTAS DE BUSCA E FILTROS DE MÍDIA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
          
          {/* BUSCA DE MÍDIAS POR NOME */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={mediaSearchTerm}
              onChange={(e) => setMediaSearchTerm(e.target.value)}
              placeholder="Buscar mídia por nome..."
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 placeholder-zinc-500 transition-all"
            />
            {mediaSearchTerm && (
              <button
                type="button"
                onClick={() => setMediaSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTROS DE TIPO */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMediaTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mediaTypeFilter === 'all'
                  ? "bg-amber-500 text-black font-extrabold shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Todas ({customMediaList.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('image')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mediaTypeFilter === 'image'
                  ? "bg-amber-500 text-black font-extrabold shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Imagens
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('video')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mediaTypeFilter === 'video'
                  ? "bg-amber-500 text-black font-extrabold shadow-sm"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Vídeos
            </button>
          </div>
        </div>

        {/* COMPORTAMENTO VÍDEO FIXO */}
        <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-zinc-300 text-[11px] font-bold uppercase tracking-wider">Ação ao Término de Vídeos Fixados:</span>
          <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
            <button
              type="button"
              onClick={() => updateStateAndBroadcast('videoPinBehavior', 'loop')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[36px] ${
                videoPinBehavior === 'loop'
                  ? "bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>Repetir em Loop</span>
            </button>
            <button
              type="button"
              onClick={() => updateStateAndBroadcast('videoPinBehavior', 'unpin')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[36px] ${
                videoPinBehavior === 'unpin'
                  ? "bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
              }`}
            >
              <Minimize className="w-3.5 h-3.5 shrink-0" />
              <span>Desafixar ao Fim</span>
            </button>
          </div>
        </div>

        {/* LISTA OU GRADE DE MÍDIAS LOCAIS */}
        {filteredCustomMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
            <ImageIcon className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
            <p className="font-semibold text-zinc-300">Nenhuma mídia encontrada nesta busca ou categoria.</p>
            <p className="text-[11px] text-zinc-500">Envie novos arquivos acima para utilizá-los no telão.</p>
          </div>
        ) : mediaViewMode === 'grid' ? (
          /* EXIBIÇÃO EM GRADE (GALERIA) */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCustomMedia.map((media, index) => {
              const isSlideActive = currentSlideId === media.id;
              const isSlideOverridden = manualSlideOverride === media.id;
              const isEditing = editingMediaId === media.id;

              return (
                <div
                  key={media.id}
                  className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden relative group ${
                    isSlideActive
                      ? "bg-amber-950/20 border-amber-500/80 shadow-md ring-1 ring-amber-500/40"
                      : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  {/* PREVIEW EM DESTAQUE NA GRADE */}
                  <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center group/img">
                    {media.type === 'video' ? (
                      <video src={media.url} className={`w-full h-full object-${media.fit || 'contain'}`} muted />
                    ) : (
                      <img src={media.url} alt={media.name} className={`w-full h-full object-${media.fit || 'contain'}`} />
                    )}

                    {/* OVERLAY COM BOTÃO DE PRÉ-VISUALIZAR */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => setPreviewMedia(media)}
                        title="Pré-visualizar Mídia em Tela Cheia"
                        className="p-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 font-bold transition-transform hover:scale-105 cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStateAndBroadcast('manualSlideOverride', isSlideOverridden ? null : media.id)}
                        title={isSlideOverridden ? "Desafixar do Telão" : "Projetar no Telão Agora"}
                        className={`p-2 rounded-xl font-bold transition-transform hover:scale-105 cursor-pointer ${
                          isSlideOverridden
                            ? "bg-amber-500 text-black"
                            : "bg-zinc-900 border border-zinc-700 text-amber-400 hover:bg-amber-500/20"
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* BADGES NO TOPO DA MINIATURA */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="bg-black/75 backdrop-blur-md text-[9px] font-black uppercase px-2 py-0.5 rounded text-amber-400 border border-zinc-800">
                        {media.type}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-zinc-200 px-2 py-0.5 rounded border border-zinc-800">
                        {media.duration / 1000}s
                      </span>
                    </div>
                  </div>

                  {/* CONTEÚDO E RENOMEAÇÃO NA GRADE */}
                  <div className="p-3 flex flex-col gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingMediaName}
                          onChange={(e) => setEditingMediaName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(media);
                            if (e.key === 'Escape') setEditingMediaId(null);
                          }}
                          autoFocus
                          className="w-full bg-zinc-900 border border-amber-500 text-zinc-100 text-xs px-2 py-1 rounded focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(media)}
                          className="p-1 bg-amber-500 text-black rounded hover:bg-amber-400 font-bold shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-zinc-100 font-bold text-xs truncate max-w-[140px]" title={media.name}>
                          {media.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleStartRename(media)}
                          title="Renomear mídia"
                          className="text-zinc-500 hover:text-amber-400 p-0.5 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* CONTROLES RÁPIDOS */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-zinc-800/80 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleCycleFit(media)}
                        className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-300 hover:text-white uppercase font-bold"
                      >
                        {media.fit || 'contain'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveMedia(media.id, 'up')}
                          disabled={index === 0}
                          className="p-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 rounded"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMedia(media.id, 'down')}
                          disabled={index === customMediaList.length - 1}
                          className="p-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 rounded"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(media)}
                          className="p-1 bg-zinc-900 border border-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EXIBIÇÃO EM LISTA DETALHADA */
          <div className="flex flex-col gap-3">
            {filteredCustomMedia.map((media, index) => {
              const isSlideActive = currentSlideId === media.id;
              const isSlideOverridden = manualSlideOverride === media.id;
              const isEditing = editingMediaId === media.id;

              return (
                <div
                  key={media.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isSlideActive
                      ? "bg-amber-950/20 border-amber-500/80 shadow-md"
                      : "bg-zinc-950/70 border-zinc-800 hover:bg-zinc-850"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                    {/* PREVIEW DA MÍDIA COM AÇÃO DE PREVIEW EXPANDIDO */}
                    <div 
                      onClick={() => setPreviewMedia(media)}
                      title="Clique para ver o preview em tela cheia"
                      className="w-14 h-14 rounded-lg bg-black border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center relative group cursor-pointer"
                    >
                      {media.type === 'video' ? (
                        <video src={media.url} className={`w-full h-full object-${media.fit || 'contain'}`} muted />
                      ) : (
                        <img src={media.url} alt={media.name} className={`w-full h-full object-${media.fit || 'contain'}`} />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-4 h-4 text-amber-400" />
                      </div>
                    </div>

                    <div className="overflow-hidden flex-1">
                      {/* NOME EDITÁVEL DA MÍDIA */}
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 my-0.5">
                          <input
                            type="text"
                            value={editingMediaName}
                            onChange={(e) => setEditingMediaName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(media);
                              if (e.key === 'Escape') setEditingMediaId(null);
                            }}
                            autoFocus
                            className="bg-zinc-900 border border-amber-500 text-zinc-100 text-xs px-2 py-1 rounded focus:outline-none max-w-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(media)}
                            className="p-1 bg-amber-500 text-black rounded hover:bg-amber-400 font-bold shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-zinc-100 font-bold text-xs truncate max-w-[200px] sm:max-w-xs" title={media.name}>
                            {media.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleStartRename(media)}
                            title="Renomear mídia"
                            className="text-zinc-500 hover:text-amber-400 p-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-amber-400 shrink-0">
                            {media.type}
                          </span>
                        </div>
                      )}

                      {/* AJUSTES RÁPIDOS DE DURAÇÃO, FIT E ÁUDIO */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                        {/* DURAÇÃO */}
                        <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          <span className="text-[10px] uppercase text-zinc-500 font-bold">Duração:</span>
                          <button
                            type="button"
                            onClick={() => handleAdjustDuration(media, -1000)}
                            className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-zinc-200 font-bold">{media.duration / 1000}s</span>
                          <button
                            type="button"
                            onClick={() => handleAdjustDuration(media, 1000)}
                            className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* FIT / MODO DE ENQUADRAMENTO */}
                        <button
                          type="button"
                          onClick={() => handleCycleFit(media)}
                          title="Alternar enquadramento (contain, cover, fill)"
                          className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-300 hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize className="w-3 h-3 text-amber-500" />
                          <span>{media.fit || 'contain'}</span>
                        </button>

                        {/* MUTE (VÍDEO) */}
                        {media.type === 'video' && (
                          <button
                            type="button"
                            onClick={() => handleToggleMute(media)}
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              media.muted
                                ? "bg-red-950/30 border-red-800/40 text-red-400"
                                : "bg-emerald-950/30 border-emerald-800/40 text-emerald-400"
                            }`}
                          >
                            {media.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            <span>{media.muted ? 'Mudo' : 'Com Som'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES DA MÍDIA */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    
                    {/* BOTAO DE PRÉ-VISUALIZAR */}
                    <button
                      type="button"
                      onClick={() => setPreviewMedia(media)}
                      title="Pré-visualizar em Tela Cheia"
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    {/* ENVIAR / PROJETAR */}
                    <button
                      type="button"
                      onClick={() => updateStateAndBroadcast('manualSlideOverride', isSlideOverridden ? null : media.id)}
                      aria-label={isSlideOverridden ? "Desafixar mídia" : "Projetar esta mídia"}
                      title={isSlideOverridden ? "Desafixar mídia do telão" : "Projetar esta mídia imediatamente"}
                      className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        isSlideOverridden
                          ? "bg-amber-500 border-amber-500 text-black hover:bg-amber-400 font-bold"
                          : "bg-zinc-900 border-zinc-800 hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-400"
                      }`}
                    >
                      <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                    
                    {/* MOVER PRA CIMA */}
                    <button
                      type="button"
                      onClick={() => handleMoveMedia(media.id, 'up')}
                      disabled={index === 0}
                      title="Mover mídia para cima na lista"
                      className="w-9 h-9 sm:w-8 sm:h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    {/* MOVER PRA BAIXO */}
                    <button
                      type="button"
                      onClick={() => handleMoveMedia(media.id, 'down')}
                      disabled={index === customMediaList.length - 1}
                      title="Mover mídia para baixo na lista"
                      className="w-9 h-9 sm:w-8 sm:h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    {/* EXCLUIR MÍDIA COM LIMPEZA COMPLETA DA FILA */}
                    <button
                      type="button"
                      aria-label={`Excluir mídia ${media.name}`}
                      title="Excluir mídia permanentemente"
                      onClick={() => handleRemoveMedia(media)}
                      className="w-9 h-9 sm:w-8 sm:h-8 bg-zinc-900 border border-zinc-800 hover:bg-red-950/60 hover:border-red-800/60 text-zinc-400 hover:text-red-400 rounded-lg transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO EXPANDIDA */}
      {previewMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewMedia(null)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] flex flex-col gap-4 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                {previewMedia.type === 'video' ? <Film className="w-5 h-5 text-amber-500" /> : <ImageIcon className="w-5 h-5 text-amber-500" />}
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-100">{previewMedia.name}</h3>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {previewMedia.type.toUpperCase()} • {previewMedia.duration / 1000}s • Enquadramento: {previewMedia.fit || 'contain'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black rounded-xl border border-zinc-800 overflow-hidden flex items-center justify-center min-h-[300px] max-h-[60vh]">
              {previewMedia.type === 'video' ? (
                <video 
                  src={previewMedia.url} 
                  controls 
                  autoPlay 
                  className={`w-full h-full object-${previewMedia.fit || 'contain'}`} 
                />
              ) : (
                <img 
                  src={previewMedia.url} 
                  alt={previewMedia.name} 
                  className={`w-full h-full object-${previewMedia.fit || 'contain'}`} 
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400">Pré-visualização técnica do operador (não afeta o telão ao vivo)</span>
              <button
                type="button"
                onClick={() => {
                  updateStateAndBroadcast('manualSlideOverride', previewMedia.id);
                  setPreviewMedia(null);
                  showAlert(`Mídia "${previewMedia.name}" projetada no telão`, 'success');
                }}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Projetar Agora no Telão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
