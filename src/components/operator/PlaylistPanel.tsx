import {RemoteMediaLibrary} from './RemoteMediaLibrary';
import type {MediaManifestItem} from '../../utils/media-manifest';
import {useDialogFocus} from '../../hooks/useDialogFocus';
import {ConsoleGroupTitle} from './ConsoleIntro';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, RefreshCw, ArrowUp, ArrowDown, Film, Plus, VolumeX, Volume2,
  Maximize, Zap, Minimize, Send, Trash2, Image as ImageIcon, AlertTriangle,
  Eye, EyeOff, Search, Layers, ChevronsUp, ChevronsDown, Filter, Sparkles, Check,
  CalendarDays, LayoutGrid, List, Edit3, Maximize2, X, Clock, Pin, Layout
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
  slidesOrder?: string[];
  allAvailableSlides?: string[];
  disabledSlides?: string[];
  customMediaList: CustomMedia[];
  remoteMediaList?:MediaManifestItem[];
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

  finalMinuteDisplayMode?: 'split' | 'full_video';
  verseDisplayPriority?: 'verse_over_video' | 'video_over_verse';
  handleMoveMedia: (id: string, direction: 'up' | 'down') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'info') => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
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
  slidesOrder = [],
  allAvailableSlides = [],
  disabledSlides = [],
  customMediaList,
  remoteMediaList = [],
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

  finalMinuteDisplayMode = 'split',
  verseDisplayPriority = 'verse_over_video',
  handleMoveMedia,
  showConfirm,
  showToast,
  showAlert,
  deleteMediaItem,
  broadcastMediaDelete,
  broadcastMediaSave,
  saveMediaItem,
  customMeetings
}: PlaylistPanelProps) {
  const notify = showToast || showAlert;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLDetailsElement>(null);
  const [filterMode, setFilterMode] = useState<QueueFilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [queueLimit, setQueueLimit] = useState(() => window.innerWidth < 600 ? 5 : 8);
  useEffect(() => setQueueLimit(window.innerWidth < 600 ? 5 : 8), [filterMode, searchTerm]);

  // Estados para a central de gestão de mídias
  const [mediaViewMode, setMediaViewMode] = useState<'list' | 'grid'>('list');
  const [mediaSearchTerm, setMediaSearchTerm] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editingMediaName, setEditingMediaName] = useState('');
  const [previewMedia, setPreviewMedia] = useState<CustomMedia | null>(null);
  const previewDialogRef = useDialogFocus(Boolean(previewMedia), () => setPreviewMedia(null));
  const [defaultImgSeconds, setDefaultImgSeconds] = useState<number>(() => {
    const customDefDur = Number(localStorage.getItem('projection_default_img_duration'));
    return (customDefDur && customDefDur >= 2000) ? Math.round(customDefDur / 1000) : 10;
  });

  useEffect(() => {
    if (uploadError) {
      notify(uploadError, 'error');
    }
  }, [uploadError, notify]);

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
    const available = [...new Set([...activeSlides, ...allAvailableSlides])];
    return [...slidesOrder.filter(id => available.includes(id)), ...available.filter(id => !slidesOrder.includes(id))];
  }, [activeSlides, allAvailableSlides, slidesOrder]);
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [editingBase, setEditingBase] = useState('');
  const orderChangedElsewhere = draftOrder !== null && editingBase !== JSON.stringify(fullSlideList);
  const beginEditing = () => {setDraftOrder([...fullSlideList]); setEditingBase(JSON.stringify(fullSlideList)); setFilterMode('all'); setSearchTerm('');};
  const moveDraft = (id: string, direction: -1 | 1) => setDraftOrder(current => {
    if (!current) return current;
    const index = current.indexOf(id), target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next;
  });
  const applyOrder = () => {
    if (!draftOrder || orderChangedElsewhere) return;
    updateStateAndBroadcast('slidesOrder', JSON.stringify(draftOrder));
    setDraftOrder(null); notify('Ordem aplicada neste operador.', 'success');
  };

  const getSlideDetails = (slideId: string) => {
    let name = slideId;
    let desc = "";
    let category: 'fixo' | 'agenda' | 'campanha' | 'midia' | 'evento' = 'fixo';

    if (slideId.startsWith('verse_')) {
      name = `Versículo ${slideId.split('_')[1] || ''}`;
      desc = 'Texto bíblico da sequência automática';
    } else if (slideId.startsWith("agenda_day_")) {
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
        case 'bathroom': name = "Vá ao banheiro"; desc = "Ir antes do início da reunião"; category = 'fixo'; break;
        case 'phone': name = "Celular no Silencioso"; desc = "Evitar distrações na reunião"; category = 'fixo'; break;
        case 'no_chat': name = "Momento de Concentração"; desc = "Diminuir conversas e focar em Deus"; category = 'fixo'; break;
        case 'soon': name = "Começa em Instantes"; desc = "Contador curto pré-reunião"; category = 'fixo'; break;
        case 'social': name = "Redes Sociais"; desc = "@universaljardimosascooficial"; category = 'fixo'; break;
        case 'donations': name = "Doações / Dízimos"; desc = "QR Code PIX e Dados Bancários"; category = 'fixo'; break;
        case 'campaigns': name = "Campanhas da Igreja"; desc = "Fogueira Santa e propósitos"; category = 'campanha'; break;
        case 'world_god': name = "Desligue-se do Mundo / Deus"; desc = "Transição e foco na presença de Deus"; category = 'fixo'; break;
        case 'baptism': name = "Batismo nas Águas"; desc = "Orientações sobre o batismo após as reuniões"; category = 'fixo'; break;
        case 'blessing': name = "Despedida & Bênção"; desc = "Deus abençoe a sua vida e família (Pós-Reunião)"; category = 'fixo'; break;
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
    <div className="playlist-workspace flex flex-col gap-6 w-full">

      <section className="operator-card sequence-console" aria-labelledby="sequence-title">
        <header className="sequence-heading">
          <div><span className="operator-eyebrow"><Layers size={16}/>Controle da reunião</span><h2 id="sequence-title">Sequência</h2><p>{activeSlides.length} slides ativos · ciclo de {formatTotalTime(totalLoopDuration)}</p></div>
          {!draftOrder ? <div className="sequence-edit-actions"><button className="sequence-secondary" onClick={() => {if (libraryRef.current) libraryRef.current.open = true; fileInputRef.current?.click();}}><Plus size={17}/>Adicionar mídia</button><button className="sequence-secondary" onClick={beginEditing}><Edit3 size={17}/>Editar ordem</button></div> : <div className="sequence-edit-actions"><button className="sequence-secondary" onClick={() => setDraftOrder(null)}>Cancelar</button><button className="sequence-primary" disabled={orderChangedElsewhere || JSON.stringify(draftOrder) === editingBase} onClick={applyOrder}><Check size={17}/>Salvar ordem</button></div>}
        </header>
        <div className="sequence-status"><span className="sequence-status-light"/><span>{manualSlideOverride ? `Fixado: ${getSlideDetails(manualSlideOverride).name}` : 'Sequência automática'}</span>{manualSlideOverride && <button onClick={() => updateStateAndBroadcast('manualSlideOverride', null)}><RefreshCw size={15}/>Retomar</button>}</div>
        {draftOrder ? <p className="sequence-guidance" role="status">{orderChangedElsewhere ? 'A sequência mudou em outro controle. Cancele e abra a edição novamente para usar a versão atual.' : 'Use as setas para mudar a ordem. O telão só recebe a nova ordem quando você salvar.'}</p> : <div className="sequence-tools"><label><Search size={17}/><input aria-label="Buscar na sequência" placeholder="Buscar na sequência" value={searchTerm} onChange={event => setSearchTerm(event.target.value)}/></label><select aria-label="Filtrar sequência" value={filterMode} onChange={event => setFilterMode(event.target.value as QueueFilterMode)}><option value="all">Todos</option><option value="active">Ativos</option><option value="disabled">Ocultos</option><option value="media">Mídias</option><option value="agenda">Agenda</option></select></div>}
        <ol className="sequence-list" aria-label={draftOrder ? 'Editar ordem dos slides' : 'Slides da sequência'}>
          {(draftOrder || filteredSlides.slice(0, queueLimit)).map((slideId, index, list) => {
            const {name, desc, category} = getSlideDetails(slideId);
            const media = customMediaList.find(item => item.id === slideId);
            const Icon = slideId.startsWith('verse_') ? BookOpen : category === 'agenda' || category === 'evento' ? CalendarDays : category === 'midia' ? Film : category === 'campanha' ? Sparkles : Layout;
            const isDisabled = disabledSlides.includes(slideId), isCurrent = currentSlideId === slideId, isFixed = manualSlideOverride === slideId;
            return <li className={`sequence-item ${isCurrent ? 'sequence-item-current' : ''} ${isDisabled ? 'sequence-item-hidden' : ''}`} key={slideId} data-slide-id={slideId}>
              <span className={`sequence-art sequence-art-${category}`} aria-hidden="true">{media?.type === 'image' ? <img src={media.url} alt="" loading="lazy"/> : <Icon size={24}/>}<span className="sequence-position">{draftOrder ? index + 1 : fullSlideList.indexOf(slideId) + 1}</span></span>
              <div className="sequence-item-text"><h3>{name}</h3><p className="sequence-description">{desc}</p><p>{draftOrder ? 'Editando a posição' : `${getSlideDuration(slideId, customMediaList) / 1000}s${isDisabled ? ' · Fora da sequência' : ''}${isCurrent ? ' · Na saída do operador' : ''}`}</p></div>
              <div className="sequence-item-actions">{draftOrder ? <><button disabled={index === 0 || orderChangedElsewhere} aria-label={`Subir ${name}`} onClick={() => moveDraft(slideId, -1)}><ArrowUp size={18}/></button><button disabled={index === list.length - 1 || orderChangedElsewhere} aria-label={`Descer ${name}`} onClick={() => moveDraft(slideId, 1)}><ArrowDown size={18}/></button></> : <>
                {handleToggleDisableSlide && <button aria-label={`${isDisabled ? 'Ativar' : 'Ocultar'} ${name}`} title={isDisabled ? 'Incluir na sequência' : 'Retirar da sequência'} onClick={() => handleToggleDisableSlide(slideId)}>{isDisabled ? <EyeOff size={17}/> : <Eye size={17}/>}</button>}
                <button className={isFixed ? 'sequence-primary' : 'sequence-project'} aria-label={`${isFixed ? 'Desafixar' : 'Projetar'} ${name}`} onClick={() => {if (!isFixed) {updateStateAndBroadcast('customVerseText', null); updateStateAndBroadcast('customVerseRef', null); updateStateAndBroadcast('activeVerseIndex', null);} updateStateAndBroadcast('manualSlideOverride', isFixed ? null : slideId);}}><Send size={16}/><span>{isFixed ? 'Retomar' : 'Projetar'}</span></button>
              </>}</div>
            </li>;
          })}
        </ol>
        {!draftOrder && filteredSlides.length === 0 && <p className="operator-muted">Nenhum slide encontrado. Tente outra busca ou filtro.</p>}
        {!draftOrder && filteredSlides.length > queueLimit && <button className="queue-more" onClick={() => setQueueLimit(queueLimit + 8)}>Mostrar mais slides ({queueLimit} de {filteredSlides.length})</button>}
      </section>

<details ref={libraryRef} open={customMediaList.length > 0 || remoteMediaList.length>0} className="holy-disclosure media-library console-settings-group"><summary><ConsoleGroupTitle icon={Film} title="Biblioteca de mídias" description="Suas imagens e vídeos, com enquadramento, som e duração." badge={`${customMediaList.length} arquivos`}/></summary>
      {/* GERENCIADOR DE MÍDIAS CUSTOMIZADAS */}
      <section aria-label="Gerenciador de Mídias Customizadas" className="relative bg-hl-panel border border-hl-line rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-5 group">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        {/* CABEÇALHO DA SEÇÃO DE MÍDIAS */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hl-line pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-hl-raised border border-hl-line-strong/50 rounded-xl text-hl-gold shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <Film className="w-5 h-5 drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
            </div>
            <div>
              <h2 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider font-sans">Central de Mídias & Arquivos</h2>
              <p className="text-[11px] text-hl-muted font-medium mt-0.5">Envio, enquadramento e gestão de vídeos e imagens</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* BADGE COM CONTAGEM */}
            <span className="bg-hl-gold-well/80 border border-hl-line-strong/50 text-hl-gold text-[10px] font-mono font-bold px-3 py-1.5 rounded uppercase tracking-wider shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              {customMediaList.length} MÍDIAS ({customMediaList.filter(m => m.type === 'image').length} IMG • {customMediaList.filter(m => m.type === 'video').length} VID)
            </span>

            {/* SELETOR DE MODO DE VISÃO (GRADE X LISTA) */}
            <div className="bg-hl-canvas p-1 rounded-xl border border-hl-line-soft flex items-center gap-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
              <button
                type="button"
                onClick={() => setMediaViewMode('list')}
                title="Modo de exibição em Lista detalhada"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  mediaViewMode === 'list'
                    ? "bg-hl-gold text-black font-bold shadow-[0_0_10px_rgba(255,211,79,0.5)]"
                    : "text-hl-muted hover:text-hl-soft"
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
                    ? "bg-hl-gold text-black font-bold shadow-[0_0_10px_rgba(255,211,79,0.5)]"
                    : "text-hl-muted hover:text-hl-soft"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <RemoteMediaLibrary items={remoteMediaList.filter(item=>!customMediaList.some(local=>local.id===item.id || item.sourceIds?.includes(local.id)))} showConfirm={showConfirm} notify={notify}/>
        {/* CONTROLES DE DURAÇÃO PADRÃO & DROPZONE */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-3">

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
            className="lg:col-span-2 relative border-2 border-dashed border-hl-line hover:border-hl-gold/60 focus-visible:border-hl-gold focus-visible:outline-none rounded-2xl p-4 sm:p-5 transition-all bg-hl-canvas text-center group cursor-pointer flex flex-col items-center justify-center min-h-[110px] shadow-[inset_0_2px_10px_rgba(0,0,0,1)]"
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
              <div className="p-2.5 bg-hl-raised border border-hl-line-strong/50 rounded-xl group-hover:scale-105 transition-transform shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                <Plus className="w-5 h-5 text-hl-gold drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-sans font-bold text-hl-copy">Clique ou arraste Imagens e Vídeos para adicionar</p>
                <p className="text-[11px] text-hl-muted mt-0.5">PNG, JPG, WEBP, MP4, WEBM (salvo localmente e sincronizado via PeerJS)</p>
              </div>
            </div>
          </div>

          {/* DURAÇÃO PADRÃO NOVAS IMAGENS */}
          <div className="bg-hl-canvas p-3.5 rounded-2xl border border-hl-line-soft flex flex-col justify-between gap-2 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-1.5 text-hl-soft text-[11px] font-sans font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-hl-gold shrink-0" />
              <span>Duração Padrão (Imagens):</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[5, 8, 10, 15, 20].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleDefaultImgDurationChange(sec)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    defaultImgSeconds === sec
                      ? "bg-hl-gold text-black shadow-[0_0_10px_rgba(255,211,79,0.5)] font-black"
                      : "bg-hl-raised border border-hl-line-soft text-hl-muted hover:text-white"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="flex items-center justify-center gap-2.5 text-xs text-hl-gold-bright bg-hl-gold/10 border border-hl-gold/20 p-3.5 rounded-xl font-medium animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-hl-gold-bright" />
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-hl-canvas/60 p-2.5 rounded-xl border border-hl-line/80">

          {/* BUSCA DE MÍDIAS POR NOME */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-hl-dim absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={mediaSearchTerm}
              onChange={(e) => setMediaSearchTerm(e.target.value)}
              placeholder="Buscar mídia por nome..."
              className="w-full bg-hl-panel border border-hl-line text-hl-copy text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-hl-gold placeholder-zinc-500 transition-all"
            />
            {mediaSearchTerm && (
              <button
                type="button"
                onClick={() => setMediaSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-hl-dim hover:text-hl-soft text-xs font-bold px-1 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
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
                  ? "bg-hl-gold text-black font-extrabold shadow-sm"
                  : "bg-hl-panel border border-hl-line text-hl-muted hover:text-hl-soft"
              }`}
            >
              Todas ({customMediaList.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('image')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mediaTypeFilter === 'image'
                  ? "bg-hl-gold text-black font-extrabold shadow-sm"
                  : "bg-hl-panel border border-hl-line text-hl-muted hover:text-hl-soft"
              }`}
            >
              Imagens
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('video')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mediaTypeFilter === 'video'
                  ? "bg-hl-gold text-black font-extrabold shadow-sm"
                  : "bg-hl-panel border border-hl-line text-hl-muted hover:text-hl-soft"
              }`}
            >
              Vídeos
            </button>
          </div>
        </div>

<details className="holy-disclosure"><summary>Comportamento de vídeos e textos</summary><div>
        {/* COMPORTAMENTO VÍDEO FIXO */}
        <div className="bg-hl-canvas/70 p-3 rounded-xl border border-hl-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-hl-soft text-[11px] font-bold uppercase tracking-wider">Ação ao Término de Vídeos Fixados:</span>
          <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
            <button
              type="button"
              onClick={() => updateStateAndBroadcast('videoPinBehavior', 'loop')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold min-h-[36px] ${
                videoPinBehavior === 'loop'
                  ? "bg-hl-gold text-black font-extrabold shadow-md shadow-amber-500/20"
                  : "bg-hl-panel border border-hl-line hover:border-hl-line text-hl-soft hover:text-white"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>Repetir em Loop</span>
            </button>
            <button
              type="button"
              onClick={() => updateStateAndBroadcast('videoPinBehavior', 'unpin')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold min-h-[36px] ${
                videoPinBehavior === 'unpin'
                  ? "bg-hl-gold text-black font-extrabold shadow-md shadow-amber-500/20"
                  : "bg-hl-panel border border-hl-line hover:border-hl-line text-hl-soft hover:text-white"
              }`}
            >
              <Minimize className="w-3.5 h-3.5 shrink-0" />
              <span>Desafixar ao Fim</span>
            </button>
          </div>
        </div>

        {/* MODO DOS 60 SEGUNDOS FINAIS */}
        <div className="bg-hl-canvas/70 p-3 rounded-xl border border-hl-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-hl-soft text-[11px] font-bold uppercase tracking-wider">Últimos 60s (Vídeo em Reprodução):</span>
            <span className="text-hl-dim text-[10px] font-normal">Exibir dividindo tela ou apenas o vídeo</span>
          </div>
          <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
            <button
              type="button"
              onClick={() => updateStateAndBroadcast('finalMinuteDisplayMode', 'split')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold min-h-[36px] ${
                finalMinuteDisplayMode === 'split'
                  ? "bg-hl-gold text-black font-extrabold shadow-md shadow-amber-500/20"
                  : "bg-hl-panel border border-hl-line hover:border-hl-line text-hl-soft hover:text-white"
              }`}
              title="Exibe a contagem de 60s em um lado e o vídeo rodando ao lado"
            >
              <Layout className="w-3.5 h-3.5 shrink-0" />
              <span>Dividido (60s + Vídeo)</span>
            </button>
            <button
              type="button"
              onClick={() => updateStateAndBroadcast('finalMinuteDisplayMode', 'full_video')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold min-h-[36px] ${
                finalMinuteDisplayMode === 'full_video'
                  ? "bg-hl-gold text-black font-extrabold shadow-md shadow-amber-500/20"
                  : "bg-hl-panel border border-hl-line hover:border-hl-line text-hl-soft hover:text-white"
              }`}
              title="Mantém o vídeo em tela cheia ignorando o cronômetro do último minuto"
            >
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>Apenas Vídeo</span>
            </button>
          </div>
        </div>

        {/* PRIORIDADE QUANDO VERSÍCULO É EXIBIDO */}
        <div className="bg-hl-canvas/70 p-3 rounded-xl border border-hl-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-hl-soft text-[11px] font-bold uppercase tracking-wider">Versículos Durante o Cronômetro:</span>
            <span className="text-hl-dim text-[10px] font-normal">Prioridade de exibição se um versículo for clicado</span>
          </div>
          <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
            <button
              type="button"
              onClick={() => updateStateAndBroadcast('verseDisplayPriority', 'verse_over_video')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold min-h-[36px] ${
                verseDisplayPriority === 'verse_over_video'
                  ? "bg-hl-gold text-black font-extrabold shadow-md shadow-amber-500/20"
                  : "bg-hl-panel border border-hl-line hover:border-hl-line text-hl-soft hover:text-white"
              }`}
              title="Aparece sobre o vídeo/cronômetro se selecionado"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Sobrepõe Vídeo</span>
            </button>
            <button
              type="button"
              onClick={() => updateStateAndBroadcast('verseDisplayPriority', 'video_over_verse')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold min-h-[36px] ${
                verseDisplayPriority === 'video_over_verse'
                  ? "bg-hl-gold text-black font-extrabold shadow-md shadow-amber-500/20"
                  : "bg-hl-panel border border-hl-line hover:border-hl-line text-hl-soft hover:text-white"
              }`}
              title="Aparece apenas após o término do cronômetro"
            >
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span>Apenas Após Contagem</span>
            </button>
          </div>
        </div>

</div></details>
        {/* LISTA OU GRADE DE MÍDIAS LOCAIS */}
        {filteredCustomMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-hl-muted text-xs text-center py-10 border border-dashed border-hl-line rounded-xl bg-hl-canvas/30">
            <ImageIcon className="w-8 h-8 text-hl-dim stroke-[1.5]" />
            <p className="font-semibold text-hl-soft">Nenhuma mídia encontrada nesta busca ou categoria.</p>
            <p className="text-[11px] text-hl-dim">Envie novos arquivos acima para utilizá-los no telão.</p>
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
                      ? "bg-hl-gold-well/20 border-hl-gold/80 shadow-md ring-1 ring-hl-gold/40"
                      : "bg-hl-canvas/80 border-hl-line hover:border-hl-line hover:bg-hl-panel"
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
                        className="p-2 rounded-xl bg-hl-gold text-black hover:bg-hl-gold-bright font-bold transition-transform hover:scale-105 cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStateAndBroadcast('manualSlideOverride', isSlideOverridden ? null : media.id)}
                        title={isSlideOverridden ? "Desafixar do Telão" : "Projetar no Telão Agora"}
                        className={`p-2 rounded-xl font-bold transition-transform hover:scale-105 cursor-pointer ${
                          isSlideOverridden
                            ? "bg-hl-gold text-black"
                            : "bg-hl-panel border border-hl-line text-hl-gold-bright hover:bg-hl-gold/20"
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* BADGES NO TOPO DA MINIATURA */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="bg-black/75 backdrop-blur-md text-[9px] font-black uppercase px-2 py-0.5 rounded text-hl-gold-bright border border-hl-line">
                        {media.type}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span className="bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-hl-soft px-2 py-0.5 rounded border border-hl-line">
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
                          className="w-full bg-hl-panel border border-hl-gold text-hl-copy text-xs px-2 py-1 rounded focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(media)}
                          className="p-1 bg-hl-gold text-black rounded hover:bg-hl-gold-bright font-bold shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-hl-copy font-bold text-xs truncate max-w-[140px]" title={media.name}>
                          {media.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleStartRename(media)}
                          title="Renomear mídia"
                          className="text-hl-dim hover:text-hl-gold-bright p-0.5 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* CONTROLES RÁPIDOS */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-hl-line/80 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleCycleFit(media)}
                        className="bg-hl-panel border border-hl-line px-2 py-1 rounded text-hl-soft hover:text-white uppercase font-bold"
                      >
                        {media.fit || 'contain'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveMedia(media.id, 'up')}
                          disabled={index === 0}
                          className="p-1 bg-hl-panel border border-hl-line hover:bg-hl-raised disabled:opacity-30 text-hl-soft rounded"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMedia(media.id, 'down')}
                          disabled={index === customMediaList.length - 1}
                          className="p-1 bg-hl-panel border border-hl-line hover:bg-hl-raised disabled:opacity-30 text-hl-soft rounded"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(media)}
                          className="p-1 bg-hl-panel border border-hl-line hover:bg-red-950 hover:text-red-400 text-hl-muted rounded"
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
                      ? "bg-hl-gold-well/20 border-hl-gold/80 shadow-md"
                      : "bg-hl-canvas/70 border-hl-line hover:bg-hl-raised"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                    {/* PREVIEW DA MÍDIA COM AÇÃO DE PREVIEW EXPANDIDO */}
                    <div
                      onClick={() => setPreviewMedia(media)}
                      title="Clique para ver o preview em tela cheia"
                      className="w-14 h-14 rounded-lg bg-black border border-hl-line overflow-hidden shrink-0 flex items-center justify-center relative group cursor-pointer"
                    >
                      {media.type === 'video' ? (
                        <video src={media.url} className={`w-full h-full object-${media.fit || 'contain'}`} muted />
                      ) : (
                        <img src={media.url} alt={media.name} className={`w-full h-full object-${media.fit || 'contain'}`} />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-4 h-4 text-hl-gold-bright" />
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
                            className="bg-hl-panel border border-hl-gold text-hl-copy text-xs px-2 py-1 rounded focus:outline-none max-w-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(media)}
                            className="p-1 bg-hl-gold text-black rounded hover:bg-hl-gold-bright font-bold shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-hl-copy font-bold text-xs truncate max-w-[200px] sm:max-w-xs" title={media.name}>
                            {media.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleStartRename(media)}
                            title="Renomear mídia"
                            className="text-hl-dim hover:text-hl-gold-bright p-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-hl-panel border border-hl-line rounded text-hl-gold-bright shrink-0">
                            {media.type}
                          </span>
                        </div>
                      )}

                      {/* AJUSTES RÁPIDOS DE DURAÇÃO, FIT E ÁUDIO */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-hl-muted">
                        {/* DURAÇÃO */}
                        {media.type === 'video' ? (
                          <div
                            className="flex items-center gap-1 bg-hl-panel px-2 py-0.5 rounded border border-hl-line text-[10px] text-hl-muted font-bold"
                            title="O carrossel avança automaticamente assim que o vídeo termina de tocar"
                          >
                            <Clock className="w-3 h-3 text-hl-gold" />
                            <span>Duração Nativa (Auto)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-hl-panel px-2 py-0.5 rounded border border-hl-line" title="Tempo em segundos que esta imagem permanece na tela no carrossel automático">
                            <span className="text-[10px] uppercase text-hl-dim font-bold">Tempo:</span>
                            <button
                              type="button"
                              onClick={() => handleAdjustDuration(media, -1000)}
                              className="w-4 h-4 rounded bg-hl-raised hover:bg-hl-raised text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono text-hl-soft font-bold">{media.duration / 1000}s</span>
                            <button
                              type="button"
                              onClick={() => handleAdjustDuration(media, 1000)}
                              className="w-4 h-4 rounded bg-hl-raised hover:bg-hl-raised text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {/* FIT / MODO DE ENQUADRAMENTO */}
                        <button
                          type="button"
                          onClick={() => handleCycleFit(media)}
                          title="Alternar enquadramento (contain, cover, fill)"
                          className="bg-hl-panel border border-hl-line px-2 py-0.5 rounded text-[10px] font-bold text-hl-soft hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize className="w-3 h-3 text-hl-gold" />
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
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-hl-line bg-hl-panel text-hl-soft hover:bg-hl-raised hover:text-white transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    {/* ENVIAR / PROJETAR */}
                    <button
                      type="button"
                      onClick={() => updateStateAndBroadcast('manualSlideOverride', isSlideOverridden ? null : media.id)}
                      aria-label={isSlideOverridden ? "Desafixar mídia" : "Projetar esta mídia"}
                      title={isSlideOverridden ? "Desafixar mídia do telão" : "Projetar esta mídia imediatamente"}
                      className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hl-gold ${
                        isSlideOverridden
                          ? "bg-hl-gold border-hl-gold text-black hover:bg-hl-gold-bright font-bold"
                          : "bg-hl-panel border-hl-line hover:bg-hl-gold/20 hover:border-hl-gold/40 text-hl-gold-bright"
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
                      className="w-9 h-9 sm:w-8 sm:h-8 bg-hl-panel border border-hl-line hover:bg-hl-raised disabled:opacity-30 text-hl-soft rounded-lg transition-all flex items-center justify-center cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    {/* MOVER PRA BAIXO */}
                    <button
                      type="button"
                      onClick={() => handleMoveMedia(media.id, 'down')}
                      disabled={index === customMediaList.length - 1}
                      title="Mover mídia para baixo na lista"
                      className="w-9 h-9 sm:w-8 sm:h-8 bg-hl-panel border border-hl-line hover:bg-hl-raised disabled:opacity-30 text-hl-soft rounded-lg transition-all flex items-center justify-center cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    {/* EXCLUIR MÍDIA COM LIMPEZA COMPLETA DA FILA */}
                    <button
                      type="button"
                      aria-label={`Excluir mídia ${media.name}`}
                      title="Excluir mídia permanentemente"
                      onClick={() => handleRemoveMedia(media)}
                      className="w-9 h-9 sm:w-8 sm:h-8 bg-hl-panel border border-hl-line hover:bg-red-950/60 hover:border-red-800/60 text-hl-muted hover:text-red-400 rounded-lg transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section></details>


      {/* MODAL DE PRÉ-VISUALIZAÇÃO EXPANDIDA */}
      {previewMedia && (
        <div
          className="holy-theme holy-overlay fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            ref={previewDialogRef} role="dialog" aria-modal="true" aria-label="Prévia da mídia" tabIndex={-1} className="holy-dialog bg-hl-panel border border-hl-line rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] flex flex-col gap-4 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hl-line pb-3">
              <div className="flex items-center gap-2">
                {previewMedia.type === 'video' ? <Film className="w-5 h-5 text-hl-gold" /> : <ImageIcon className="w-5 h-5 text-hl-gold" />}
                <div>
                  <h3 className="font-extrabold text-sm text-hl-copy">{previewMedia.name}</h3>
                  <span className="text-[10px] text-hl-muted font-mono">
                    {previewMedia.type.toUpperCase()} • {previewMedia.duration / 1000}s • Enquadramento: {previewMedia.fit || 'contain'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                aria-label="Fechar prévia" className="p-2 rounded-xl bg-hl-raised hover:bg-hl-raised text-hl-soft hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-hl-canvas rounded-xl border border-hl-line/80 overflow-hidden flex items-center justify-center p-3 min-h-[300px] max-h-[60vh] relative shadow-inner">
              {previewMedia.type === 'video' ? (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[58vh] object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.name}
                  className="max-w-full max-h-[58vh] object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-hl-line/80">
              <span className="text-xs text-hl-muted">Pré-visualização técnica do operador (não afeta o telão ao vivo)</span>
              <button
                type="button"
                onClick={() => {
                  updateStateAndBroadcast('customVerseText', null);
                  updateStateAndBroadcast('customVerseRef', null);
                  updateStateAndBroadcast('activeVerseIndex', null);
                  updateStateAndBroadcast('manualSlideOverride', previewMedia.id);
                  setPreviewMedia(null);
                  showAlert(`Mídia "${previewMedia.name}" enviada. Confira o telão.`, 'success');
                }}
                className="w-full sm:w-auto bg-hl-gold hover:bg-hl-gold-bright text-black font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
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
