import {BackgroundControls} from './BackgroundControls';
import {BrowserPermissions} from '../BrowserPermissions';
import {ShortcutsGuide} from './ShortcutsGuide';
import {ConsoleIntro, ConsoleGroupTitle} from './ConsoleIntro';
import React, { FormEvent, useState, useEffect, useRef } from 'react';
import {ExternalLink, X, EyeOff, Plus, Minus, Play, Pause, SlidersHorizontal, Eye, Eraser, ListVideo, Hand, Timer, RotateCcw, Waves, MessageSquareText, Keyboard, Bell, Trash2, Send, VolumeX, Volume2, Megaphone, Gauge, HardDrive, Monitor, Download, Baby, Car, Key, CloudRain, Droplets, ArrowRightLeft} from 'lucide-react';
import { ALERTS } from '../../data';
import { Meeting } from '../../types';
import { getSetting, saveSetting } from '../../utils';
import { usePerformanceDiagnostics } from '../../utils/performance';
import { useWakeLock } from '../../hooks/useWakeLock';
import { PWAInstallModal } from '../PWAInstallModal';

function PerformanceControlModule() {
  const {isSupported,isActive,enable,disable} = useWakeLock(false);
  const {fps,hardwareConcurrency,mode,effectiveMode,setPerformanceMode,report,purgeCache} = usePerformanceDiagnostics();
  const [message,setMessage] = useState('');
  return <section className="settings-card"><header><Gauge size={19}/><div><h3>Qualidade deste aparelho</h3><p>Modo atual: {effectiveMode === 'high' ? 'Alta' : effectiveMode === 'light' ? 'Leve' : 'Equilibrada'}.</p></div></header>
    <p className="settings-hint">Dados deste aparelho e desta aba, não do PC remoto. RAM é aproximada; o navegador pode ocultar informações.</p>
    <div className="settings-diagnostics"><div><span>Atualização da aba</span><strong>{fps} FPS</strong></div><div><span>Processadores lógicos</span><strong>{hardwareConcurrency || 'Não informado'}</strong></div><div><span>RAM aproximada</span><strong>{report?.ramDisplay || 'Não informada'}</strong></div><div><span>Memória JavaScript</span><strong>{report?.jsHeapUsedMB !== undefined ? `${report.jsHeapUsedMB} MB` : 'Não informada'}</strong></div></div>
    <label className="settings-field">Perfil de qualidade<select value={mode} onChange={e => setPerformanceMode(e.target.value as 'auto'|'light'|'balanced'|'high')}><option value="auto">Automático · adapta ao aparelho</option><option value="light">Leve · transições simples</option><option value="balanced">Equilibrado</option><option value="high">Alta qualidade</option></select></label>
    <p className="settings-hint">Este perfil ajusta transições e detalhes locais. O estilo do fundo é escolhido em Fundos e efeitos.</p>
    <div className="settings-button-row"><button aria-pressed={isActive} disabled={!isSupported} onClick={async () => {if(isActive){await disable(); setMessage('Tela acesa desativada.');}else{const ok=await enable(); setMessage(ok ? 'Tela acesa ativada enquanto o navegador permitir.' : 'O navegador não permitiu manter a tela acesa.');}}}><Monitor size={18}/>{!isSupported ? 'Tela acesa indisponível' : isActive ? 'Desativar tela acesa' : 'Manter tela acesa'}</button><button onClick={() => {purgeCache(); setMessage('Cache de pré-carregamento limpo. Seus arquivos foram preservados.');}}><HardDrive size={18}/>Limpar cache de pré-carregamento</button></div>
    <p role="status" className="settings-feedback">{message}</p>
  </section>;
}

function AudioVolumeControl({
  volume,
  updateStateAndBroadcast
}: {
  volume: number;
  updateStateAndBroadcast: (key: string, value: any) => void;
}) {
  const [localVolume, setLocalVolume] = useState<number>(volume);
  const isDraggingRef = useRef<boolean>(false);
  const throttleTimerRef = useRef<any>(null);
  const latestVolume = useRef(volume);
  useEffect(() => () => {if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);},[]);

  // Keep local state in sync with external volume prop ONLY when not actively dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalVolume(volume);
    }
  }, [volume]);

  // Handle slider drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    latestVolume.current = newVal;
    setLocalVolume(newVal);

    // Throttle broadcast during dragging to avoid state echo stutter across dual screens
    if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        updateStateAndBroadcast('volume', latestVolume.current);
        throttleTimerRef.current = null;
      }, 30);
    }
  };

  const handlePointerDown = () => {
    isDraggingRef.current = true;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    updateStateAndBroadcast('volume', localVolume);
  };

  const handlePresetClick = (val: number) => {
    if (throttleTimerRef.current) {clearTimeout(throttleTimerRef.current); throttleTimerRef.current = null;}
    isDraggingRef.current = false;
    setLocalVolume(val);
    updateStateAndBroadcast('volume', val);
  };

  const displayVolume = isDraggingRef.current ? localVolume : volume;
  const volPercent = Math.round(displayVolume * 100);

  return <div className="settings-audio">
    <div className="settings-audio-level"><span>{displayVolume === 0 ? 'Áudio silenciado' : 'Volume das mídias'}</span><strong>{volPercent}%</strong></div>
    <div className="settings-audio-slider"><button aria-label={displayVolume === 0 ? 'Ativar áudio em 80%' : 'Silenciar áudio'} onClick={() => handlePresetClick(displayVolume === 0 ? .8 : 0)}>{displayVolume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button><input aria-label="Volume das mídias" type="range" min="0" max="1" step="0.01" value={displayVolume} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onBlur={handlePointerUp} onChange={handleSliderChange}/></div>
    <div className="settings-audio-presets" role="group" aria-label="Volumes rápidos">{[{label:'Mudo',val:0},{label:'20%',val:.2},{label:'50%',val:.5},{label:'80%',val:.8},{label:'100%',val:1}].map(item => <button key={item.label} aria-pressed={Math.abs(displayVolume-item.val)<.01} onClick={() => handlePresetClick(item.val)}>{item.label}</button>)}</div>
  </div>;
}

interface ControlsPanelProps {
  projectionWin: Window | null;
  setProjectionWin: (w: Window | null) => void;
  blackoutEnabled: boolean;
  clearContentEnabled: boolean;
  nextMeeting: Meeting|null;
  nextMeetingDate: Date|null;
  hoursStr: string;
  minutesStr: string;
  diffSeconds: number;
  countdownOffset: number;
  countdownPaused: boolean;
  pausedSeconds: number | null;
  activeAlert: string | null;
  volume: number;
  tickerText: string | null;
  background3DStyle?: 'auto' | 'aurora' | 'veil' | 'fju_aura' | 'particles_2d' | 'off';
  background3DFps?: 30 | 60;
  background3DIntensity?: 'high' | 'medium' | 'low';
  manualSlideOverride?: string | null;
  projectionMode?: 'pre' | 'post';
  updateStateAndBroadcast: (key: string, value: any) => void;
  currentTime: Date;
  isProjectionOpen?: boolean;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  showAlert?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function ControlsPanel({
  projectionWin,
  setProjectionWin,
  blackoutEnabled,
  clearContentEnabled,
  nextMeeting,
  nextMeetingDate,
  hoursStr,
  minutesStr,
  diffSeconds,
  countdownOffset,
  countdownPaused,
  pausedSeconds,
  activeAlert,
  volume,
  tickerText,
  background3DStyle = 'auto',
  background3DFps = 60,
  background3DIntensity = 'high',
  projectionMode = 'pre',
  manualSlideOverride,
  updateStateAndBroadcast,
  currentTime,
  isProjectionOpen = false,
  showToast,
  showAlert
}: ControlsPanelProps) {
  const notify = showToast || showAlert;
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [tickerDraft,setTickerDraft] = useState(tickerText || '');
  useEffect(() => setTickerDraft(tickerText || ''),[tickerText]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOpenMonitor = async () => {
    const projectionUrl = `${window.location.origin}${window.location.pathname}?projection`;
    try {
      let windowFeatures = 'width=1280,height=720,menubar=no,status=no,titlebar=no';

      // Attempt to use Window Management API (Screen Details)
      if ('getScreenDetails' in window) {
        try {
          const screenDetails = await (window as any).getScreenDetails();
          // Find the first screen that is NOT the current internal/primary screen
          const secondaryScreen = screenDetails.screens.find((s: any) => s !== screenDetails.currentScreen);

          if (secondaryScreen) {
            // Position the window on the secondary screen
            windowFeatures = `left=${secondaryScreen.availLeft},top=${secondaryScreen.availTop},width=${secondaryScreen.availWidth},height=${secondaryScreen.availHeight},menubar=no,status=no,titlebar=no,fullscreen=yes`;
          }
        } catch (err) {
          console.warn("Screen Details API permission denied or error:", err);
        }
      }

      const newWin = window.open(projectionUrl, 'holyrics_projection', windowFeatures);
      if (newWin) {
        setProjectionWin(newWin);
        if (newWin.document) {
          newWin.onload = () => {
            if (newWin.document.documentElement.requestFullscreen) {
              newWin.document.documentElement.requestFullscreen().catch(() => {});
            }
          };
        }
      } else {
        if (notify) notify('Janela do monitor foi bloqueada. Permita pop-ups no seu navegador.', 'error');
        return;
      }
    } catch (e) {
      console.warn("Could not open projection window:", e);
      if (notify) notify('Erro ao tentar abrir janela do monitor.', 'error');
      return;
    }
    updateStateAndBroadcast('isProjectionOpen', true);
    updateStateAndBroadcast('projectionCloseTrigger', null);
  };

  const handleCloseMonitor = () => {
    setProjectionWin(null);
    updateStateAndBroadcast('projectionCloseTrigger', Date.now().toString());
    updateStateAndBroadcast('isProjectionOpen', false);
  };

  const handleToggleTimerPlayPause = () => {
    if(!nextMeetingDate)return;
    if (countdownPaused) {
      const currentDiffMs = nextMeetingDate.getTime() - new Date().getTime();
      const currentDiffSec = Math.floor(currentDiffMs / 1000);
      const targetDiffSec = pausedSeconds || 0;
      const secondsToAdjust = targetDiffSec - currentDiffSec;
      updateStateAndBroadcast('countdownOffset', secondsToAdjust * 1000);
      updateStateAndBroadcast('countdownPaused', false);
      updateStateAndBroadcast('pausedSeconds', null);
    } else {
      updateStateAndBroadcast('countdownPaused', true);
      updateStateAndBroadcast('pausedSeconds', diffSeconds);
    }
  };

  const adjustTimer = (minutes:number) => {
    if(!nextMeetingDate)return;
    if(countdownPaused) updateStateAndBroadcast('pausedSeconds',Math.max(0,(pausedSeconds ?? diffSeconds)+minutes*60));
    else updateStateAndBroadcast('countdownOffset',countdownOffset+minutes*60000);
  };

  const handleResetTimer = () => {
    updateStateAndBroadcast('countdownOffset', 0);
    updateStateAndBroadcast('countdownPaused', false);
    updateStateAndBroadcast('pausedSeconds', null);
  };

  const [alertType, setAlertType] = useState<'custom' | 'car_plate' | 'ebi_child'>('custom');
  const [carPlate, setCarPlate] = useState('');
  const [carModel, setCarModel] = useState('');
  const [childName, setChildName] = useState('');
  const [alertHistory, setAlertHistory] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    getSetting('projection_alert_history', []).then(history => {
      if (!active) return;
      setAlertHistory(Array.isArray(history) ? history.filter((v:unknown) => typeof v === 'string' && v.length <= 500).slice(0,10) : []);
    }).catch(() => {});
    return () => {active = false;};
  }, []);

  const CHURCH_ALERT_PRESETS = [
    {
      id: 'baby',
      title: 'Berçário (EBI)',
      icon: Baby,
      msg: 'Atenção pais: Compareçam ao berçário (EBI).'
    },
    {
      id: 'car',
      title: 'Estacionamento',
      icon: Car,
      msg: 'Proprietário de veículo: Compareça ao estacionamento.'
    },
    {
      id: 'keys',
      title: 'Chave Achada',
      icon: Key,
      msg: 'Uma chave foi encontrada. Procurar a recepção ao final.'
    },
    {
      id: 'rain',
      title: 'Alerta de Chuva',
      icon: CloudRain,
      msg: 'Atenção condutores: Verificar janelas dos veículos.'
    },
    {
      id: 'workers',
      title: 'Reunião Obreiros',
      icon: Megaphone,
      msg: 'Breve reunião com todos os obreiros e colaboradores após a reunião.'
    }
  ];

  const handleSendAlertMessage = (message: string) => {
    if (!message.trim()) return;
    updateStateAndBroadcast('activeAlert', message.trim());

    // Save to history
    const updated = [message.trim(), ...alertHistory.filter(h => h !== message.trim())].slice(0, 10);
    setAlertHistory(updated);
    void saveSetting('projection_alert_history', updated).catch(() => notify?.('Não foi possível salvar o histórico neste aparelho.','error'));
  };

  const handleCustomAlertSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (alertType === 'car_plate') {
      if (!carPlate.trim()) return;
      const text = `Atenção: Veículo ${carModel ? carModel + ' ' : ''}placa ${carPlate.toUpperCase().trim()}, favor comparecer ao estacionamento.`;
      handleSendAlertMessage(text);
      setCarPlate('');
      setCarModel('');
    } else if (alertType === 'ebi_child') {
      if (!childName.trim()) return;
      const text = `Atenção: Responsável pela criança ${childName.trim()}, favor dirigir-se à EBI.`;
      handleSendAlertMessage(text);
      setChildName('');
    } else {
      const form = e.currentTarget;
      const input = form.elements.namedItem('customAlertText') as HTMLTextAreaElement;
      if (input && input.value.trim()) {
        handleSendAlertMessage(input.value.trim());
        input.value = "";
      }
    }
  };

  const handleDeleteHistoryItem = (idx: number) => {
    const updated = alertHistory.filter((_, i) => i !== idx);
    setAlertHistory(updated);
    void saveSetting('projection_alert_history', updated).catch(() => notify?.('Não foi possível salvar o histórico neste aparelho.','error'));
  };

  const tickerSuggestions = [
    "Seja muito bem-vindo à Casa de Deus!",
    "Por favor, silencie o seu aparelho celular para a reunião.",
    "EBI: Traga seus filhos para o Espaço Infantil durante a reunião.",
    "Participe da Corrente de Libertação nesta Sexta-feira.",
    "Reunião de Fé do Domingo: Traga toda a sua família!",
    "FJU: Encontro Jovem neste Sábado às 16h."
  ];

  return <div className="controls-workspace settings-workspace console-area">
    <ConsoleIntro icon={SlidersHorizontal} title="Ajustes da reunião" eyebrow="Operação ao vivo" description="Saída, ambiente e comunicação com controles próprios para toque." stats={[{label:'Saída',value:blackoutEnabled ? 'Tela preta' : clearContentEnabled ? 'Conteúdo oculto' : 'Visível'},{label:'Cronômetro',value:countdownPaused ? 'Pausado' : 'Em contagem'},{label:'Áudio',value:Math.round(volume*100)+'%'}]}/>
    <div className="settings-scope"><Monitor size={18}/><p>Os comandos da reunião controlam o PC quando conectado. Desempenho e tela acesa são ajustes deste aparelho.</p></div>
    <div className="console-settings-groups">
      <details open className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Monitor} title="Operação da reunião" description="Saída, fila e contagem regressiva." badge={projectionMode === 'post' ? 'Pós-reunião' : 'Pré-reunião'}/></summary><div className="settings-section-body">
        <section className="settings-card"><header><Eye size={19}/><div><h3>Visibilidade da saída</h3><p>Altera o que aparece no telão.</p></div></header>
          <div className="settings-choice-pair"><button aria-pressed={blackoutEnabled} onClick={() => updateStateAndBroadcast('blackoutEnabled',!blackoutEnabled)}><EyeOff size={20}/><span><strong>Blackout</strong><small>Oculta toda a imagem</small></span></button><button aria-pressed={clearContentEnabled} onClick={() => updateStateAndBroadcast('clearContentEnabled',!clearContentEnabled)}><Eraser size={20}/><span><strong>Limpar tela</strong><small>Mantém o fundo animado</small></span></button></div>
          <div className="settings-output-actions"><button className="settings-primary" onClick={isProjectionOpen ? handleCloseMonitor : handleOpenMonitor}>{isProjectionOpen ? <X size={18}/> : <ExternalLink size={18}/>} {isProjectionOpen ? 'Fechar segunda tela' : 'Abrir segunda tela'}</button><button onClick={() => setShowPwaModal(true)}><Download size={18}/>Instalar HolyLink</button></div>
          <p className="settings-hint">{isOnline ? 'Navegador com conexão à internet.' : 'Navegador sem conexão à internet.'} No celular, abra a segunda tela pelo PC. Uma janela aberta não confirma o HDMI.</p>
        </section>
        <section className="settings-card"><header><ListVideo size={19}/><div><h3>Fila e momentos especiais</h3><p>Escolha a sequência ou fixe um momento.</p></div></header>
          <div className="settings-choice-pair" role="group" aria-label="Modo da reunião">{(['pre','post'] as const).map(mode => <button key={mode} aria-pressed={projectionMode === mode} onClick={() => {updateStateAndBroadcast('projectionMode',mode); updateStateAndBroadcast('manualSlideOverride',null);}}><ArrowRightLeft size={18}/><span><strong>{mode === 'pre' ? 'Pré-reunião' : 'Pós-reunião'}</strong><small>{mode === 'pre' ? 'Entrada e preparação' : 'Encerramento e despedida'}</small></span></button>)}</div>
          <div className="settings-choice-pair" role="group" aria-label="Fixar momento">{([{id:'baptism',name:'Batismo',icon:Droplets},{id:'blessing',name:'Despedida',icon:Hand}] as const).map(item => <button key={item.id} aria-pressed={manualSlideOverride === item.id} onClick={() => {updateStateAndBroadcast('activeVerseIndex',null); updateStateAndBroadcast('customVerseText',null); updateStateAndBroadcast('customVerseRef',null); updateStateAndBroadcast('manualSlideOverride',manualSlideOverride === item.id ? null : item.id);}}><item.icon size={19}/><strong>{manualSlideOverride === item.id ? 'Soltar ' : 'Fixar '}{item.name}</strong></button>)}</div>
          {(manualSlideOverride === 'baptism' || manualSlideOverride === 'blessing') && <div className="settings-pinned"><p role="status">{manualSlideOverride === 'baptism' ? 'Batismo' : 'Despedida'} fixado. A fila continua preservada.</p><button className="settings-primary settings-resume" onClick={() => updateStateAndBroadcast('manualSlideOverride',null)}><Play size={18}/><span>Voltar à fila normal</span></button></div>}
        </section>
        <section className="settings-card settings-wide"><header><Timer size={19}/><div><h3>Contagem regressiva</h3><p>{nextMeeting?`${nextMeeting.dayName}, às ${nextMeeting.time} · ${nextMeeting.theme}`:'Cadastre uma reunião futura na Agenda para ativar a contagem.'}</p></div></header><div className="settings-timer-display"><strong>{hoursStr}:{minutesStr}</strong><span>{!nextMeeting ? 'Sem próxima reunião' : countdownPaused ? 'Contagem pausada' : 'Até a próxima reunião'}{countdownOffset ? ' · horário ajustado' : ''}</span></div>
          <div className="settings-timer-adjust"><fieldset disabled={!nextMeetingDate} className="settings-time-add"><legend><Plus size={17}/>Aumentar contagem</legend><div>{[1,5,30].map(n => <button key={n} aria-label={`Acrescentar ${n} minuto${n>1?'s':''}`} onClick={() => adjustTimer(n)}><Plus size={16}/>{n} min</button>)}</div></fieldset><fieldset disabled={!nextMeetingDate} className="settings-time-subtract"><legend><Minus size={17}/>Diminuir contagem</legend><div>{[1,5,30].map(n => <button key={n} aria-label={`Diminuir ${n} minuto${n>1?'s':''}`} onClick={() => adjustTimer(-n)}><Minus size={16}/>{n} min</button>)}</div></fieldset></div>
          <div className="settings-button-row"><button disabled={!nextMeetingDate} onClick={handleToggleTimerPlayPause}>{countdownPaused ? <Play size={18}/> : <Pause size={18}/>} {countdownPaused ? 'Retomar contagem' : 'Pausar contagem'}</button><button disabled={!nextMeetingDate} onClick={handleResetTimer}><RotateCcw size={18}/>Restaurar horário da agenda</button></div>
        </section>
      </div></details>
      <details open className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Waves} title="Fundos e efeitos" description="Escolha o ambiente e confira a animação." badge={background3DStyle === 'off' ? 'Desligado' : 'Visual selecionado'}/></summary><div className="settings-section-body settings-single"><BackgroundControls style={background3DStyle} fps={background3DFps} intensity={background3DIntensity} update={updateStateAndBroadcast}/></div></details>
      <details className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Megaphone} title="Avisos, áudio e letreiro" description="Recados, faixa inferior e volume das mídias." badge={activeAlert ? 'Aviso em exibição' : 'Sem aviso'}/></summary><div className="settings-section-body">
        <section className="settings-card settings-wide"><header><Bell size={19}/><div><h3>Avisos no telão</h3><p>Os avisos rápidos aparecem assim que você toca.</p></div></header>
          {activeAlert && <div className="settings-live-message"><span>Em exibição</span><p>{activeAlert === 'baby' ? ALERTS.baby.message : activeAlert === 'car' ? ALERTS.car.message : activeAlert}</p><button onClick={() => updateStateAndBroadcast('activeAlert',null)}><X size={18}/>Retirar aviso</button></div>}
          <div className="settings-alert-presets">{CHURCH_ALERT_PRESETS.map(preset => <button key={preset.id} aria-pressed={activeAlert === preset.id || activeAlert === preset.msg} onClick={() => updateStateAndBroadcast('activeAlert',activeAlert === preset.id || activeAlert === preset.msg ? null : preset.msg)}><preset.icon size={20}/><span><strong>{preset.title}</strong><small>{preset.msg}</small></span></button>)}</div>
          <form onSubmit={handleCustomAlertSubmit} className="settings-form"><label htmlFor="settings-alert-type">Preparar um aviso personalizado</label><select id="settings-alert-type" value={alertType} onChange={e => setAlertType(e.target.value as typeof alertType)}><option value="custom">Texto livre</option><option value="car_plate">Veículo no estacionamento</option><option value="ebi_child">Responsável por uma criança</option></select>
            {alertType === 'custom' && <label>Mensagem<textarea name="customAlertText" required maxLength={500} rows={3} placeholder="Escreva o recado para o telão"/></label>}
            {alertType === 'car_plate' && <div className="settings-form-pair"><label>Placa do veículo<input required maxLength={10} autoCapitalize="characters" value={carPlate} onChange={e => setCarPlate(e.target.value.toUpperCase())} placeholder="ABC1D23"/></label><label>Modelo ou cor (opcional)<input maxLength={60} value={carModel} onChange={e => setCarModel(e.target.value)} placeholder="Onix prata"/></label></div>}
            {alertType === 'ebi_child' && <label>Nome da criança<input required maxLength={80} value={childName} onChange={e => setChildName(e.target.value)} autoComplete="off"/></label>}
            <button className="settings-primary" type="submit"><Send size={18}/>Enviar aviso ao telão</button>
          </form>
          {!!alertHistory.length && <details className="settings-recent"><summary>Reutilizar avisos recentes ({alertHistory.length})</summary><ul>{alertHistory.map((msg,index) => <li key={msg}><button onClick={() => handleSendAlertMessage(msg)} aria-label={`Reenviar aviso: ${msg}`}><RotateCcw size={17}/><span>{msg}</span></button><button aria-label={`Excluir aviso do histórico: ${msg}`} onClick={() => handleDeleteHistoryItem(index)}><Trash2 size={18}/></button></li>)}</ul></details>}
        </section>
        <section className="settings-card"><header><MessageSquareText size={19}/><div><h3>Letreiro na faixa inferior</h3><p>Prepare o texto e toque em Exibir.</p></div></header>{tickerText && <div className="settings-live-message"><span>Em exibição</span><p>{tickerText}</p></div>}<form className="settings-form" onSubmit={e => {e.preventDefault(); if(tickerDraft.trim()) updateStateAndBroadcast('tickerText',tickerDraft.trim());}}><label>Texto do letreiro<textarea value={tickerDraft} onChange={e => setTickerDraft(e.target.value)} required maxLength={500} rows={3}/></label><div className="settings-button-row"><button type="submit" className="settings-primary" disabled={!tickerDraft.trim()}><Send size={18}/>Exibir letreiro</button>{tickerText && <button type="button" onClick={() => {updateStateAndBroadcast('tickerText',null); setTickerDraft('');}}><X size={18}/>Retirar letreiro</button>}</div></form><details className="settings-recent"><summary>Sugestões de mensagens</summary><div className="settings-suggestions">{tickerSuggestions.map(suggestion => <button key={suggestion} onClick={() => setTickerDraft(suggestion)}>{suggestion}</button>)}</div></details></section>
        <section className="settings-card"><header><Volume2 size={19}/><div><h3>Áudio das mídias</h3><p>Volume compartilhado com a projeção.</p></div></header><AudioVolumeControl volume={volume} updateStateAndBroadcast={updateStateAndBroadcast}/><p className="settings-hint">O volume físico do PC e das caixas de som continua sendo ajustado nos próprios aparelhos.</p></section>
      </div></details>
      <details className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Gauge} title="Desempenho e energia" description="Qualidade, permissões e tela acesa neste aparelho."/></summary><div className="settings-section-body settings-single"><PerformanceControlModule/><div className="settings-card"><BrowserPermissions/></div></div></details>
      <details className="holy-disclosure console-settings-group"><summary><ConsoleGroupTitle icon={Keyboard} title="Atalhos de teclado" description="Comandos organizados por função."/></summary><div className="settings-section-body settings-single"><ShortcutsGuide/></div></details>
    </div><PWAInstallModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)}/>
  </div>;
}
