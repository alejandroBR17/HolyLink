import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Peer } from 'peerjs';
import QRCode from "react-qr-code";
import { Download, Upload, Laptop, Smartphone, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { getAllMediaItems, saveMediaItem } from '../utils';

export function SyncSection() {
  // States for local backup and restore (import/export)
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // States for direct wireless synchronization (PeerJS)
  const [directSyncStatus, setDirectSyncStatus] = useState<'idle' | 'initializing' | 'listening' | 'connecting' | 'sending' | 'receiving' | 'success' | 'error'>('idle');
  const [syncCode, setSyncCode] = useState(''); // Generated on receiver, typed on sender
  const [syncInputCode, setSyncInputCode] = useState(''); // Input value for manually typing the code
  const [syncMessage, setSyncMessage] = useState<string>('');
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Helper to generate a clean random ID
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Cleanup peer and timeouts on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const triggerAutoReconnect = (targetCode: string) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    const savedRole = localStorage.getItem('projection_deviceRole');
    if (savedRole === 'phone') {
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Tentando reconectar automaticamente ao PC...");
        connectAndSendData(targetCode);
      }, 4000); // Tenta reconectar a cada 4 segundos se perder conexão
    }
  };

  // Initialize as Receiver (usually on PC)
  const startReceiver = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    setDirectSyncStatus('initializing');
    setSyncMessage('Iniciando conexão segura...');
    
    const savedCode = localStorage.getItem('projection_myReceiverCode');
    const code = savedCode || generateRandomCode();
    if (!savedCode) {
      localStorage.setItem('projection_myReceiverCode', code);
    }
    setSyncCode(code);
    
    // Salva o papel do dispositivo como PC para reconexão automática ao recarregar
    localStorage.setItem('projection_deviceRole', 'pc');
    
    const peerId = `holyrics_${code}`;
    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      setDirectSyncStatus('listening');
      setSyncMessage('Aguardando conexão do celular...');
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setDirectSyncStatus('receiving');
      setSyncMessage('Celular conectado! Recebendo configurações e mídias...');

      // Guarda conexão para qualquer comunicação de volta
      (window as any).holyrics_peer_conn = conn;

      conn.on('data', async (data: any) => {
        try {
          if (data && data.type === 'UPDATE_STATE') {
            // Forward real-time state update to BroadcastChannel
            const bc = new BroadcastChannel('holyrics_projection_sync');
            bc.postMessage({ type: 'UPDATE_STATE', key: data.key, value: data.value });
            bc.close();
            
            // Dispatch custom event for App.tsx to catch if needed
            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: data.key, value: data.value } }));
            return;
          }

          if (!data || data.version !== 1) {
            throw new Error('Formato de dados inválido.');
          }

          setSyncMessage('Dados recebidos! Gravando no banco de dados e aplicando...');

          // 1. Restore localStorage
          if (data.localStorage) {
            Object.entries(data.localStorage).forEach(([key, val]) => {
              localStorage.setItem(key, val as string);
            });
          }

          // Salva código pareado para consistência de reconexão
          if (code) {
            localStorage.setItem('projection_lastPairedPeerCode', code);
          }

          // 2. Restore IndexedDB media files
          if (data.mediaItems && Array.isArray(data.mediaItems)) {
            for (const item of data.mediaItems) {
              const byteCharacters = atob(item.base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: item.mimeType });

              await saveMediaItem({
                id: item.id,
                type: item.type,
                name: item.name,
                duration: item.duration,
                enabledInLoop: item.enabledInLoop,
                muted: item.muted,
                order: item.order,
                blob: blob
              });
            }
          }

          setDirectSyncStatus('success');
          setSyncMessage('Dados recebidos! Aplicativo sincronizado e controle remoto ativo.');
          
          // Notify App.tsx to reload states from localStorage without refreshing the page
          window.dispatchEvent(new CustomEvent('projection_full_sync_received'));

        } catch (err) {
          console.error('Erro na recepção dos dados:', err);
          setDirectSyncStatus('error');
          setSyncMessage('Falha ao receber os dados. Verifique a conexão e tente novamente.');
        }
      });

      conn.on('close', () => {
        console.log("Conexão com o celular fechada.");
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'pc') {
          setDirectSyncStatus('listening');
          setSyncMessage('Celular desconectado. Aguardando nova conexão...');
        }
      });

      conn.on('error', (err) => {
        console.error('Erro na conexão com celular:', err);
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'pc') {
          setDirectSyncStatus('listening');
          setSyncMessage('Conexão perdida com celular. Aguardando reconexão...');
        }
      });
    });

    peer.on('error', (err) => {
      console.error('Erro no receptor PeerJS:', err);
      const role = localStorage.getItem('projection_deviceRole');
      if (role === 'pc') {
        setDirectSyncStatus('initializing');
        setSyncMessage('Conexão de rede falhou no PC. Reiniciando receptor em 5s...');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          startReceiver();
        }, 5000);
      } else {
        setDirectSyncStatus('error');
        setSyncMessage('Não foi possível iniciar a sincronização sem fios. Verifique se está conectado à internet.');
      }
    });
  };

  // Initialize as Sender (usually on Mobile/Celular) and send data to the receiver ID
  const connectAndSendData = async (targetCode: string) => {
    if (!targetCode) return;
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setDirectSyncStatus('connecting');
    setSyncMessage('Conectando ao outro dispositivo...');

    const peer = new Peer(); // Random sender ID
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(`holyrics_${targetCode.toUpperCase().trim()}`);
      connRef.current = conn;

      conn.on('open', async () => {
        setDirectSyncStatus('sending');
        setSyncMessage('Conectado! Preparando e enviando arquivos e ordem dos slides...');

        try {
          // 1. Gather localStorage keys
          const storageData: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('projection_')) {
              const val = localStorage.getItem(key);
              if (val !== null) {
                storageData[key] = val;
              }
            }
          }

          // Salva este targetCode como pareado e define papel como Celular
          localStorage.setItem('projection_lastPairedPeerCode', targetCode.toUpperCase().trim());
          localStorage.setItem('projection_deviceRole', 'phone');

          // 2. Gather media items from IndexedDB
          const mediaItems = await getAllMediaItems();
          const serializedMedia = await Promise.all(
            mediaItems.map(async (item) => {
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const res = reader.result as string;
                  resolve(res.split(',')[1] || '');
                };
                reader.onerror = reject;
                reader.readAsDataURL(item.blob);
              });

              return {
                id: item.id,
                type: item.type,
                name: item.name,
                duration: item.duration,
                enabledInLoop: item.enabledInLoop,
                muted: item.muted,
                order: item.order,
                mimeType: item.blob.type,
                base64: base64
              };
            })
          );

          const payload = {
            version: 1,
            localStorage: storageData,
            mediaItems: serializedMedia
          };

          conn.send(payload);

          // Save globally for real-time control
          (window as any).holyrics_peer_conn = conn;

          setDirectSyncStatus('success');
          setSyncMessage('Sincronizado e pronto para controle em tempo real!');

          // Cleanup URL query params if any
          if (window.location.search.includes('syncCode=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

        } catch (err) {
          console.error('Erro ao preparar dados:', err);
          const role = localStorage.getItem('projection_deviceRole');
          if (role === 'phone') {
            setDirectSyncStatus('connecting');
            setSyncMessage('Erro ao ler mídias. Tentando reconectar...');
            triggerAutoReconnect(targetCode);
          } else {
            setDirectSyncStatus('error');
            setSyncMessage('Erro ao preparar mídias para envio. Tente novamente.');
          }
        }
      });

      conn.on('close', () => {
        console.log("Conexão com o PC fechada.");
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'phone') {
          setDirectSyncStatus('connecting');
          setSyncMessage('Conexão perdida. Reconectando ao PC automaticamente...');
          triggerAutoReconnect(targetCode);
        }
      });

      conn.on('error', (err) => {
        console.error('Erro na conexão com o destino:', err);
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'phone') {
          setDirectSyncStatus('connecting');
          setSyncMessage('PC offline ou reiniciando. Tentando reconectar...');
          triggerAutoReconnect(targetCode);
        } else {
          setDirectSyncStatus('error');
          setSyncMessage('Não foi possível conectar ao PC. Verifique se o código está correto e ativo.');
        }
      });
    });

    peer.on('error', (err) => {
      console.error('Erro no remetente PeerJS:', err);
      const role = localStorage.getItem('projection_deviceRole');
      if (role === 'phone') {
        setDirectSyncStatus('connecting');
        setSyncMessage('Erro de rede. Tentando reconectar ao PC...');
        triggerAutoReconnect(targetCode);
      } else {
        setDirectSyncStatus('error');
        setSyncMessage('Erro de conexão. Verifique se ambos os aparelhos têm acesso à internet.');
      }
    });
  };

  // Auto-connect / Auto-start on load if previously selected a device role
  useEffect(() => {
    const savedRole = localStorage.getItem('projection_deviceRole');
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('syncCode');

    if (codeFromUrl) {
      // Se possui código na URL, assumimos o papel de Celular automaticamente e conectamos
      localStorage.setItem('projection_deviceRole', 'phone');
      const timer = setTimeout(() => {
        connectAndSendData(codeFromUrl);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (savedRole === 'pc' || !savedRole) {
      // Se era PC, ou se é a primeira vez sem papel definido, inicia receptor silenciosa e imediatamente
      localStorage.setItem('projection_deviceRole', 'pc');
      const timer = setTimeout(() => {
        startReceiver();
      }, 500);
      return () => clearTimeout(timer);
    } else if (savedRole === 'phone') {
      // Se era Celular, tenta reconectar ao último PC pareado se houver
      const lastPaired = localStorage.getItem('projection_lastPairedPeerCode');
      if (lastPaired) {
        setSyncInputCode(lastPaired);
        const timer = setTimeout(() => {
          connectAndSendData(lastPaired);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleExportBackup = async () => {
    setIsExporting(true);
    setBackupMessage(null);
    try {
      // 1. Gather localStorage keys starting with "projection_"
      const storageData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('projection_')) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            storageData[key] = val;
          }
        }
      }

      // 2. Gather media items from IndexedDB
      const mediaItems = await getAllMediaItems();
      const serializedMedia = await Promise.all(
        mediaItems.map(async (item) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = reject;
            reader.readAsDataURL(item.blob);
          });

          return {
            id: item.id,
            type: item.type,
            name: item.name,
            duration: item.duration,
            enabledInLoop: item.enabledInLoop,
            muted: item.muted,
            order: item.order,
            mimeType: item.blob.type,
            base64: base64
          };
        })
      );

      const backupObj = {
        version: 1,
        timestamp: Date.now(),
        localStorage: storageData,
        mediaItems: serializedMedia
      };

      const blob = new Blob([JSON.stringify(backupObj)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
      a.href = url;
      a.download = `holyrics_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupMessage({ type: 'success', text: 'Backup exportado com sucesso!' });
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      setBackupMessage({ type: 'error', text: 'Falha ao exportar backup. Tente novamente.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setBackupMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data || data.version !== 1) {
          throw new Error('Arquivo de backup inválido.');
        }

        // 1. Restore localStorage keys
        if (data.localStorage) {
          Object.entries(data.localStorage).forEach(([key, val]) => {
            localStorage.setItem(key, val as string);
          });
        }

        // 2. Restore media items to IndexedDB
        if (data.mediaItems && Array.isArray(data.mediaItems)) {
          for (const item of data.mediaItems) {
            const byteCharacters = atob(item.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: item.mimeType });

            await saveMediaItem({
              id: item.id,
              type: item.type,
              name: item.name,
              duration: item.duration,
              enabledInLoop: item.enabledInLoop,
              muted: item.muted,
              order: item.order,
              blob: blob
            });
          }
        }

        setBackupMessage({ type: 'success', text: 'Backup importado! Reiniciando...' });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        console.error('Erro ao importar backup:', err);
        setBackupMessage({ type: 'error', text: 'Falha ao importar o arquivo. Verifique se o arquivo está correto.' });
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setBackupMessage({ type: 'error', text: 'Erro ao ler arquivo.' });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#121212] border border-stone-800 rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
        <Smartphone className="w-4.5 h-4.5 text-yellow-500" />
        Sincronização e Backup
      </h2>
      
      <p className="text-xs text-stone-400 leading-relaxed">
        Transfira toda a configuração do seu celular para o PC (ordem dos slides, mídias, etc.) sem fios de forma <strong>100% gratuita</strong> e direta!
      </p>

      {/* OPÇÃO 1: SINCRONIZAÇÃO DIRETA SEM FIO */}
      <div className="border border-stone-800/80 bg-[#0c0c0c] rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sincronização Direta sem Fios
        </div>

        {directSyncStatus === 'idle' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-stone-500 leading-normal">
              Escolha o papel deste aparelho para iniciar a conexão automática via rede/internet:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={startReceiver}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 text-[11px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Laptop className="w-3.5 h-3.5 text-yellow-500" />
                Este é o PC (Receber)
              </button>
              <button
                onClick={() => setDirectSyncStatus('connecting')}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 text-[11px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Smartphone className="w-3.5 h-3.5 text-yellow-500" />
                Este é o Celular (Enviar)
              </button>
            </div>

            {localStorage.getItem('projection_lastPairedPeerCode') && (
              <button
                onClick={() => {
                  const code = localStorage.getItem('projection_lastPairedPeerCode');
                  if (code) connectAndSendData(code);
                }}
                className="w-full bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reconectar ao último PC ({localStorage.getItem('projection_lastPairedPeerCode')})
              </button>
            )}

            {localStorage.getItem('projection_myReceiverCode') && (
              <div className="text-[10px] text-stone-500 text-center mt-1">
                Seu código fixo deste PC: <span className="font-mono text-stone-400">{localStorage.getItem('projection_myReceiverCode')}</span>
              </div>
            )}
          </div>
        )}

        {/* RECEIVER STATE (PC IS WAITING) */}
        {(directSyncStatus === 'initializing' || directSyncStatus === 'listening' || directSyncStatus === 'receiving') && (
          <div className="flex flex-col items-center gap-3 py-2 bg-stone-950/60 p-3 rounded-lg border border-stone-900">
            <span className="text-[11px] text-yellow-500 font-medium flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {syncMessage}
            </span>

            {syncCode && (
              <div className="flex flex-col items-center gap-2.5 w-full">
                {/* QR CODE FOR PHONE SCANNING */}
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  <QRCode
                    value={`${window.location.origin}${window.location.pathname}?syncCode=${syncCode}`}
                    size={120}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-stone-500 block mb-0.5">Código para digitação manual:</span>
                  <span className="font-mono text-lg font-black text-white bg-stone-900 border border-stone-800 px-3 py-1 rounded tracking-widest">
                    {syncCode}
                  </span>
                </div>

                <div className="text-[10px] text-stone-400 bg-stone-900/40 p-2.5 rounded-md text-center leading-normal border border-stone-850">
                  <strong>No seu celular:</strong> abra a câmera nativa, aponte para o QR Code acima e toque no link. Os dados serão enviados imediatamente!
                </div>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('projection_deviceRole');
                if (peerRef.current) peerRef.current.destroy();
                setDirectSyncStatus('idle');
              }}
              className="text-stone-500 hover:text-stone-300 text-[10px] underline cursor-pointer mt-1"
            >
              Alterar papel (PC/Celular) ou Cancelar
            </button>
          </div>
        )}

        {/* SENDER STATE (MOBILE CONNECTING/TYPING CODE) */}
        {(directSyncStatus === 'connecting' || directSyncStatus === 'sending') && (
          <div className="flex flex-col gap-3 py-2 bg-stone-950/60 p-3 rounded-lg border border-stone-900">
            <span className="text-[11px] text-yellow-500 font-medium flex items-center gap-1.5 self-center">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {syncMessage}
            </span>

            {directSyncStatus === 'connecting' && (
              <div className="flex flex-col gap-2 w-full">
                <label className="text-[10px] text-stone-400 font-bold uppercase">Código do PC:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código"
                    value={syncInputCode}
                    onChange={(e) => setSyncInputCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs font-mono text-white flex-1 focus:outline-none focus:border-stone-700 text-center uppercase tracking-widest"
                  />
                  <button
                    onClick={() => connectAndSendData(syncInputCode)}
                    disabled={!syncInputCode || syncInputCode.length !== 6}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50 transition-all cursor-pointer shadow-md"
                  >
                    Sincronizar
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 leading-normal">
                  Digite o código de 6 letras exibido na tela do computador para iniciar a transferência de mídias e ordens de slides.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('projection_deviceRole');
                if (peerRef.current) peerRef.current.destroy();
                setDirectSyncStatus('idle');
              }}
              className="text-stone-500 hover:text-stone-300 text-[10px] underline cursor-pointer mt-1 self-center"
            >
              Alterar papel ou Voltar
            </button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {directSyncStatus === 'success' && (
          <div className="flex flex-col items-center gap-2 py-3 bg-emerald-950/20 border border-emerald-800 rounded-lg p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500 text-emerald-400 font-bold text-lg animate-bounce">
              ✓
            </div>
            <span className="text-xs font-bold text-emerald-400">Sucesso Absoluto!</span>
            <p className="text-[11px] text-stone-400 leading-snug">
              {syncMessage}
            </p>
            <div className="flex gap-3 justify-center mt-1">
              <button
                onClick={() => setDirectSyncStatus('idle')}
                className="text-stone-300 hover:text-white text-[10px] bg-stone-900 border border-stone-800 px-3 py-1 rounded cursor-pointer transition-all"
              >
                Painel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('projection_deviceRole');
                  if (peerRef.current) peerRef.current.destroy();
                  setDirectSyncStatus('idle');
                }}
                className="text-stone-500 hover:text-stone-300 text-[10px] underline cursor-pointer"
              >
                Alterar papel
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {directSyncStatus === 'error' && (
          <div className="flex flex-col items-center gap-2 py-3 bg-red-950/20 border border-red-800 rounded-lg p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500 text-red-400 font-bold text-lg">
              ✕
            </div>
            <span className="text-xs font-bold text-red-400 font-sans">Falha na Sincronização</span>
            <p className="text-[11px] text-stone-400 leading-snug">
              {syncMessage}
            </p>
            <div className="flex flex-col gap-1 items-center mt-1 w-full">
              <button
                onClick={() => {
                  const lastPaired = localStorage.getItem('projection_lastPairedPeerCode');
                  if (lastPaired) {
                    connectAndSendData(lastPaired);
                  } else {
                    setDirectSyncStatus('connecting');
                  }
                }}
                className="w-full bg-stone-900 border border-stone-800 text-stone-300 text-[10px] py-1.5 px-3 rounded-md cursor-pointer transition-all"
              >
                Tentar Reconectar
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('projection_deviceRole');
                  if (peerRef.current) peerRef.current.destroy();
                  setDirectSyncStatus('idle');
                }}
                className="text-stone-500 hover:text-stone-300 text-[10px] underline cursor-pointer mt-1"
              >
                Alterar papel ou Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OPÇÃO 2: BACKUP MANUAL VIA ARQUIVOS */}
      <div className="border border-stone-800/50 bg-[#0a0a0a] rounded-xl p-3 flex flex-col gap-2.5">
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
          Backup Manual via Arquivos (.json)
        </span>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportBackup}
            disabled={isExporting || isImporting}
            className="bg-stone-900 border border-stone-850 hover:border-stone-700 hover:bg-stone-850 text-stone-300 text-[10px] font-bold py-2.5 px-3 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 text-stone-500 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? "Gerando..." : "Baixar .json"}
          </button>

          <label
            className={`bg-stone-900 border border-stone-850 hover:border-stone-700 hover:bg-stone-850 text-stone-300 text-[10px] font-bold py-2.5 px-3 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Upload className={`w-3.5 h-3.5 text-stone-500 ${isImporting ? 'animate-pulse' : ''}`} />
            {isImporting ? "Lendo..." : "Enviar .json"}
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              disabled={isExporting || isImporting}
              className="hidden"
            />
          </label>
        </div>

        {backupMessage && (
          <div className={`text-[10px] p-2 rounded border text-center ${
            backupMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
              : 'bg-red-950/40 border-red-800 text-red-400'
          }`}>
            {backupMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
