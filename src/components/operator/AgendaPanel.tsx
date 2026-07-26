import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CalendarDays, Plus, X, ArrowDown, Edit2, Trash2, Globe, Flame, WifiOff, RefreshCw
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
  onResetCampaigns?: () => void;
}

export function AgendaPanel({
  customMeetings,
  customCampaigns,
  updateStateAndBroadcast,
  showConfirm,
  onResetCampaigns
}: AgendaPanelProps) {
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

  const [isMeetingPanelOpen, setIsMeetingPanelOpen] = useState(false);
  const [isCampaignPanelOpen, setIsCampaignPanelOpen] = useState(false);

  const daysMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  const handleSaveMeeting = () => {
    if (!newMeetTheme.trim()) return;
    
    const [hours, minutes] = newMeetTime.split(':').map(Number);
    let finalDayName = '';
    let finalDay: number | undefined = undefined;
    let finalDate: string | undefined = undefined;

    if (newMeetType === 'weekly') {
      finalDayName = daysMap[newMeetWeeklyDay];
      finalDay = newMeetWeeklyDay;
    } else {
      if (!newMeetDate) return;
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
    } else {
      const updated = [...customMeetings, mObject];
      updateStateAndBroadcast('customMeetings', updated);
    }
    
    setShowAddMeetingForm(false);
    setNewMeetTheme('');
  };

  const handleDeleteMeeting = (id: string) => {
    if (showConfirm) {
      showConfirm('Excluir Reunião?', 'Tem certeza que deseja remover esta reunião?', () => {
        const updated = customMeetings.filter(m => m.id !== id);
        updateStateAndBroadcast('customMeetings', updated);
      }, 'danger');
    } else {
      const updated = customMeetings.filter(m => m.id !== id);
      updateStateAndBroadcast('customMeetings', updated);
    }
  };

  const handleSaveCampaign = () => {
    if (!newCampTitle.trim()) return;
    
    const cObject: Campaign = {
      id: `camp_${Date.now()}`,
      title: newCampTitle.trim(),
      duration: newCampDuration.trim() || "Diariamente",
      iconType: newCampType,
      endDate: newCampEndDate ? newCampEndDate : undefined
    };

    const updated = [...customCampaigns, cObject];
    updateStateAndBroadcast('customCampaigns', updated);
    
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
      <div className={`transition-all duration-300 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col h-fit ${
        isMeetingPanelOpen && !isCampaignPanelOpen 
          ? "w-full lg:flex-[3]" 
          : !isMeetingPanelOpen && isCampaignPanelOpen 
            ? "w-full lg:w-[325px] shrink-0" 
            : "flex-1 w-full"
      }`}>
        <button
          onClick={() => {
            if (!isMeetingPanelOpen) {
              setIsMeetingPanelOpen(true);
              setIsCampaignPanelOpen(false);
            } else {
              setIsMeetingPanelOpen(false);
            }
          }}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-950/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 animate-pulse">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Gerenciar Agenda & Eventos</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">{(customMeetings || []).length} reuniões registradas</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isMeetingPanelOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ArrowDown className="w-4 h-4 text-zinc-500" />
          </motion.div>
        </button>

        {isMeetingPanelOpen && (
          <div className="p-5 border-t border-zinc-800/50 bg-zinc-950/20 flex flex-col gap-4">
            
            {!showAddMeetingForm ? (
              <button
                onClick={() => {
                  setShowAddMeetingForm(true);
                  setEditingMeetId(null);
                  setNewMeetTheme('');
                  setNewMeetType('weekly');
                  setNewMeetWeeklyDay(new Date().getDay());
                  setNewMeetDate(new Date().toISOString().split('T')[0]);
                  setNewMeetTime('19:30');
                }}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-500" /> Adicionar Reunião ou Evento
              </button>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3.5 shadow-inner">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    {editingMeetId ? "Editar Reunião" : "Nova Reunião / Evento"}
                  </span>
                  <button 
                    onClick={() => setShowAddMeetingForm(false)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Tema do Culto / Evento</label>
                  <input
                    type="text"
                    value={newMeetTheme}
                    onChange={(e) => setNewMeetTheme(e.target.value)}
                    placeholder="Ex: Noite da Salvação, Corrente da Vitória..."
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Frequência</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setNewMeetType('weekly')}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        newMeetType === 'weekly'
                          ? "bg-amber-500 border-amber-500 text-black shadow"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      Semanal Fixo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMeetType('one_time')}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        newMeetType === 'one_time'
                          ? "bg-amber-500 border-amber-500 text-black shadow"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      Evento Pontual
                    </button>
                  </div>
                </div>

                {newMeetType === 'weekly' ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Dia da Semana</label>
                    <select
                      value={newMeetWeeklyDay}
                      onChange={(e) => setNewMeetWeeklyDay(parseInt(e.target.value, 10))}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer font-sans"
                    >
                      {daysMap.map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Data Limite</label>
                    <input
                      type="date"
                      value={newMeetDate}
                      onChange={(e) => setNewMeetDate(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer font-sans"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Horário</label>
                  <input
                    type="time"
                    value={newMeetTime}
                    onChange={(e) => setNewMeetTime(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer font-sans"
                  />
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleSaveMeeting}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Confirmar Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMeetingForm(false);
                      setEditingMeetId(null);
                    }}
                    className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* MEETS LIST */}
            <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-1">
              {(customMeetings || []).length === 0 ? (
                <div className="text-zinc-500 text-center py-6 text-xs italic bg-zinc-950/20 border border-dashed border-zinc-850 rounded-xl">
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
                  .map((meet) => (
                    <div 
                      key={meet.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                        meet.date 
                          ? "bg-amber-500/5 border-amber-500/20" 
                          : "bg-zinc-950 border-zinc-850"
                      }`}
                    >
                      <div className="flex flex-col gap-1 max-w-[70%] text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                            meet.date ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                          }`}>
                            {meet.date ? "Único" : "Semanal"}
                          </span>
                          <span className="text-zinc-200 font-bold">{meet.dayName}</span>
                          <span className="text-amber-500 font-mono font-bold">às {meet.time}</span>
                        </div>
                        <span className="text-zinc-400 truncate font-semibold">{meet.theme}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingMeetId(meet.id);
                            setNewMeetTheme(meet.theme);
                            setNewMeetTime(meet.time);
                            setNewMeetType(meet.date ? 'one_time' : 'weekly');
                            if (meet.date) setNewMeetDate(meet.date);
                            if (meet.day !== undefined) setNewMeetWeeklyDay(meet.day);
                            setShowAddMeetingForm(true);
                          }}
                          className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(meet.id)}
                          className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-900 hover:bg-red-950/20 rounded-lg text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* CAMPAIGNS COLUMN */}
      <div className={`transition-all duration-300 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col h-fit ${
        isCampaignPanelOpen && !isMeetingPanelOpen 
          ? "w-full lg:flex-[3]" 
          : !isCampaignPanelOpen && isMeetingPanelOpen 
            ? "w-full lg:w-[325px] shrink-0" 
            : "flex-1 w-full"
      }`}>
        <button
          onClick={() => {
            if (!isCampaignPanelOpen) {
              setIsCampaignPanelOpen(true);
              setIsMeetingPanelOpen(false);
            } else {
              setIsCampaignPanelOpen(false);
            }
          }}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-950/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Propósitos de Fé & Campanhas</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">{(customCampaigns || []).length} campanhas registradas</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isCampaignPanelOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ArrowDown className="w-4 h-4 text-zinc-500" />
          </motion.div>
        </button>

        {isCampaignPanelOpen && (
          <div className="p-5 border-t border-zinc-800/50 bg-zinc-950/20 flex flex-col gap-4">
            
            {!showAddCampaignForm ? (
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    setShowAddCampaignForm(true);
                    setNewCampTitle('');
                    setNewCampDuration('');
                    setNewCampType('flame');
                    setNewCampEndDate('');
                  }}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-500" /> Adicionar Novo Propósito
                </button>
                {onResetCampaigns && (
                  <button
                    type="button"
                    onClick={onResetCampaigns}
                    className="w-full py-2 bg-zinc-950/40 hover:bg-zinc-900/40 text-zinc-400 hover:text-amber-500 border border-zinc-800/50 hover:border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" /> Restaurar Propósitos Padrão
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3.5 shadow-inner">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Novo Propósito</span>
                  <button 
                    onClick={() => setShowAddCampaignForm(false)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Nome da Campanha</label>
                  <input
                    type="text"
                    value={newCampTitle}
                    onChange={(e) => setNewCampTitle(e.target.value)}
                    placeholder="Ex: Jejum de Daniel, Fogueira Santa..."
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Duração (Exibição)</label>
                  <input
                    type="text"
                    value={newCampDuration}
                    onChange={(e) => setNewCampDuration(e.target.value)}
                    placeholder="Ex: De 11 a 31 de Outubro, 21 Dias..."
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Estilo Visual</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setNewCampType('wifi_off')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        newCampType === 'wifi_off'
                          ? "bg-amber-500 border-amber-500 text-black shadow"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <WifiOff className="w-4 h-4" />
                      Sem Wi-Fi (Daniel)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampType('flame')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        newCampType === 'flame'
                          ? "bg-amber-500 border-amber-500 text-black shadow"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Flame className="w-4 h-4" />
                      Fogueira / Fogo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampType('globe')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        newCampType === 'globe'
                          ? "bg-amber-500 border-amber-500 text-black shadow"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      Evangelização
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampType('faith')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        newCampType === 'faith'
                          ? "bg-amber-500 border-amber-500 text-black shadow"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      Geral / Outros
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Data Limite (Opcional)</label>
                  <input
                    type="date"
                    value={newCampEndDate}
                    onChange={(e) => setNewCampEndDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 cursor-pointer font-sans"
                  />
                  <span className="text-[9px] text-zinc-500 mt-1">Sumiço automático dos slides ao passar da data</span>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleSaveCampaign}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Confirmar Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCampaignForm(false)}
                    className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* CAMPAIGNS LIST */}
            <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-1">
              {(customCampaigns || []).length === 0 ? (
                <div className="text-zinc-500 text-center py-6 text-xs italic bg-zinc-950/20 border border-dashed border-zinc-850 rounded-xl">
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
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs bg-zinc-950 border-zinc-850 transition-all ${
                        isExpired ? "opacity-45" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 max-w-[70%] text-left">
                        <div className="p-1.5 bg-zinc-900 border border-zinc-800 text-amber-500 rounded-lg shrink-0">
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
                          <span className="text-zinc-200 font-bold truncate leading-snug">{camp.title}</span>
                          <span className="text-zinc-500 text-[10px] truncate">{camp.duration}</span>
                          {camp.endDate && (
                            <span className="text-[9px] text-zinc-600 font-medium">Oculta após: {camp.endDate.split('-').reverse().join('/')}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {isExpired ? (
                          <span className="text-[9px] bg-red-500/10 border border-red-500/25 text-red-500 px-2 py-0.5 rounded font-bold">Expirado</span>
                        ) : (
                          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 px-2 py-0.5 rounded font-bold">Ativo</span>
                        )}
                        <button
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-900 hover:bg-red-950/20 rounded-lg text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
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
      </div>

    </div>
  );
}
