import React from 'react';
import { motion } from 'motion/react';
import { 
  CalendarDays, Plus, X, ArrowDown, Edit2, Trash2, Globe, Flame 
} from 'lucide-react';
import { Meeting } from '../../types';

interface Campaign {
  id: string;
  title: string;
  duration: string;
  iconType: 'flame' | 'globe' | 'faith';
  endDate?: string; // Optional automatic hide limit
}

interface AgendaPanelProps {
  customMeetings: Meeting[];
  customCampaigns: Campaign[];
  updateStateAndBroadcast: (key: string, value: any) => void;
  newMeetTheme: string;
  setNewMeetTheme: (v: string) => void;
  newMeetType: 'weekly' | 'one_time';
  setNewMeetType: (v: 'weekly' | 'one_time') => void;
  newMeetWeeklyDay: number;
  setNewMeetWeeklyDay: (v: number) => void;
  newMeetDate: string;
  setNewMeetDate: (v: string) => void;
  newMeetTime: string;
  setNewMeetTime: (v: string) => void;
  showAddMeetingForm: boolean;
  setShowAddMeetingForm: (v: boolean) => void;
  editingMeetId: string | null;
  setEditingMeetId: (v: string | null) => void;
  
  newCampTitle: string;
  setNewCampTitle: (v: string) => void;
  newCampDuration: string;
  setNewCampDuration: (v: string) => void;
  newCampType: 'flame' | 'globe' | 'faith';
  setNewCampType: (v: 'flame' | 'globe' | 'faith') => void;
  newCampEndDate: string;
  setNewCampEndDate: (v: string) => void;
  showAddCampaignForm: boolean;
  setShowAddCampaignForm: (v: boolean) => void;
  
  isMeetingPanelOpen: boolean;
  setIsMeetingPanelOpen: (v: boolean) => void;
  isCampaignPanelOpen: boolean;
  setIsCampaignPanelOpen: (v: boolean) => void;
}

export function AgendaPanel({
  customMeetings,
  customCampaigns,
  updateStateAndBroadcast,
  newMeetTheme,
  setNewMeetTheme,
  newMeetType,
  setNewMeetType,
  newMeetWeeklyDay,
  setNewMeetWeeklyDay,
  newMeetDate,
  setNewMeetDate,
  newMeetTime,
  setNewMeetTime,
  showAddMeetingForm,
  setShowAddMeetingForm,
  editingMeetId,
  setEditingMeetId,
  
  newCampTitle,
  setNewCampTitle,
  newCampDuration,
  setNewCampDuration,
  newCampType,
  setNewCampType,
  newCampEndDate,
  setNewCampEndDate,
  showAddCampaignForm,
  setShowAddCampaignForm,
  
  isMeetingPanelOpen,
  setIsMeetingPanelOpen,
  isCampaignPanelOpen,
  setIsCampaignPanelOpen
}: AgendaPanelProps) {

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
      const updated = customMeetings.map(m => m.id === editingMeetId ? mObject : m);
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
    const updated = customMeetings.filter(m => m.id !== id);
    updateStateAndBroadcast('customMeetings', updated);
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
    const updated = customCampaigns.filter(c => c.id !== id);
    updateStateAndBroadcast('customCampaigns', updated);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in duration-200">
      
      {/* MEETS COLUMN */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col h-fit">
        <button
          onClick={() => setIsMeetingPanelOpen(!isMeetingPanelOpen)}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-950/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 animate-pulse">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Gerenciar Agenda & Eventos</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">{customMeetings.length} reuniões registradas</p>
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
            <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
              {customMeetings.length === 0 ? (
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
      <div className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col h-fit">
        <button
          onClick={() => setIsCampaignPanelOpen(!isCampaignPanelOpen)}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-950/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Propósitos de Fé & Campanhas</h3>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">{customCampaigns.length} campanhas registradas</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isCampaignPanelOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ArrowDown className="w-4 h-4 text-zinc-500" />
          </motion.div>
        </button>

        {isCampaignPanelOpen && (
          <div className="p-5 border-t border-zinc-800/50 bg-zinc-950/20 flex flex-col gap-4">
            
            {!showAddCampaignForm ? (
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
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setNewCampType('flame')}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        newCampType === 'flame'
                          ? "bg-amber-500 border-amber-500 text-black shadow"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Flame className="w-4 h-4" />
                      Fogo / Jejum
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampType('globe')}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
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
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        newCampType === 'faith'
                          ? "bg-amber-500 border-amber-500 text-black shadow"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      Propósito Geral
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
            <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
              {customCampaigns.length === 0 ? (
                <div className="text-zinc-500 text-center py-6 text-xs italic bg-zinc-950/20 border border-dashed border-zinc-850 rounded-xl">
                  Nenhuma campanha cadastrada.
                </div>
              ) : (
                customCampaigns.map((camp) => {
                  // Check if expired
                  let isExpired = false;
                  if (camp.endDate) {
                    const end = new Date(camp.endDate + 'T23:59:59');
                    if (new Date() > end) isExpired = true;
                  }

                  return (
                    <div 
                      key={camp.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs bg-zinc-950 border-zinc-850 transition-all ${
                        isExpired ? "opacity-45" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 max-w-[70%] text-left">
                        <div className="p-1.5 bg-zinc-900 border border-zinc-800 text-amber-500 rounded-lg shrink-0">
                          {camp.iconType === 'flame' ? <Flame className="w-4 h-4" /> : camp.iconType === 'globe' ? <Globe className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
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
