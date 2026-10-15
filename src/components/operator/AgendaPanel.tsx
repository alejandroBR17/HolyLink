import {ConsoleIntro} from './ConsoleIntro';
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

  const [isMeetingPanelOpen, setIsMeetingPanelOpen] = useState(true);
  const [isCampaignPanelOpen, setIsCampaignPanelOpen] = useState(true);

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
    <div className="agenda-workspace console-area">
      <ConsoleIntro icon={CalendarDays} title="Agenda da igreja" eyebrow="Encontros e propósitos" description="Reuniões da semana e campanhas que fazem parte da projeção." stats={[{label:'Semana',value:customMeetings.filter(m => !m.date).length + ' reuniões'},{label:'Pontuais',value:customMeetings.filter(m => m.date).length + ' eventos'},{label:'Campanhas',value:customCampaigns.length}]}/>
      <div className="agenda-columns">

      {/* MEETS COLUMN */}
      <section aria-label="Agenda e Reuniões" className={`transition-all duration-300 bg-hl-panel border border-hl-line rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col h-fit ${
        isMeetingPanelOpen && !isCampaignPanelOpen
          ? "w-full lg:flex-[3]"
          : !isMeetingPanelOpen && isCampaignPanelOpen
            ? "w-full lg:w-[325px] shrink-0"
            : "flex-1 w-full"
      }`}>
        <button
          type="button"
          onClick={() => setIsMeetingPanelOpen(value => !value)} aria-expanded={isMeetingPanelOpen} aria-controls="agenda-meetings-content" className="agenda-section-toggle w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-hl-raised transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-hl-raised border border-hl-line-strong/50 rounded-xl text-hl-gold shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <CalendarDays className="w-5 h-5 drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
            </div>
            <div>
              <h3 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider font-sans">Agenda & Reuniões</h3>
              <p className="text-[10px] text-hl-muted font-medium mt-0.5">{(customMeetings || []).length} reuniões registradas</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isMeetingPanelOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ArrowDown className="w-4 h-4 text-hl-muted group-hover:text-hl-gold transition-colors" />
          </motion.div>
        </button>

        {isMeetingPanelOpen && (
          <div id="agenda-meetings-content" className="p-5 border-t border-hl-line-soft bg-hl-canvas flex flex-col gap-4 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">

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
                  className="w-full py-3 bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-hl-gold/50 text-hl-copy rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[1px]"
                >
                  <Plus className="w-4 h-4 text-hl-gold drop-shadow-[0_0_4px_rgba(255,211,79,0.6)]" />
                  <span className="font-sans">Nova Reunião</span>
                </button>

                {/* Modelos Prontos de Reuniões */}
                <details className="console-templates"><summary>Modelos de reuniões</summary><div className="flex flex-col gap-2 pt-3 border-t border-hl-line-soft">
                  <span className="text-[10px] font-mono font-extrabold text-hl-gold uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-hl-gold shrink-0" /> Adicionar Rápido:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_MEETING_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddMeetingPreset(preset)}
                        className="bg-hl-panel border border-hl-line-soft hover:border-hl-gold/50 text-left p-2.5 rounded-xl text-[10px] text-hl-soft hover:text-white font-medium flex flex-col justify-between transition-all cursor-pointer group shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
                      >
                        <span className="font-bold text-hl-gold-bright group-hover:text-hl-gold-bright font-sans truncate">{preset.theme}</span>
                        <span className="text-hl-dim text-[9px] font-mono mt-1">{preset.dayName} às {preset.time}</span>
                      </button>
                    ))}
                  </div>
                </div></details>
              </div>
            ) : (
              <div className="bg-hl-panel border border-hl-line p-4 rounded-2xl flex flex-col gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                <div className="flex items-center justify-between border-b border-hl-line pb-2.5">
                  <span className="text-xs font-extrabold text-hl-gold font-sans uppercase tracking-wider">
                    {editingMeetId ? "Editar Reunião" : "Nova Reunião / Evento"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddMeetingForm(false)}
                    className="text-hl-muted hover:text-white transition-colors p-1 cursor-pointer bg-hl-raised border border-hl-line rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="meeting-theme" className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Tema do Culto / Evento</label>
                  <input
                    type="text"
                    id="meeting-theme" value={newMeetTheme}
                    onChange={(e) => setNewMeetTheme(e.target.value)}
                    placeholder="Ex: Noite da Salvação, Corrente da Vitória..."
                    className="bg-hl-canvas border border-hl-line-soft rounded-xl px-3.5 py-2.5 text-xs text-hl-copy focus:outline-none focus:border-hl-gold focus:ring-1 focus:ring-hl-gold/20 font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Frequência</label>
                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setNewMeetType('weekly')}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer font-sans active:translate-y-[1px] ${
                        newMeetType === 'weekly'
                          ? "bg-hl-gold border-hl-gold text-black shadow-[0_0_12px_rgba(255,211,79,0.4)]"
                          : "bg-gradient-to-b from-hl-raised to-hl-raised border-hl-line text-hl-muted"
                      }`}
                    >
                      Semanal Fixo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMeetType('one_time')}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer font-sans active:translate-y-[1px] ${
                        newMeetType === 'one_time'
                          ? "bg-hl-gold border-hl-gold text-black shadow-[0_0_12px_rgba(255,211,79,0.4)]"
                          : "bg-gradient-to-b from-hl-raised to-hl-raised border-hl-line text-hl-muted"
                      }`}
                    >
                      Evento Pontual
                    </button>
                  </div>
                </div>

                {newMeetType === 'weekly' ? (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="meeting-day" className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Dia da Semana</label>
                    <select
                      id="meeting-day" value={newMeetWeeklyDay}
                      onChange={(e) => setNewMeetWeeklyDay(parseInt(e.target.value, 10))}
                      className="bg-hl-canvas border border-hl-line-soft rounded-xl px-3.5 py-2.5 text-xs text-hl-copy focus:outline-none focus:border-hl-gold cursor-pointer font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                    >
                      {daysMap.map((d, i) => (
                        <option key={i} value={i} className="bg-hl-panel text-hl-copy">{d}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="meeting-date" className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Data do evento</label>
                    <input
                      type="date"
                      id="meeting-date" value={newMeetDate}
                      onChange={(e) => setNewMeetDate(e.target.value)}
                      className="bg-hl-canvas border border-hl-line-soft rounded-xl px-3.5 py-2.5 text-xs text-hl-copy focus:outline-none focus:border-hl-gold cursor-pointer font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="meeting-time" className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Horário</label>
                  <input
                    type="time"
                    id="meeting-time" value={newMeetTime}
                    onChange={(e) => setNewMeetTime(e.target.value)}
                    className="bg-hl-canvas border border-hl-line-soft rounded-xl px-3.5 py-2.5 text-xs text-hl-copy focus:outline-none focus:border-hl-gold cursor-pointer font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div className="flex gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={handleSaveMeeting}
                    className="flex-1 py-2.5 bg-hl-gold hover:bg-hl-gold-bright text-black font-black rounded-xl text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(255,211,79,0.3)] active:translate-y-[1px]"
                  >
                    Confirmar Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMeetingForm(false);
                      setEditingMeetId(null);
                    }}
                    className="px-4 py-2.5 bg-hl-raised border border-hl-line hover:border-hl-line-strong text-hl-soft rounded-xl text-xs font-bold cursor-pointer transition-all active:translate-y-[1px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* EXPIRED MEETINGS NOTIFICATION BANNER */}
            {expiredMeetings.length > 0 && (
              <div className="bg-hl-gold-well/60 border border-hl-line-strong/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-2 text-hl-gold-bright font-medium min-w-0">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-hl-gold animate-pulse" />
                  <span className="truncate">
                    {expiredMeetings.length === 1
                      ? `1 evento pontual ("${expiredMeetings[0].theme}") já passou.`
                      : `${expiredMeetings.length} eventos pontuais já passaram.`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearExpiredMeetings}
                  className="shrink-0 px-3 py-1.5 bg-hl-gold hover:bg-hl-gold-bright text-black font-extrabold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm active:translate-y-[1px]"
                  title="Remover eventos passados da agenda"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Limpar Passados
                </button>
              </div>
            )}

            {/* MEETS LIST */}
            <div className="flex flex-col gap-2.5 pr-1">
              {(customMeetings || []).length === 0 ? (
                <div className="text-hl-dim text-center py-6 text-xs italic bg-hl-canvas border border-dashed border-hl-line-soft rounded-xl font-medium">
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
                              ? "bg-hl-panel border-hl-line-strong/40"
                              : meet.day === now.getDay()
                                ? "bg-hl-raised border-hl-gold/60 shadow-[0_0_15px_rgba(255,211,79,0.1)]"
                                : "bg-hl-panel border-hl-line-soft"
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
                                meet.date ? "bg-hl-gold text-black font-extrabold" : "bg-hl-raised text-hl-muted border border-hl-line"
                              }`}>
                                {meet.date ? "Único" : "Semanal"}
                              </span>
                            )}
                            {meet.day === now.getDay() && !isExpired && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase bg-emerald-500 text-black animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                                Hoje!
                              </span>
                            )}
                            <span className="text-hl-soft font-bold font-sans">{meet.dayName}</span>
                            <span className="text-hl-gold font-mono font-bold">às {meet.time}</span>
                          </div>
                          <span className="text-hl-soft truncate font-semibold font-sans">{meet.theme}</span>
                          {isExpired && (
                            <span className="text-[9px] text-hl-dim italic">Encerrado (removido do telão)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDuplicateMeeting(meet)}
                            className="p-2 bg-hl-raised border border-hl-line hover:border-hl-gold/50 hover:bg-hl-raised rounded-lg text-hl-muted hover:text-hl-gold-bright transition-all cursor-pointer active:translate-y-[1px]"
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
                            className="p-2 bg-hl-raised border border-hl-line hover:border-hl-line-strong hover:bg-hl-raised rounded-lg text-hl-muted hover:text-white transition-all cursor-pointer active:translate-y-[1px]"
                            title="Editar Reunião"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMeeting(meet.id)}
                            className="p-2 bg-hl-raised border border-hl-line hover:border-red-800 hover:bg-red-950/40 rounded-lg text-hl-dim hover:text-red-400 transition-all cursor-pointer active:translate-y-[1px]"
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
      <section aria-label="Campanhas e Propósitos" className={`transition-all duration-300 bg-hl-panel border border-hl-line rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col h-fit ${
        isCampaignPanelOpen && !isMeetingPanelOpen
          ? "w-full lg:flex-[3]"
          : !isCampaignPanelOpen && isMeetingPanelOpen
            ? "w-full lg:w-[325px] shrink-0"
            : "flex-1 w-full"
      }`}>
        <button
          type="button"
          onClick={() => setIsCampaignPanelOpen(value => !value)} aria-expanded={isCampaignPanelOpen} aria-controls="agenda-campaigns-content" className="agenda-section-toggle w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-hl-raised transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-hl-raised border border-hl-line-strong/50 rounded-xl text-hl-gold shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              <Flame className="w-5 h-5 drop-shadow-[0_0_6px_rgba(255,211,79,0.6)]" />
            </div>
            <div>
              <h3 className="text-hl-copy font-extrabold text-xs uppercase tracking-wider font-sans">Campanhas & Propósitos</h3>
              <p className="text-[10px] text-hl-muted font-medium mt-0.5">{(customCampaigns || []).length} campanhas registradas</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isCampaignPanelOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ArrowDown className="w-4 h-4 text-hl-muted group-hover:text-hl-gold transition-colors" />
          </motion.div>
        </button>

        {isCampaignPanelOpen && (
          <div id="agenda-campaigns-content" className="p-5 border-t border-hl-line-soft bg-hl-canvas flex flex-col gap-4 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">

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
                  className="w-full py-3 bg-gradient-to-b from-hl-raised to-hl-raised border border-hl-line hover:border-hl-gold/50 text-hl-copy rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[1px]"
                >
                  <Plus className="w-4 h-4 text-hl-gold drop-shadow-[0_0_4px_rgba(255,211,79,0.6)]" />
                  <span className="font-sans">Nova Campanha</span>
                </button>

                {/* Modelos Prontos de Campanhas */}
                <details className="console-templates"><summary>Modelos de campanhas</summary><div className="flex flex-col gap-2 pt-3 border-t border-hl-line-soft">
                  <span className="text-[10px] font-mono font-extrabold text-hl-gold uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-hl-gold shrink-0" /> Modelos Rápidos:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_CAMPAIGN_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddCampaignPreset(preset)}
                        className="bg-hl-panel border border-hl-line-soft hover:border-hl-gold/50 text-left p-2.5 rounded-xl text-[10px] text-hl-soft hover:text-white font-medium flex flex-col justify-between transition-all cursor-pointer group shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
                      >
                        <span className="font-bold text-hl-gold-bright group-hover:text-hl-gold-bright font-sans truncate">{preset.title}</span>
                        <span className="text-hl-dim text-[9px] font-mono mt-1 truncate">{preset.duration}</span>
                      </button>
                    ))}
                  </div>
                </div></details>

                {onResetCampaigns && (
                  <button
                    type="button"
                    onClick={onResetCampaigns}
                    className="w-full py-2.5 bg-hl-raised hover:bg-hl-raised text-hl-muted hover:text-hl-gold-bright border border-hl-line-soft hover:border-hl-gold/40 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 active:translate-y-[1px]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0 text-hl-gold" /> Restaurar Propósitos Padrão
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-hl-panel border border-hl-line p-4 rounded-2xl flex flex-col gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                <div className="flex items-center justify-between border-b border-hl-line pb-2.5">
                  <span className="text-xs font-extrabold text-hl-gold font-sans uppercase tracking-wider">
                    {editingCampId ? "Editar Propósito" : "Novo Propósito"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCampaignForm(false);
                      setEditingCampId(null);
                    }}
                    className="text-hl-muted hover:text-white transition-colors p-1 cursor-pointer bg-hl-raised border border-hl-line rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="campaign-title" className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Nome da Campanha</label>
                  <input
                    type="text"
                    id="campaign-title" value={newCampTitle}
                    onChange={(e) => setNewCampTitle(e.target.value)}
                    placeholder="Ex: Jejum de Daniel, Fogueira Santa..."
                    className="bg-hl-canvas border border-hl-line-soft rounded-xl px-3.5 py-2.5 text-xs text-hl-copy focus:outline-none focus:border-hl-gold focus:ring-1 focus:ring-hl-gold/20 font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="campaign-duration" className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Duração (Exibição)</label>
                  <input
                    type="text"
                    id="campaign-duration" value={newCampDuration}
                    onChange={(e) => setNewCampDuration(e.target.value)}
                    placeholder="Ex: De 11 a 31 de Outubro, 21 Dias..."
                    className="bg-hl-canvas border border-hl-line-soft rounded-xl px-3.5 py-2.5 text-xs text-hl-copy focus:outline-none focus:border-hl-gold focus:ring-1 focus:ring-hl-gold/20 font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Estilo Visual</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setNewCampType('wifi_off')}
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1.5 active:translate-y-[1px] ${
                        newCampType === 'wifi_off'
                          ? "bg-hl-gold border-hl-gold text-black shadow-[0_0_12px_rgba(255,211,79,0.4)]"
                          : "bg-gradient-to-b from-hl-raised to-hl-raised border-hl-line text-hl-muted"
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
                          ? "bg-hl-gold border-hl-gold text-black shadow-[0_0_12px_rgba(255,211,79,0.4)]"
                          : "bg-gradient-to-b from-hl-raised to-hl-raised border-hl-line text-hl-muted"
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
                          ? "bg-hl-gold border-hl-gold text-black shadow-[0_0_12px_rgba(255,211,79,0.4)]"
                          : "bg-gradient-to-b from-hl-raised to-hl-raised border-hl-line text-hl-muted"
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
                          ? "bg-hl-gold border-hl-gold text-black shadow-[0_0_12px_rgba(255,211,79,0.4)]"
                          : "bg-gradient-to-b from-hl-raised to-hl-raised border-hl-line text-hl-muted"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      Geral
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="campaign-end" className="text-[10px] font-mono font-bold text-hl-muted uppercase tracking-wider">Data Limite (Opcional)</label>
                  <input
                    type="date"
                    id="campaign-end" value={newCampEndDate}
                    onChange={(e) => setNewCampEndDate(e.target.value)}
                    className="bg-hl-canvas border border-hl-line-soft rounded-xl px-3.5 py-2.5 text-xs text-hl-copy focus:outline-none focus:border-hl-gold cursor-pointer font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                  <span className="text-[9px] text-hl-dim font-mono mt-0.5">Sumiço automático dos slides ao passar da data</span>
                </div>

                <div className="flex gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={handleSaveCampaign}
                    className="flex-1 py-2.5 bg-hl-gold hover:bg-hl-gold-bright text-black font-black rounded-xl text-xs cursor-pointer transition-all shadow-[0_0_15px_rgba(255,211,79,0.3)] active:translate-y-[1px]"
                  >
                    Confirmar Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCampaignForm(false);
                      setEditingCampId(null);
                    }}
                    className="px-4 py-2.5 bg-hl-raised border border-hl-line hover:border-hl-line-strong text-hl-soft rounded-xl text-xs font-bold cursor-pointer transition-all active:translate-y-[1px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* CAMPAIGNS LIST */}
            <div className="flex flex-col gap-2.5 pr-1">
              {(customCampaigns || []).length === 0 ? (
                <div className="text-hl-dim text-center py-6 text-xs italic bg-hl-canvas border border-dashed border-hl-line-soft rounded-xl font-medium">
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
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs bg-hl-panel border-hl-line-soft transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] ${
                        isExpired ? "opacity-45" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 max-w-[65%] text-left">
                        <div className="p-2 bg-hl-raised border border-hl-line-strong/40 text-hl-gold rounded-lg shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
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
                          <span className="text-hl-soft font-bold font-sans truncate leading-snug">{camp.title}</span>
                          <span className="text-hl-muted text-[10px] truncate font-mono">{camp.duration}</span>
                          {camp.endDate && (
                            <span className="text-[9px] text-hl-dim font-mono">Oculta após: {camp.endDate.split('-').reverse().join('/')}</span>
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
                          className="p-2 bg-hl-raised border border-hl-line hover:border-hl-gold/50 hover:bg-hl-raised rounded-lg text-hl-muted hover:text-hl-gold-bright transition-all cursor-pointer active:translate-y-[1px]"
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
                          className="p-2 bg-hl-raised border border-hl-line hover:border-hl-line-strong hover:bg-hl-raised rounded-lg text-hl-muted hover:text-white transition-all cursor-pointer active:translate-y-[1px]"
                          title="Editar Propósito"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="p-2 bg-hl-raised border border-hl-line hover:border-red-800 hover:bg-red-950/40 rounded-lg text-hl-dim hover:text-red-400 transition-all cursor-pointer active:translate-y-[1px]"
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
    </div>
  );
});
