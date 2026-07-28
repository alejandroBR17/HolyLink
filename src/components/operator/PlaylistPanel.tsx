import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, RefreshCw, ArrowUp, ArrowDown, Film, Plus, VolumeX, Volume2, 
  Maximize, Zap, Minimize, Minus, Send, Trash2, Image as ImageIcon, AlertTriangle
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
  customMediaList: CustomMedia[];
  getSlideDuration: (id: string, list: CustomMedia[]) => number;
  updateStateAndBroadcast: (key: string, value: any) => void;
  handleMoveSlide: (id: string, direction: 'up' | 'down') => void;
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

export const PlaylistPanel = React.memo(function PlaylistPanel({
  currentSlideId,
  manualSlideOverride,
  activeSlides,
  customMediaList,
  getSlideDuration,
  updateStateAndBroadcast,
  handleMoveSlide,
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

  const getSlideDetails = (slideId: string) => {
    let name = slideId;
    let desc = "";
    if (slideId.startsWith("agenda_day_")) {
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
        desc = "Programação semanal";
      }
    } else if (slideId.startsWith("meeting_event_")) {
      const meetId = slideId.replace("meeting_event_", "");
      const meeting = customMeetings.find(m => m.id === meetId);
      name = meeting ? meeting.theme : "Evento Único";
      desc = meeting ? `Evento: ${meeting.dayName} às ${meeting.time}` : "Programação especial";
    } else if (slideId.startsWith("verse_")) {
      const offset = parseInt(slideId.replace("verse_", ""), 10) || 0;
      name = `Versículo ${offset}`;
      desc = "Leitura de versículo bíblico";
    } else if (slideId.startsWith("custom_")) {
      const media = customMediaList.find(m => m.id === slideId);
      name = media ? media.name : "Mídia Customizada";
      desc = media ? `Mídia: ${media.type === 'image' ? 'Imagem' : 'Vídeo'}` : "Mídia da fila";
    } else {
      switch (slideId) {
        case 'seat': name = "Fique à vontade"; desc = "Procurar assento"; break;
        case 'bathroom': name = "Vá ao banheiro"; desc = "Ir antes de começar"; break;
        case 'phone': name = "Celular no Silencioso"; desc = "Evitar interrupções"; break;
        case 'no_chat': name = "Silêncio / Concentração"; desc = "Desligar de conversas"; break;
        case 'soon': name = "Começa em Instantes"; desc = "Contador curto final"; break;
        case 'social': name = "Redes Sociais"; desc = "@universaljardimosasco"; break;
        case 'donations': name = "Doações / Dízimos"; desc = "QR Code e dados PIX"; break;
        case 'campaigns': name = "Campanhas da Igreja"; desc = "Fogueira Santa e Jejum"; break;
        case 'world_god': name = "Universal pelo Mundo"; desc = "Fotos de templos globais"; break;
      }
    }
    return { name, desc };
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

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      
      {/* SEÇÃO SLIDES */}
      <section aria-label="Playlists de Slides" className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider">Playlists de Slides</h2>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Clique em um slide para fixá-lo imediatamente na projeção</p>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            {manualSlideOverride ? (
              <button
                type="button"
                onClick={() => updateStateAndBroadcast('manualSlideOverride', null)}
                className="w-full sm:w-auto bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[38px]"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                <span>Voltar ao Automático</span>
              </button>
            ) : (
              <span className="w-full sm:w-auto bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center justify-center gap-2 min-h-[32px]">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
                <span>Modo Automático Ativo</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeSlides.map((slideId, idx) => {
            const isActive = currentSlideId === slideId;
            const isOverridden = manualSlideOverride === slideId;
            const { name, desc } = getSlideDetails(slideId);

            return (
              <div
                key={slideId}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Fixar slide: ${name}`}
                onClick={() => updateStateAndBroadcast('manualSlideOverride', slideId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    updateStateAndBroadcast('manualSlideOverride', slideId);
                  }
                }}
                className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[120px] h-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isActive
                    ? "bg-amber-950/20 border-amber-500/80 shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                    : "bg-zinc-950/60 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-2.5 py-1 rounded-bl uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                    No Ar
                  </div>
                )}
                
                <div className="pr-12">
                  <h3 className={`font-bold text-sm leading-snug ${isActive ? "text-amber-400" : "text-zinc-100 group-hover:text-amber-400"}`}>
                    {name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-normal font-sans">{desc}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 text-zinc-300 text-[11px] font-semibold shrink-0">
                      {getSlideDuration(slideId, customMediaList) / 1000}s
                    </span>
                    {isOverridden && (
                      <span className="text-amber-400 font-extrabold uppercase tracking-wider text-[9px] bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md shrink-0">
                        Fixado
                      </span>
                    )}
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1.5 z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(slideId, 'up')}
                      disabled={idx === 0}
                      aria-label={`Mover slide ${name} para cima`}
                      title="Mover para Cima"
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        idx === 0
                          ? "opacity-25 cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600"
                          : "bg-zinc-900 border-zinc-750 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 active:scale-95"
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(slideId, 'down')}
                      disabled={idx === activeSlides.length - 1}
                      aria-label={`Mover slide ${name} para baixo`}
                      title="Mover para Baixo"
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        idx === activeSlides.length - 1
                          ? "opacity-25 cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600"
                          : "bg-zinc-900 border-zinc-750 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 active:scale-95"
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* GERENCIADOR DE IMAGENS E VÍDEOS */}
      <section aria-label="Gerenciador de Mídias Customizadas" className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider">Mídias Customizadas (Fila)</h2>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Imagens e vídeos salvos localmente no navegador</p>
            </div>
          </div>
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
            Armazenamento Local
          </span>
        </div>

        {/* DROPZONE */}
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
          className="relative border-2 border-dashed border-zinc-750 hover:border-amber-500/60 focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl p-5 sm:p-6 transition-all bg-zinc-950/40 text-center group cursor-pointer"
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
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">Clique ou arraste para adicionar Imagens ou Vídeos</p>
              <p className="text-[11px] text-zinc-400 mt-1">Formatos suportados: PNG, JPG, GIF, MP4, WEBM</p>
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="flex items-center justify-center gap-2.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl font-medium animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Processando e salvando arquivo de mídia...</span>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-2 text-red-300 text-xs bg-red-950/40 border border-red-800/50 p-3.5 rounded-xl font-medium">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* COMPORTAMENTO VÍDEO FIXO */}
        <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-zinc-300 text-[11px] font-bold uppercase tracking-wider">Ação de Vídeos Fixados:</span>
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

        {/* LISTA DE MÍDIAS */}
        {customMediaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs text-center py-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
            <ImageIcon className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
            <p className="font-semibold text-zinc-300">Nenhuma imagem ou vídeo adicionado à fila ainda.</p>
            <p className="text-[11px] text-zinc-500">Adicione arquivos acima para projetá-los durante o culto.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {customMediaList.map((media, index) => {
              const isSlideActive = currentSlideId === media.id;
              const isSlideOverridden = manualSlideOverride === media.id;

              return (
                <div
                  key={media.id}
                  className={`p-3.5 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isSlideActive
                      ? "border-amber-500/70 bg-amber-950/10 shadow-[0_2px_12px_rgba(245,158,11,0.08)]"
                      : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-950/80"
                  }`}
                >
                  <div className="flex items-center gap-3.5 w-full md:w-auto min-w-0">
                    {/* Preview / Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 relative border border-zinc-800">
                      <div className="absolute top-0 left-0 bg-amber-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded-br z-10">
                        #{index + 1}
                      </div>
                      {media.type === 'image' ? (
                        <img src={media.url || undefined} className="w-full h-full object-cover" alt={media.name} referrerPolicy="no-referrer" />
                      ) : (
                        <Film className="w-5 h-5 text-amber-400" />
                      )}
                      <div className="absolute bottom-0 right-0 bg-zinc-950/90 px-1 py-0.5 text-[8px] font-bold text-zinc-300 uppercase rounded-tl border-t border-l border-zinc-800">
                        {media.type === 'image' ? 'Img' : 'Vid'}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-zinc-100 truncate" title={media.name}>
                          {media.name}
                        </h3>
                        {isSlideActive && (
                          <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded uppercase shrink-0">
                            No Ar
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {media.type === 'image' ? (
                          <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                            <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">Tempo:</span>
                            <span className="text-[11px] text-amber-400 font-bold font-mono min-w-[3ch] text-center">{media.duration / 1000}s</span>
                            <div className="flex items-center gap-1 border-l border-zinc-800 pl-1.5 ml-0.5">
                              <button
                                type="button"
                                aria-label="Diminuir duração"
                                onClick={() => handleAdjustDuration(media, -1000)}
                                className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                aria-label="Aumentar duração"
                                onClick={() => handleAdjustDuration(media, 1000)}
                                className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 text-[10px] text-zinc-300 font-bold font-mono">
                              🎬 {(media.duration / 1000).toFixed(1)}s
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleMute(media)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                media.muted
                                  ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                              }`}
                            >
                              {media.muted ? (
                                <>
                                  <VolumeX className="w-3 h-3 text-zinc-400" />
                                  <span>Sem Som</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3 text-amber-400" />
                                  <span>Com Som</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Fit Mode */}
                        <button
                          type="button"
                          onClick={() => handleCycleFit(media)}
                          title="Alternar ajuste visual na tela"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                            media.fit === 'cover'
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : media.fit === 'fill'
                              ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {media.fit === 'cover' ? 'Preencher' : media.fit === 'fill' ? 'Esticar' : 'Ajustar'}
                        </button>

                        {/* Enable in automatic loop */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-zinc-300 font-medium select-none bg-zinc-900/60 border border-zinc-800/80 px-2 py-1 rounded-md">
                          <input
                            type="checkbox"
                            checked={media.enabledInLoop}
                            onChange={(e) => handleToggleLoopEnable(media, e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Ciclo Automático</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t border-zinc-800/60 md:border-t-0 pt-3 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleMoveMedia(media.id, 'up')}
                      disabled={index === 0}
                      aria-label={`Mover mídia ${media.name} para cima`}
                      title="Mover para cima"
                      className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        index === 0
                          ? "bg-zinc-950 border-zinc-850 text-zinc-700 cursor-not-allowed opacity-30"
                          : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200 hover:text-white"
                      }`}
                    >
                      <ArrowUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleMoveMedia(media.id, 'down')}
                      disabled={index === customMediaList.length - 1}
                      aria-label={`Mover mídia ${media.name} para baixo`}
                      title="Mover para baixo"
                      className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        index === customMediaList.length - 1
                          ? "bg-zinc-950 border-zinc-850 text-zinc-700 cursor-not-allowed opacity-30"
                          : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200 hover:text-white"
                      }`}
                    >
                      <ArrowDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStateAndBroadcast('manualSlideOverride', isSlideOverridden ? null : media.id)}
                      aria-label={isSlideOverridden ? "Desafixar mídia" : "Projetar esta mídia"}
                      title={isSlideOverridden ? "Desafixar mídia" : "Projetar esta mídia"}
                      className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        isSlideOverridden
                          ? "bg-amber-500 border-amber-500 text-black hover:bg-amber-400 font-bold"
                          : "bg-zinc-900 border-zinc-800 hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-400"
                      }`}
                    >
                      <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                    
                    <button
                      type="button"
                      aria-label={`Excluir mídia ${media.name}`}
                      title="Excluir mídia"
                      onClick={() => {
                        showConfirm(
                          'Excluir Mídia',
                          `Tem certeza que deseja excluir "${media.name}"? Esta ação não pode ser desfeita.`,
                          async () => {
                            if (currentSlideId === media.id || manualSlideOverride === media.id) {
                              updateStateAndBroadcast('manualSlideOverride', null);
                            }
                            await deleteMediaItem(media.id);
                            broadcastMediaDelete(media.id);
                            updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                            showAlert('Mídia excluída com sucesso', 'success');
                          },
                          'danger'
                        );
                      }}
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
    </div>
  );
});

