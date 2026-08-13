import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CalendarDays, Plus, X, ArrowDown, Edit2, Trash2, Globe, Flame, WifiOff, RefreshCw, AlertTriangle, Sparkles, Copy, Zap, Check
} from 'lucide-react';
import { Meeting } from '../../types';

interface Campaign {
  id: string;
  title: string;
  duration: string;
  iconType: 'flame' | 'wifi_off' | 'globe' | 'faith';
  endDate?: string; // Optional automatic hide limit
}

interface AgendaPanelProps {
  customMeetings: Meeting[];
  customCampaigns: Campaign[];
  updateStateAndBroadcast: (key: string, value: any) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'info') => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  showAlert?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onResetCampaigns?: () => void;
}

const DEFAULT_MEETING_PRESETS = [
  { theme: "Santo Culto do Domingo", day: 0, dayName: "Domingo", time: "18:00", hours: 18, minutes: 0 },
  { theme: "Prosperidade com Deus", day: 1, dayName: "Segunda-feira", time: "19:30", hours: 19, minutes: 30 },
  { theme: "Escola da Fé & Salvação", day: 3, dayName: "Quarta-feira", time: "19:30", hours: 19, minutes: 30 },
  { theme: "Nação dos Casais & Família", day: 4, dayName: "Quinta-feira", time: "19:30", hours: 19, minutes: 30 },
  { theme: "Corrente de Libertação & Cura", day: 5, dayName: "Sexta-feira", time: "19:30", hours: 19, minutes: 30 },
  { theme: "Encontro Força Jovem (FJU)", day: 6, dayName: "Sábado", time: "16:00", hours: 16, minutes: 0 },
];

const DEFAULT_CAMPAIGN_PRESETS: Array<{ title: string; duration: string; iconType: 'flame' | 'wifi_off' | 'globe' | 'faith' }> = [
  { title: "Jejum de Daniel", duration: "21 Dias de Desconexão", iconType: "wifi_off" },
  { title: "Fogueira Santa de Israel", duration: "Propósito no Altar", iconType: "flame" },
  { title: "7 Domingos da Família", duration: "Oração pela Família", iconType: "faith" },
  { title: "Clamor Evangelístico", duration: "Salvação de Almas", iconType: "globe" },
];

export const AgendaPanel = React.memo(function AgendaPanel({
  customMeetings,
  customCampaigns,
  updateStateAndBroadcast,
  showConfirm,
  showToast,
  showAlert,
  onResetCampaigns
}: AgendaPanelProps) {
  const notify = showToast || showAlert;
  const [newMeetTheme, setNewMeetTheme] = useState('');
  const [newMeetType, setNewMeetType] = useState<'weekly' | 'one_time'>('weekly');
  const [newMeetWeeklyDay, setNewMeetWeeklyDay] = useState(0);
  const [newMeetDate, setNewMeetDate] = useState('');
  const [newMeetTime, setNewMeetTime] = useState('19:30');
  const [showAddMeetingForm, setShowAddMeetingForm] = useState(false);
  const [editingMeetId, setEditingMeetId] = useState<string | null>(null);

  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampDuration, setNewCampDuration] = useState('');
  const [newCampType, setNewCampType] = useState<'flame' | 'wifi_off' | 'globe' | 'faith'>('flame');
  const [newCampEndDate, setNewCampEndDate] = useState('');
  const [showAddCampaignForm, setShowAddCampaignForm] = useState(false);
  const [editingCampId, setEditingCampId] = useState<string | null>(null);

  const [isMeetingPanelOpen, setIsMeetingPanelOpen] = useState(false);
  const [isCampaignPanelOpen, setIsCampaignPanelOpen] = useState(false);

  const daysMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  // Current local date YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const expiredMeetings = (customMeetings || []).filter(m => m.date && m.date < todayStr);

  const handleClearExpiredMeetings = () => {
    if (expiredMeetings.length === 0) return;
    if (showConfirm) {
      showConfirm(
        'Limpar Eventos Passados?',
        `Deseja remover ${expiredMeetings.length} evento(s) pontual(is) cuja data já passou?`,
        () => {
          const updated = (customMeetings || []).filter(m => !(m.date && m.date < todayStr));
          updateStateAndBroadcast('customMeetings', updated);
        },
        'info'
      );
    } else {
      const updated = (customMeetings || []).filter(m => !(m.date && m.date < todayStr));
      updateStateAndBroadcast('customMeetings', updated);
    }
  };

  const handleAddMeetingPreset = (preset: typeof DEFAULT_MEETING_PRESETS[0]) => {
    const newM: Meeting = {
      id: `meet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      day: preset.day,
      dayName: preset.dayName,
      theme: preset.theme,
      time: preset.time,
      hours: preset.hours,
      minutes: preset.minutes
    };
    const updated = [...(customMeetings || []), newM];
    updateStateAndBroadcast('customMeetings', updated);
  };

  const handleDuplicateMeeting = (m: Meeting) => {
    const newM: Meeting = {
      ...m,
      id: `meet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      theme: `${m.theme} (Cópia)`
    };
    const updated = [...(customMeetings || []), newM];
    updateStateAndBroadcast('customMeetings', updated);
  };

  const handleAddCampaignPreset = (preset: typeof DEFAULT_CAMPAIGN_PRESETS[0]) => {
    const newC: Campaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: preset.title,
      duration: preset.duration,
      iconType: preset.iconType
    };
    const updated = [...(customCampaigns || []), newC];
    updateStateAndBroadcast('customCampaigns', updated);
  };

  const handleDuplicateCampaign = (c: Campaign) => {
    const newC: Campaign = {
      ...c,
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: `${c.title} (Cópia)`
    };
    const updated = [...(customCampaigns || []), newC];
    updateStateAndBroadcast('customCampaigns', updated);
  };

  const handleSaveMeeting = () => {
    if (!newMeetTheme.trim()) {
      if (notify) notify("Por favor, preencha o tema/título da reunião.", "error");
      return;
    }
    
    const [hours, minutes] = newMeetTime.split(':').map(Number);
    let finalDayName = '';
    let finalDay: number | undefined = undefined;
    let finalDate: string | undefined = undefined;

    if (newMeetType === 'weekly') {
      finalDayName = daysMap[newMeetWeeklyDay];
      finalDay = newMeetWeeklyDay;
    } else {
      if (!newMeetDate) {
        if (notify) notify("Por favor, selecione a data do evento.", "error");
        return;
      }
      const dateParts = newMeetDate.split('-');
      const dateObj = new Date(newMeetDate + 'T12:00:00');
      finalDay = dateObj.getDay();
      finalDayName = `${daysMap[finalDay]} (${dateParts[2]}/${dateParts[1]})`;
      finalDate = newMeetDate;
    }

    const mObject: Meeting = {
      id: editingMeetId || `meet_${Date.now()}`,
      day: finalDay,
      dayName: finalDayName,
      theme: newMeetTheme.trim(),
      time: newMeetTime,
      hours: hours,
      minutes: minutes,
      date: finalDate
    };

    if (editingMeetId) {
      const updated = (customMeetings || []).map(m => m.id === editingMeetId ? mObject : m);
      updateStateAndBroadcast('customMeetings', updated);
      setEditingMeetId(null);
      if (notify) notify("Reunião atualizada com sucesso!", "success");
    } else {
      const updated = [...customMeetings, mObject];
      updateStateAndBroadcast('customMeetings', updated);
      if (notify) notify("Nova reunião adicionada à agenda!", "success");
    }
    
    setShowAddMeetingForm(false);
    setNewMeetTheme('');
  };

  const handleDeleteMeeting = (id: string) => {
    if (showConfirm) {
      showConfirm('Excluir Reunião?', 'Tem certeza que deseja remover esta reunião?', () => {
        const updated = customMeetings.filter(m => m.id !== id);
        updateStateAndBroadcast('customMeetings', updated);
        if (notify) notify("Reunião removida.", "info");
      }, 'danger');
    } else {
      const updated = customMeetings.filter(m => m.id !== id);
      updateStateAndBroadcast('customMeetings', updated);
      if (notify) notify("Reunião removida.", "info");
    }
  };

  const handleSaveCampaign = () => {
    if (!newCampTitle.trim()) {
      if (notify) notify("Por favor, informe o título do propósito/campanha.", "error");
      return;
    }
    
    const cObject: Campaign = {
      id: editingCampId || `camp_${Date.now()}`,
      title: newCampTitle.trim(),
      duration: newCampDuration.trim() || "Diariamente",
      iconType: newCampType,
      endDate: newCampEndDate ? newCampEndDate : undefined
    };

    if (editingCampId) {
      const updated = (customCampaigns || []).map(c => c.id === editingCampId ? cObject : c);
      updateStateAndBroadcast('customCampaigns', updated);
      setEditingCampId(null);
      if (notify) notify("Propósito/Campanha atualizado!", "success");
    } else {
      const updated = [...customCampaigns, cObject];
      updateStateAndBroadcast('customCampaigns', updated);
      if (notify) notify("Novo propósito/campanha adicionado!", "success");
    }
    
    setShowAddCampaignForm(false);
    setNewCampTitle('');
    setNewCampDuration('');
    setNewCampEndDate('');
  };

  const handleDeleteCampaign = (id: string) => {
    if (showConfirm) {
      showConfirm('Excluir Campanha?', 'Tem certeza que deseja remover este propósito/campanha?', () => {
        const updated = customCampaigns.filter(c => c.id !== id);
        updateStateAndBroadcast('customCampaigns', updated);
      }, 'danger');
    } else {
      const updated = customCampaigns.filter(c => c.id !== id);
      updateStateAndBroadcast('customCampaigns', updated);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start animate-in fade-in duration-200">
      
      {/* MEETS COLUMN */}
      <section aria-label="Agenda e Reuniões" className={`transition-all duration-300 bg-[#09090b] border border-[#27272a] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col h-fit ${
        isMeetingPanelOpen && !isCampaignPanelOpen 
          ? "w-full lg:flex-[3]" 
          : !isMeetingPanelOpen && isCampaignPanelOpen 
            ? "w-full lg:w-[325px] shrink-0" 
            : "flex-1 w-full"
      }`}>
        <button
          type="button"
          onClick={() => {
            if (!isMeetingPanelOpen) {
              setIsMeetingPanelOpen(true);
              setIsCampaignPanelOpen(false);
            } else {
              setIsMeetingPanelOpen(false);
            }
          }}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-[#111113] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#111113] border border-amber-900/50 rounded-xl text-amber-500 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <CalendarDays className="w-5 h-5 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider font-sans">Agenda & Reuniões</h3>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{(customMeetings || []).length} reuniões registradas</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isMeetingPanelOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ArrowDown className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          </motion.div>
        </button>

        {isMeetingPanelOpen && (
          <div className="p-5 border-t border-[#222] bg-[#030303] flex flex-col gap-4 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
            
            {!showAddMeetingForm ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMeetingForm(true);
                    setEditingMeetId(null);
                    setNewMeetTheme('');
                    setNewMeetType('weekly');
                    setNewMeetWeeklyDay(new Date().getDay());
                    setNewMeetDate(new Date().toISOString().split('T')[0]);
                    setNewMeetTime('19:30');
                  }}
                  className="w-full py-3 bg-gradient-to-b from-[#1c1c1f] to-[#121214] border border-[#333] hover:border-amber-500/50 text-zinc-100 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[1px]"
                >
                  <Plus className="w-4 h-4 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]" />
                  <span className="font-sans">Nova Reunião</span>
                </button>

                {/* Modelos Prontos de Reuniões */}
                <div className="flex flex-col gap-2 pt-3 border-t border-[#222]">
                  <span className="text-[10px] font-mono font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Adicionar Rápido:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_MEETING_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddMeetingPreset(preset)}
                        className="bg-[#09090b] border border-[#222] hover:border-amber-500/50 text-left p-2.5 rounded-xl text-[10px] text-zinc-300 hover:text-white font-medium flex flex-col justify-between transition-all cursor-pointer group shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
                      >
                        <span className="font-bold text-amber-400 group-hover:text-amber-300 font-sans truncate">{preset.theme}</span>
                        <span className="text-zinc-500 text-[9px] font-mono mt-1">{preset.dayName} às {preset.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#09090b] border border-[#27272a] p-4 rounded-2xl flex flex-col gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                <div className="flex items-center justify-between border-b border-[#333] pb-2.5">
                  <span className="text-xs font-extrabold text-amber-500 font-sans uppercase tracking-wider">
                    {editingMeetId ? "Editar Reunião" : "Nova Reunião / Evento"}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowAddMeetingForm(false)}
                    className="text-zinc-400 hover:text-white transition-colors p-1 cursor-pointer bg-[#111113] border border-[#333] rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Tema do Culto / Evento</label>
                  <input
                    type="text"
                    value={newMeetTheme}
                    onChange={(e) => setNewMeetTheme(e.target.value)}
                    placeholder="Ex: Noite da Salvação, Corrente da Vitória..."
                    className="bg-[#030303] border border-[#222] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Frequência</label>
                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setNewMeetType('weekly')}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer font-sans active:translate-y-[1px] ${
                        newMeetType === 'weekly'
                          ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] text-zinc-400"
                      }`}
                    >
                      Semanal Fixo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMeetType('one_time')}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer font-sans active:translate-y-[1px] ${
                        newMeetType === 'one_time'
                          ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] text-zinc-400"
                      }`}
                    >
                      Evento Pontual
                    </button>
                  </div>
                </div>

                {newMeetType === 'weekly' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Dia da Semana</label>
                    <select
                      value={newMeetWeeklyDay}
                      onChange={(e) => setNewMeetWeeklyDay(parseInt(e.target.value, 10))}
                      className="bg-[#030303] border border-[#222] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                    >
                      {daysMap.map((d, i) => (
                        <option key={i} value={i} className="bg-[#09090b] text-zinc-100">{d}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Data Limite</label>
                    <input
                      type="date"
                      value={newMeetDate}
                      onChange={(e) => setNewMeetDate(e.target.value)}
                      className="bg-[#030303] border border-[#222] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Horário</label>
                  <input
                    type="time"
                    value={newMeetTime}
                    onChange={(e) => setNewMeetTime(e.target.value)}
                    className="bg-[#030303] border border-[#222] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div className="flex gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={handleSaveMeeting}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:translate-y-[1px]"
                  >
                    Confirmar Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMeetingForm(false);
                      setEditingMeetId(null);
                    }}
                    className="px-4 py-2.5 bg-[#111113] border border-[#333] hover:border-[#444] text-zinc-300 rounded-xl text-xs font-bold cursor-pointer transition-all active:translate-y-[1px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* EXPIRED MEETINGS NOTIFICATION BANNER */}
            {expiredMeetings.length > 0 && (
              <div className="bg-amber-950/60 border border-amber-800/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-2 text-amber-400 font-medium min-w-0">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
                  <span className="truncate">
                    {expiredMeetings.length === 1
                      ? `1 evento pontual ("${expiredMeetings[0].theme}") já passou.`
                      : `${expiredMeetings.length} eventos pontuais já passaram.`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearExpiredMeetings}
                  className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm active:translate-y-[1px]"
                  title="Remover eventos passados da agenda"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Limpar Passados
                </button>
              </div>
            )}

            {/* MEETS LIST */}
            <div className="flex flex-col gap-2.5 pr-1">
              {(customMeetings || []).length === 0 ? (
                <div className="text-zinc-500 text-center py-6 text-xs italic bg-[#030303] border border-dashed border-[#222] rounded-xl font-medium">
                  Nenhuma reunião ou evento adicionado.
                </div>
              ) : (
                [...customMeetings]
                  .sort((a, b) => {
                    const dayA = a.day ?? 0;
                    const dayB = b.day ?? 0;
                    if (dayA !== dayB) return dayA - dayB;
                    return (a.hours * 60 + a.minutes) - (b.hours * 60 + b.minutes);
                  })
                  .map((meet) => {
                    const isExpired = !!(meet.date && meet.date < todayStr);

                    return (
                      <div 
                        key={meet.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] ${
                          isExpired 
                            ? "bg-red-950/20 border-red-900/40 opacity-60" 
                            : meet.date 
                              ? "bg-[#09090b] border-amber-900/40" 
                              : meet.day === now.getDay()
                                ? "bg-[#111113] border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                : "bg-[#09090b] border-[#222]"
                        }`}
                      >
                        <div className="flex flex-col gap-1 max-w-[70%] text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isExpired ? (
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase bg-red-950 border border-red-800 text-red-400">
                                Passou
                              </span>
                            ) : (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                meet.date ? "bg-amber-500 text-black font-extrabold" : "bg-[#111113] text-zinc-400 border border-[#333]"
                              }`}>
                                {meet.date ? "Único" : "Semanal"}
                              </span>
                            )}
                            {meet.day === now.getDay() && !isExpired && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase bg-emerald-500 text-black animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                                Hoje!
                              </span>
                            )}
                            <span className="text-zinc-200 font-bold font-sans">{meet.dayName}</span>
                            <span className="text-amber-500 font-mono font-bold">às {meet.time}</span>
                          </div>
                          <span className="text-zinc-300 truncate font-semibold font-sans">{meet.theme}</span>
                          {isExpired && (
                            <span className="text-[9px] text-zinc-500 italic">Encerrado (removido do telão)</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDuplicateMeeting(meet)}
                            className="p-2 bg-[#111113] border border-[#333] hover:border-amber-500/50 hover:bg-[#1a1a1d] rounded-lg text-zinc-400 hover:text-amber-400 transition-all cursor-pointer active:translate-y-[1px]"
                            title="Duplicar Reunião"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMeetId(meet.id);
                              setNewMeetTheme(meet.theme);
                              setNewMeetTime(meet.time);
                              setNewMeetType(meet.date ? 'one_time' : 'weekly');
                              if (meet.date) setNewMeetDate(meet.date);
                              if (meet.day !== undefined) setNewMeetWeeklyDay(meet.day);
                              setShowAddMeetingForm(true);
                            }}
                            className="p-2 bg-[#111113] border border-[#333] hover:border-[#444] hover:bg-[#1a1a1d] rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer active:translate-y-[1px]"
                            title="Editar Reunião"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMeeting(meet.id)}
                            className="p-2 bg-[#111113] border border-[#333] hover:border-red-800 hover:bg-red-950/40 rounded-lg text-zinc-500 hover:text-red-400 transition-all cursor-pointer active:translate-y-[1px]"
                            title="Excluir Reunião"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </section>

      {/* CAMPAIGNS COLUMN */}
      <section aria-label="Campanhas e Propósitos" className={`transition-all duration-300 bg-[#09090b] border border-[#27272a] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col h-fit ${
        isCampaignPanelOpen && !isMeetingPanelOpen 
          ? "w-full lg:flex-[3]" 
          : !isCampaignPanelOpen && isMeetingPanelOpen 
            ? "w-full lg:w-[325px] shrink-0" 
            : "flex-1 w-full"
      }`}>
        <button
          type="button"
          onClick={() => {
            if (!isCampaignPanelOpen) {
              setIsCampaignPanelOpen(true);
              setIsMeetingPanelOpen(false);
            } else {
              setIsCampaignPanelOpen(false);
            }
          }}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-[#111113] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#111113] border border-amber-900/50 rounded-xl text-amber-500 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <Flame className="w-5 h-5 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            </div>
            <div>
              <h3 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider font-sans">Campanhas & Propósitos</h3>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{(customCampaigns || []).length} campanhas registradas</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isCampaignPanelOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ArrowDown className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          </motion.div>
        </button>

        {isCampaignPanelOpen && (
          <div className="p-5 border-t border-[#222] bg-[#030303] flex flex-col gap-4 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
            
            {!showAddCampaignForm ? (
              <div className="flex flex-col gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCampId(null);
                    setShowAddCampaignForm(true);
                    setNewCampTitle('');
                    setNewCampDuration('');
                    setNewCampType('flame');
                    setNewCampEndDate('');
                  }}
                  className="w-full py-3 bg-gradient-to-b from-[#1c1c1f] to-[#121214] border border-[#333] hover:border-amber-500/50 text-zinc-100 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[1px]"
                >
                  <Plus className="w-4 h-4 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.6)]" />
                  <span className="font-sans">Nova Campanha</span>
                </button>

                {/* Modelos Prontos de Campanhas */}
                <div className="flex flex-col gap-2 pt-3 border-t border-[#222]">
                  <span className="text-[10px] font-mono font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Modelos Rápidos:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_CAMPAIGN_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddCampaignPreset(preset)}
                        className="bg-[#09090b] border border-[#222] hover:border-amber-500/50 text-left p-2.5 rounded-xl text-[10px] text-zinc-300 hover:text-white font-medium flex flex-col justify-between transition-all cursor-pointer group shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
                      >
                        <span className="font-bold text-amber-400 group-hover:text-amber-300 font-sans truncate">{preset.title}</span>
                        <span className="text-zinc-500 text-[9px] font-mono mt-1 truncate">{preset.duration}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {onResetCampaigns && (
                  <button
                    type="button"
                    onClick={onResetCampaigns}
                    className="w-full py-2.5 bg-[#111113] hover:bg-[#1a1a1d] text-zinc-400 hover:text-amber-400 border border-[#222] hover:border-amber-500/40 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 active:translate-y-[1px]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0 text-amber-500" /> Restaurar Propósitos Padrão
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-[#09090b] border border-[#27272a] p-4 rounded-2xl flex flex-col gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                <div className="flex items-center justify-between border-b border-[#333] pb-2.5">
                  <span className="text-xs font-extrabold text-amber-500 font-sans uppercase tracking-wider">
                    {editingCampId ? "Editar Propósito" : "Novo Propósito"}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddCampaignForm(false);
                      setEditingCampId(null);
                    }}
                    className="text-zinc-400 hover:text-white transition-colors p-1 cursor-pointer bg-[#111113] border border-[#333] rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Nome da Campanha</label>
                  <input
                    type="text"
                    value={newCampTitle}
                    onChange={(e) => setNewCampTitle(e.target.value)}
                    placeholder="Ex: Jejum de Daniel, Fogueira Santa..."
                    className="bg-[#030303] border border-[#222] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Duração (Exibição)</label>
                  <input
                    type="text"
                    value={newCampDuration}
                    onChange={(e) => setNewCampDuration(e.target.value)}
                    placeholder="Ex: De 11 a 31 de Outubro, 21 Dias..."
                    className="bg-[#030303] border border-[#222] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Estilo Visual</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setNewCampType('wifi_off')}
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1.5 active:translate-y-[1px] ${
                        newCampType === 'wifi_off'
                          ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] text-zinc-400"
                      }`}
                    >
                      <WifiOff className="w-4 h-4" />
                      Sem Wi-Fi
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampType('flame')}
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1.5 active:translate-y-[1px] ${
                        newCampType === 'flame'
                          ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] text-zinc-400"
                      }`}
                    >
                      <Flame className="w-4 h-4" />
                      Fogueira
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampType('globe')}
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1.5 active:translate-y-[1px] ${
                        newCampType === 'globe'
                          ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] text-zinc-400"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      Evangelização
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampType('faith')}
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1.5 active:translate-y-[1px] ${
                        newCampType === 'faith'
                          ? "bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] text-zinc-400"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      Geral
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Data Limite (Opcional)</label>
                  <input
                    type="date"
                    value={newCampEndDate}
                    onChange={(e) => setNewCampEndDate(e.target.value)}
                    className="bg-[#030303] border border-[#222] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                  <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Sumiço automático dos slides ao passar da data</span>
                </div>

                <div className="flex gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={handleSaveCampaign}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:translate-y-[1px]"
                  >
                    Confirmar Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCampaignForm(false);
                      setEditingCampId(null);
                    }}
                    className="px-4 py-2.5 bg-[#111113] border border-[#333] hover:border-[#444] text-zinc-300 rounded-xl text-xs font-bold cursor-pointer transition-all active:translate-y-[1px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* CAMPAIGNS LIST */}
            <div className="flex flex-col gap-2.5 pr-1">
              {(customCampaigns || []).length === 0 ? (
                <div className="text-zinc-500 text-center py-6 text-xs italic bg-[#030303] border border-dashed border-[#222] rounded-xl font-medium">
                  Nenhuma campanha cadastrada.
                </div>
              ) : (
                (customCampaigns || []).map((camp, index) => {
                  // Check if expired
                  let isExpired = false;
                  if (camp.endDate) {
                    const end = new Date(camp.endDate + 'T23:59:59');
                    if (new Date() > end) isExpired = true;
                  }

                  return (
                    <div 
                      key={camp.id || `camp_${index}`}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs bg-[#09090b] border-[#222] transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] ${
                        isExpired ? "opacity-45" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 max-w-[65%] text-left">
                        <div className="p-2 bg-[#111113] border border-amber-900/40 text-amber-500 rounded-lg shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                          {camp.iconType === 'wifi_off' ? (
                            <WifiOff className="w-4 h-4" />
                          ) : camp.iconType === 'globe' ? (
                            <Globe className="w-4 h-4" />
                          ) : camp.iconType === 'faith' ? (
                            <CalendarDays className="w-4 h-4" />
                          ) : (
                            <Flame className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-zinc-200 font-bold font-sans truncate leading-snug">{camp.title}</span>
                          <span className="text-zinc-400 text-[10px] truncate font-mono">{camp.duration}</span>
                          {camp.endDate && (
                            <span className="text-[9px] text-zinc-500 font-mono">Oculta após: {camp.endDate.split('-').reverse().join('/')}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isExpired ? (
                          <span className="text-[9px] bg-red-950 border border-red-800 text-red-400 px-2 py-0.5 rounded font-extrabold uppercase">Expirado</span>
                        ) : (
                          <span className="text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded font-extrabold uppercase shadow-[0_0_6px_rgba(16,185,129,0.3)]">Ativo</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDuplicateCampaign(camp)}
                          className="p-2 bg-[#111113] border border-[#333] hover:border-amber-500/50 hover:bg-[#1a1a1d] rounded-lg text-zinc-400 hover:text-amber-400 transition-all cursor-pointer active:translate-y-[1px]"
                          title="Duplicar Propósito"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCampId(camp.id);
                            setNewCampTitle(camp.title);
                            setNewCampDuration(camp.duration);
                            setNewCampType(camp.iconType || 'flame');
                            setNewCampEndDate(camp.endDate || '');
                            setShowAddCampaignForm(true);
                          }}
                          className="p-2 bg-[#111113] border border-[#333] hover:border-[#444] hover:bg-[#1a1a1d] rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer active:translate-y-[1px]"
                          title="Editar Propósito"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="p-2 bg-[#111113] border border-[#333] hover:border-red-800 hover:bg-red-950/40 rounded-lg text-zinc-500 hover:text-red-400 transition-all cursor-pointer active:translate-y-[1px]"
                          title="Excluir Propósito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

    </div>
  );
});
