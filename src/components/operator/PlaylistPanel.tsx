import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, RefreshCw, ArrowUp, ArrowDown, Film, Plus, VolumeX, Volume2, 
  Maximize, Zap, Minimize, Minus, Send, Trash2 
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
    // Cycle: contain -> cover -> fill -> contain
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
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/50 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Playlists de Slides</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Clique em um slide para fixá-lo na projeção</p>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            {manualSlideOverride ? (
              <button
                onClick={() => updateStateAndBroadcast('manualSlideOverride', null)}
                className="w-full sm:w-auto bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-amber-500/20 transition-all font-bold cursor-pointer animate-pulse whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Voltar ao Automático
              </button>
            ) : (
              <span className="w-full sm:w-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                Modo Automático Ativo
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
          {activeSlides.map((slideId, idx) => {
            const isActive = currentSlideId === slideId;
            const isOverridden = manualSlideOverride === slideId;
            const { name, desc } = getSlideDetails(slideId);

            return (
              <div
                key={slideId}
                onClick={() => updateStateAndBroadcast('manualSlideOverride', slideId)}
                className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[125px] h-auto ${
                  isActive
                    ? "bg-zinc-800/40 border-amber-500/60 shadow-[0_4px_20px_rgba(245,158,11,0.1)]"
                    : "bg-zinc-950/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-2.5 py-1 rounded-bl uppercase tracking-wider">
                    No Ar
                  </div>
                )}
                
                <div>
                  <h4 className={`font-bold text-sm ${isActive ? "text-amber-400" : "text-zinc-200 group-hover:text-amber-500/80"}`}>
                    {name}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-normal font-sans">{desc}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800 text-zinc-400 text-[10px] shrink-0">
                      {getSlideDuration(slideId, customMediaList) / 1000}s
                    </span>
                    {isOverridden && (
                      <span className="text-amber-500 font-bold uppercase tracking-wider text-[9px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">
                        Fixo
                      </span>
                    )}
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1.5 z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMoveSlide(slideId, 'up')}
                      disabled={idx === 0}
                      title="Mover para Cima"
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        idx === 0
                          ? "opacity-25 cursor-not-allowed border-zinc-850 bg-zinc-950/20 text-zinc-600"
                          : "bg-zinc-900 border-zinc-850 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 active:scale-90"
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveSlide(slideId, 'down')}
                      disabled={idx === activeSlides.length - 1}
                      title="Mover para Baixo"
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        idx === activeSlides.length - 1
                          ? "opacity-25 cursor-not-allowed border-zinc-850 bg-zinc-950/20 text-zinc-600"
                          : "bg-zinc-900 border-zinc-850 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 active:scale-90"
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
      </div>

      {/* GERENCIADOR DE IMAGENS E VÍDEOS */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Mídias Customizadas (Fila)</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Imagens ou vídeos armazenados localmente</p>
            </div>
          </div>
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            IndexedDB Ativo
          </span>
        </div>

        {/* DROPZONE */}
        <div className="relative border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-6 transition-all bg-zinc-950/25 text-center group cursor-pointer">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isUploading}
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <Plus className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-bold text-zinc-200">Clique ou arraste para adicionar Imagem ou Vídeo</p>
              <p className="text-[10px] text-zinc-500 mt-1">Formatos suportados: PNG, JPG, MP4</p>
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="flex items-center justify-center gap-2.5 text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Processando e salvando arquivo de mídia...</span>
          </div>
        )}

        {uploadError && (
          <div className="text-red-400 text-[11px] leading-tight bg-red-950/20 border border-red-900/30 p-3.5 rounded-xl">
            {uploadError}
          </div>
        )}

        {/* COMPORTAMENTO VÍDEO FIXO */}
        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Ação de Vídeos Fixados:</span>
          <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
            <button
              onClick={() => updateStateAndBroadcast('videoPinBehavior', 'loop')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                videoPinBehavior === 'loop'
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/15"
                  : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Repetir em Loop
            </button>
            <button
              onClick={() => updateStateAndBroadcast('videoPinBehavior', 'unpin')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                videoPinBehavior === 'unpin'
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/15"
                  : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              <Minimize className="w-3.5 h-3.5" />
              Desafixar ao Fim
            </button>
          </div>
        </div>

        {/* LISTA DE MÍDIAS */}
        {customMediaList.length === 0 ? (
          <div className="text-zinc-500 text-xs text-center py-6 border border-dashed border-zinc-800/60 rounded-xl bg-zinc-950/20 italic">
            Nenhuma imagem ou vídeo adicionado à fila ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-3 pr-1">
            {customMediaList.map((media, index) => {
              const isSlideActive = currentSlideId === media.id;
              const isSlideOverridden = manualSlideOverride === media.id;

              return (
                <div
                  key={media.id}
                  className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/35 transition-colors ${
                    isSlideActive
                      ? "border-amber-500/40 bg-zinc-900/60 shadow-[0_2px_12px_rgba(245,158,11,0.04)]"
                      : "border-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
                    {/* Preview / Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-zinc-950 flex items-center justify-center overflow-hidden flex-shrink-0 relative border border-zinc-800">
                      <div className="absolute top-0 left-0 bg-amber-500 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded-br z-10">
                        #{index + 1}
                      </div>
                      {media.type === 'image' ? (
                        <img src={media.url || null} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <Film className="w-5 h-5 text-amber-500" />
                      )}
                      <div className="absolute bottom-0 right-0 bg-zinc-950/80 px-1 py-0.5 text-[8px] font-bold text-zinc-500 uppercase rounded-tl border-t border-l border-zinc-800">
                        {media.type === 'image' ? 'Img' : 'Vid'}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-xs font-bold text-zinc-200 truncate" title={media.name}>
                        {media.name}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                        {media.type === 'image' ? (
                          <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded border border-zinc-800/60">
                            <span className="text-[10px] text-zinc-500 hidden sm:inline">Tempo:</span>
                            <span className="text-[10px] text-amber-400 font-bold font-mono min-w-[3ch] text-center">{media.duration / 1000}s</span>
                            <div className="flex items-center gap-0.5 border-l border-zinc-800 pl-1.5 ml-0.5">
                              <button
                                onClick={() => handleAdjustDuration(media, -1000)}
                                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center justify-center text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleAdjustDuration(media, 1000)}
                                className="w-5 h-5 bg-zinc-800 hover:bg-zinc-700 rounded flex items-center justify-center text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800 text-[10px] text-zinc-400 font-medium font-mono">
                              🎬 {(media.duration / 1000).toFixed(1)}s
                            </div>
                            <button
                              onClick={() => handleToggleMute(media)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                                media.muted
                                  ? "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                  : "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                              }`}
                            >
                              {media.muted ? (
                                <>
                                  <VolumeX className="w-2.5 h-2.5" />
                                  <span>Sem Som</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-2.5 h-2.5" />
                                  <span>Com Som</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Fit Mode */}
                        <button
                          onClick={() => handleCycleFit(media)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                            media.fit === 'cover'
                              ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
                              : media.fit === 'fill'
                              ? "bg-zinc-100/10 border-zinc-100/20 text-zinc-200"
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {media.fit === 'cover' ? 'Preencher' : media.fit === 'fill' ? 'Esticar' : 'Ajustar'}
                        </button>

                        {/* Enable in automatic loop */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-zinc-500 select-none">
                          <input
                            type="checkbox"
                            checked={media.enabledInLoop}
                            onChange={(e) => handleToggleLoopEnable(media, e.target.checked)}
                            className="rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-0 w-3 h-3 cursor-pointer"
                          />
                          <span>Ciclo Automático</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 w-full md:w-auto justify-end border-t border-zinc-800/40 md:border-t-0 pt-3 md:pt-0">
                    <button
                      onClick={() => handleMoveMedia(media.id, 'up')}
                      disabled={index === 0}
                      className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                        index === 0
                          ? "bg-zinc-900/20 border-zinc-850 text-zinc-700 cursor-not-allowed opacity-30"
                          : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      onClick={() => handleMoveMedia(media.id, 'down')}
                      disabled={index === customMediaList.length - 1}
                      className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                        index === customMediaList.length - 1
                          ? "bg-zinc-900/20 border-zinc-850 text-zinc-700 cursor-not-allowed opacity-30"
                          : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => updateStateAndBroadcast('manualSlideOverride', isSlideOverridden ? null : media.id)}
                      className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                        isSlideOverridden
                          ? "bg-amber-500 border-amber-500 text-black hover:bg-amber-600"
                          : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-amber-500"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
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
                      className="w-8 h-8 bg-zinc-900 border border-zinc-800 hover:bg-red-950/40 text-zinc-500 hover:text-red-500 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
