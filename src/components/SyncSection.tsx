import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Peer } from 'peerjs';
import QRCode from "react-qr-code";
import { Download, Upload, Laptop, Smartphone, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { getAllMediaItems, saveMediaItem, deleteMediaItem } from '../utils';

function getRealBlob(blobInput: any): Blob | null {
  if (!blobInput) return null;
  if (blobInput instanceof Blob) {
    return blobInput;
  }
  if (typeof blobInput === 'object') {
    const anyBlob = blobInput as any;
    if (anyBlob.buffer && (anyBlob.buffer instanceof ArrayBuffer || anyBlob.buffer instanceof Uint8Array || Array.isArray(anyBlob.buffer))) {
      return new Blob([anyBlob.buffer], { type: anyBlob.type || 'application/octet-stream' });
    }
    if (anyBlob.bytes && (anyBlob.bytes instanceof ArrayBuffer || anyBlob.bytes instanceof Uint8Array || Array.isArray(anyBlob.bytes))) {
      return new Blob([anyBlob.bytes], { type: anyBlob.type || 'application/octet-stream' });
    }
    if (anyBlob.blob && anyBlob.blob instanceof Blob) {
      return anyBlob.blob;
    }
  }
  return null;
}

async function blobToBase64(blobField: any): Promise<{ base64: string; mimeType: string }> {
  const realBlob = getRealBlob(blobField);
  if (!realBlob) {
    return { base64: '', mimeType: 'application/octet-stream' };
  }
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve(res.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(realBlob);
    });
    return { base64, mimeType: realBlob.type || 'application/octet-stream' };
  } catch (err) {
    console.error("Erro ao converter blob para base64:", err);
    return { base64: '', mimeType: realBlob.type || 'application/octet-stream' };
  }
}

export function SyncSection({ 
  showAlert, 
  showConfirm 
}: { 
  showAlert: (message: string, type?: 'error' | 'success' | 'info') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'info') => void;
}) {
  // States for local backup and restore (import/export)
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // States for direct wireless synchronization (PeerJS)
  const [directSyncStatus, setDirectSyncStatus] = useState<'idle' | 'initializing' | 'listening' | 'connecting' | 'sending' | 'receiving' | 'success' | 'error'>('idle');
  const [syncCode, setSyncCode] = useState(''); // Generated on receiver, typed on sender
  const [syncInputCode, setSyncInputCode] = useState(''); // Input value for manually typing the code
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
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

          if (data && data.type === 'MEDIA_SAVE') {
            const item = data.mediaItem;
            setSyncMessage(`Salvando mídia: ${item.name}`);
            window.dispatchEvent(new CustomEvent('projection_sync_progress', { detail: { message: `Recebendo mídia: ${item.name}` } }));
            
            const savePayload: any = {
              id: item.id,
              type: item.type,
              name: item.name,
              duration: item.duration,
              enabledInLoop: item.enabledInLoop,
              muted: item.muted,
              order: item.order,
              fit: item.fit
            };

            if (item.base64) {
              try {
                const byteCharacters = atob(item.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                savePayload.blob = new Blob([byteArray], { type: item.mimeType });
              } catch (err) {
                console.error("Erro ao decodificar base64:", item.name, err);
              }
            }

            await saveMediaItem(savePayload);
            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
            return;
          }

          if (data && data.type === 'MEDIA_DELETE') {
            await deleteMediaItem(data.id);
            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
            return;
          }

          if (data && data.type === 'SYNC_MANIFEST') {
            setSyncMessage('Comparando alterações com dados locais...');
            
            // 1. Restore/Update localStorage keys
            if (data.localStorage) {
              Object.entries(data.localStorage).forEach(([key, val]) => {
                localStorage.setItem(key, val as string);
              });
            }
            if (code) {
              localStorage.setItem('projection_lastPairedPeerCode', code);
            }

            // 2. Compare local media items vs manifest
            const localMedia = await getAllMediaItems();
            const manifestItems = data.mediaManifest || [];
            const manifestIds = new Set(manifestItems.map((m: any) => m.id));

            // Remove local items that were deleted on the remote side
            for (const localItem of localMedia) {
              if (!manifestIds.has(localItem.id)) {
                await deleteMediaItem(localItem.id);
              }
            }

            // Identify missing or changed items
            const localMap = new Map(localMedia.map(item => [item.id, item]));
            const missingIds: string[] = [];

            for (const item of manifestItems) {
              const local = localMap.get(item.id);
              const localSize = local?.blob ? local.blob.size : 0;
              if (!local || localSize !== item.size) {
                missingIds.push(item.id);
              } else {
                // Local item exists with exact same blob size -> update metadata only
                await saveMediaItem({
                  id: item.id,
                  type: item.type,
                  name: item.name,
                  duration: item.duration,
                  enabledInLoop: item.enabledInLoop,
                  muted: item.muted,
                  order: item.order,
                  fit: item.fit,
                  blob: local.blob
                });
              }
            }

            if (missingIds.length === 0) {
              // Zero missing items -> incremental sync complete!
              window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
              setDirectSyncStatus('success');
              setSyncMessage('Tudo sincronizado instantaneamente! (Sem re-download de mídias)');
              conn.send({ type: 'SYNC_COMPLETE', message: 'Tudo atualizado sem re-download' });
              return;
            }

            // Request ONLY missing media items
            setSyncMessage(`Sincronizando ${missingIds.length} alteração(ões) de mídia...`);
            conn.send({ type: 'REQUEST_DELTA_MEDIA', ids: missingIds });
            return;
          }

          if (data && data.type === 'REQUEST_DELTA_MEDIA') {
            const requestedIds = new Set(data.ids || []);
            const allMedia = await getAllMediaItems();
            const mediaToTransfer = allMedia.filter(item => requestedIds.has(item.id));
            
            const serializedMedia = await Promise.all(
              mediaToTransfer.map(async (item, index) => {
                const progress = Math.round(((index + 1) / mediaToTransfer.length) * 100);
                window.dispatchEvent(new CustomEvent('projection_sync_progress', { 
                  detail: { message: `Enviando alteração (${index + 1}/${mediaToTransfer.length}): ${item.name}`, progress } 
                }));
                const { base64, mimeType } = await blobToBase64(item.blob);
                return {
                  id: item.id,
                  type: item.type,
                  name: item.name,
                  duration: item.duration,
                  enabledInLoop: item.enabledInLoop,
                  muted: item.muted,
                  order: item.order,
                  fit: item.fit,
                  mimeType,
                  base64
                };
              })
            );

            conn.send({
              type: 'DELTA_MEDIA_ITEMS',
              mediaItems: serializedMedia
            });
            return;
          }

          if (data && data.type === 'DELTA_MEDIA_ITEMS') {
            const items = data.mediaItems || [];
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              const progress = Math.round(((i + 1) / items.length) * 100);
              window.dispatchEvent(new CustomEvent('projection_sync_progress', { 
                detail: { message: `Recebendo alteração (${i + 1}/${items.length}): ${item.name}`, progress } 
              }));
              
              let blob: Blob | undefined = undefined;
              if (item.base64 && item.base64.trim().length > 0) {
                try {
                  const byteCharacters = atob(item.base64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let j = 0; j < byteCharacters.length; j++) {
                    byteNumbers[j] = byteCharacters.charCodeAt(j);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  blob = new Blob([byteArray], { type: item.mimeType || 'application/octet-stream' });
                } catch (e) {
                  console.error("Erro ao decodificar base64:", item.name, e);
                }
              }

              await saveMediaItem({
                id: item.id,
                type: item.type,
                name: item.name,
                duration: item.duration,
                enabledInLoop: item.enabledInLoop,
                muted: item.muted,
                order: item.order,
                fit: item.fit,
                blob
              });
            }

            window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
            setDirectSyncStatus('success');
            setSyncMessage('Sincronização incremental de mídias concluída!');
            return;
          }

          if (data && data.type === 'SYNC_COMPLETE') {
            window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
            setDirectSyncStatus('success');
            setSyncMessage('Dados sincronizados e prontos para uso.');
            return;
          }

          if (data && data.type === 'REQUEST_FULL_SYNC') {
            setSyncMessage('Central de Controle conectada! Comparando lista de dados...');
            const storageData: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('projection_')) {
                const val = localStorage.getItem(key);
                if (val !== null) storageData[key] = val;
              }
            }
            const mediaItems = await getAllMediaItems();
            const mediaManifest = mediaItems.map(item => ({
              id: item.id,
              type: item.type,
              name: item.name,
              duration: item.duration,
              enabledInLoop: item.enabledInLoop,
              muted: item.muted,
              order: item.order,
              fit: item.fit,
              size: item.blob ? item.blob.size : 0
            }));

            conn.send({
              type: 'SYNC_MANIFEST',
              version: 1,
              localStorage: storageData,
              mediaManifest
            });
            return;
          }

          if (!data || data.version !== 1) {
            throw new Error('Formato de dados inválido.');
          }

          setSyncMessage('Dados recebidos! Gravando e aplicando configurações...');
          window.dispatchEvent(new CustomEvent('projection_sync_progress', { detail: { message: 'Gravando configurações no PC...', progress: 10 } }));

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
            const total = data.mediaItems.length;
            for (let i = 0; i < total; i++) {
              const item = data.mediaItems[i];
              const progress = Math.round(10 + (i / total) * 85);
              window.dispatchEvent(new CustomEvent('projection_sync_progress', { detail: { message: `Restaurando mídia (${i+1}/${total}): ${item.name}`, progress } }));
              
              let blob: Blob | undefined = undefined;
              if (item.base64 && item.base64.trim().length > 0) {
                try {
                  const byteCharacters = atob(item.base64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let j = 0; j < byteCharacters.length; j++) {
                    byteNumbers[j] = byteCharacters.charCodeAt(j);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  blob = new Blob([byteArray], { type: item.mimeType || 'application/octet-stream' });
                } catch (e) {
                  console.error("Erro ao decodificar base64:", item.name, e);
                }
              }

              const savePayload: any = {
                id: item.id,
                type: item.type,
                name: item.name,
                duration: item.duration,
                enabledInLoop: item.enabledInLoop,
                muted: item.muted,
                order: item.order,
                fit: item.fit
              };

              if (blob) {
                savePayload.blob = blob;
              }

              await saveMediaItem(savePayload);
            }
          }

          window.dispatchEvent(new CustomEvent('projection_sync_progress', { detail: { message: 'Sincronização concluída!', progress: 100 } }));
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

    peer.on('error', (err: any) => {
      // Evita logs excessivos para erros comuns de conexão
      if (err.type === 'peer-unavailable' || err.type === 'disconnected' || err.type === 'network') {
        console.warn('PeerJS (Aviso): Conexão temporariamente indisponível.', err.type);
      } else if (err.type === 'unavailable-id') {
        console.error('Erro: ID já está em uso. Tentando gerar novo código...');
        localStorage.removeItem('projection_myReceiverCode');
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'pc') {
          setTimeout(() => startReceiver(), 1000);
        }
      } else {
        console.error('Erro no receptor PeerJS:', err);
      }

      const role = localStorage.getItem('projection_deviceRole');
      if (role === 'pc') {
        setDirectSyncStatus('initializing');
        setSyncMessage('Rede instável. Tentando restabelecer conexão...');
        
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          startReceiver();
        }, 5000);
      }
    });

    peer.on('disconnected', () => {
      console.log("PeerJS: Desconectado do servidor. Tentando reconectar...");
      peer.reconnect();
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

      // Listen to data from PC (for both full sync and real-time state updates)
      conn.on('data', async (incomingData: any) => {
        try {
          if (incomingData && incomingData.type === 'UPDATE_STATE') {
            const bc = new BroadcastChannel('holyrics_projection_sync');
            bc.postMessage({ type: 'UPDATE_STATE', key: incomingData.key, value: incomingData.value });
            bc.close();
            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: incomingData.key, value: incomingData.value } }));
            return;
          }

          if (incomingData && incomingData.type === 'MEDIA_SAVE') {
            const item = incomingData.mediaItem;
            
            const savePayload: any = {
              id: item.id,
              type: item.type,
              name: item.name,
              duration: item.duration,
              enabledInLoop: item.enabledInLoop,
              muted: item.muted,
              order: item.order,
              fit: item.fit
            };

            if (item.base64 && item.base64.trim().length > 0) {
              try {
                const byteCharacters = atob(item.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                savePayload.blob = new Blob([byteArray], { type: item.mimeType || 'application/octet-stream' });
              } catch (err) {
                console.error("Erro ao decodificar base64 no sender:", item.name, err);
              }
            }

            await saveMediaItem(savePayload);
            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
            return;
          }

          if (incomingData && incomingData.type === 'MEDIA_DELETE') {
            await deleteMediaItem(incomingData.id);
            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
            return;
          }

          if (incomingData && incomingData.type === 'FULL_SYNC') {
            setSyncMessage('Dados recebidos do PC! Sincronizando celular...');
            if (incomingData.localStorage) {
              Object.entries(incomingData.localStorage).forEach(([key, val]) => {
                localStorage.setItem(key, val as string);
              });
            }
            if (incomingData.mediaItems && Array.isArray(incomingData.mediaItems)) {
              for (const item of incomingData.mediaItems) {
                let blob: Blob | undefined = undefined;
                if (item.base64 && item.base64.trim().length > 0) {
                  try {
                    const byteCharacters = atob(item.base64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    blob = new Blob([byteArray], { type: item.mimeType || 'application/octet-stream' });
                  } catch (e) {
                    console.error("Erro ao decodificar base64 do PC:", item.name, e);
                  }
                }

                const savePayload: any = {
                  id: item.id,
                  type: item.type,
                  name: item.name,
                  duration: item.duration,
                  enabledInLoop: item.enabledInLoop,
                  muted: item.muted,
                  order: item.order,
                  fit: item.fit
                };

                if (blob) {
                  savePayload.blob = blob;
                }

                await saveMediaItem(savePayload);
              }
            }
            setDirectSyncStatus('success');
            setSyncMessage('Sincronizado! Dados importados do PC com sucesso.');
            setIsPulling(false);
            window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
          }
        } catch (e) {
          console.error("Erro ao processar dados recebidos do PC:", e);
        }
      });

      conn.on('open', async () => {
        setDirectSyncStatus('sending');
        setSyncMessage('Conectado! Verificando configurações do celular...');

        try {
          // Salva este targetCode como pareado e define papel como Celular
          localStorage.setItem('projection_lastPairedPeerCode', targetCode.toUpperCase().trim());
          localStorage.setItem('projection_deviceRole', 'phone');

          // Check if this phone has custom data or is empty
          const mediaItems = await getAllMediaItems();
          const hasCustomMeetings = localStorage.getItem('projection_customMeetings') !== null;
          const hasCustomCampaigns = localStorage.getItem('projection_customCampaigns') !== null;

          if (mediaItems.length === 0 && !hasCustomMeetings && !hasCustomCampaigns) {
            setSyncMessage('Celular limpo. Importando agenda, eventos e mídias do PC...');
            conn.send({ type: 'REQUEST_FULL_SYNC', version: 1 });
            
            // Save globally for real-time control
            (window as any).holyrics_peer_conn = conn;

            // Cleanup URL query params if any
            if (window.location.search.includes('syncCode=')) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            return;
          }

          // Gather localStorage keys
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

          const mediaManifest = mediaItems.map(item => ({
            id: item.id,
            type: item.type,
            name: item.name,
            duration: item.duration,
            enabledInLoop: item.enabledInLoop,
            muted: item.muted,
            order: item.order,
            fit: item.fit,
            size: item.blob ? item.blob.size : 0
          }));

          const payload = {
            type: 'SYNC_MANIFEST',
            version: 1,
            localStorage: storageData,
            mediaManifest
          };

          conn.send(payload);

          // Save globally for real-time control
          (window as any).holyrics_peer_conn = conn;

          setDirectSyncStatus('success');
          setSyncMessage('Conectado! Verificando alterações incrementais...');

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

    peer.on('error', (err: any) => {
      if (err.type !== 'peer-unavailable' && err.type !== 'disconnected') {
        console.error('Erro no remetente PeerJS:', err);
      }
      
      const role = localStorage.getItem('projection_deviceRole');
      if (role === 'phone') {
        setDirectSyncStatus('connecting');
        setSyncMessage('Rede instável no celular. Reconectando...');
        triggerAutoReconnect(targetCode);
      } else {
        setDirectSyncStatus('error');
        setSyncMessage('Erro de conexão. Verifique a internet.');
      }
    });

    peer.on('disconnected', () => {
      peer.reconnect();
    });
  };

  const forcePushToPC = async () => {
    const conn = connRef.current;
    if (!conn) {
      showAlert("Conexão inativa. Reconecte primeiro.", "error");
      return;
    }

    setIsPushing(true);
    setSyncMessage("Verificando alterações para o PC...");
    try {
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

      const mediaItems = await getAllMediaItems();
      const mediaManifest = mediaItems.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        duration: item.duration,
        enabledInLoop: item.enabledInLoop,
        muted: item.muted,
        order: item.order,
        fit: item.fit,
        size: item.blob ? item.blob.size : 0
      }));

      conn.send({
        type: 'SYNC_MANIFEST',
        version: 1,
        localStorage: storageData,
        mediaManifest
      });

      setSyncMessage("Manifesto transmitido ao PC. Atualizando deltas...");
    } catch (err) {
      console.error(err);
      setSyncMessage("Erro ao transmitir os dados.");
    } finally {
      setIsPushing(false);
    }
  };

  const forcePullFromPC = () => {
    const conn = connRef.current;
    if (!conn) {
      showAlert("Conexão inativa. Reconecte primeiro.", "error");
      return;
    }
    setIsPulling(true);
    setSyncMessage("Solicitando dados completos do PC...");
    conn.send({ type: 'REQUEST_FULL_SYNC', version: 1 });
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
            if (!(item.blob instanceof Blob)) {
              resolve('');
              return;
            }
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
            mimeType: (item.blob instanceof Blob) ? item.blob.type : 'application/octet-stream',
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
              Escolha o papel deste aparelho para iniciar a conexão automática:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={startReceiver}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 text-[11px] font-bold py-2 px-3 rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all h-20"
              >
                <Laptop className="w-5 h-5 text-yellow-500" />
                <span>TERMINAL (PC)</span>
                <span className="text-[8px] opacity-50 uppercase tracking-tighter">Recebe e Projeta</span>
              </button>
              <button
                onClick={() => setDirectSyncStatus('connecting')}
                className="bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 text-[11px] font-bold py-2 px-3 rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all h-20"
              >
                <Smartphone className="w-5 h-5 text-yellow-500" />
                <span>CONTROLE (Celular)</span>
                <span className="text-[8px] opacity-50 uppercase tracking-tighter">Edita e Comanda</span>
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
          <div className="flex flex-col items-center gap-3.5 py-3.5 bg-emerald-950/20 border border-emerald-800 rounded-xl p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500 text-emerald-400 font-bold text-lg animate-bounce">
              ✓
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-emerald-400 block">Sincronização Ativa & Conectado!</span>
              <p className="text-[10px] text-stone-300 mt-2 max-w-xs mx-auto leading-relaxed">
                Você já está sincronizado! Os dados locais e todas as mídias foram transmitidos para o PC automaticamente.
              </p>
              <p className="text-[10px] text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Agora, qualquer comando, alteração de mídias, dízimos, hinos ou avisos que fizer no celular se refletirá na tela de projeção em tempo real de forma automática.
              </p>
            </div>

            {localStorage.getItem('projection_deviceRole') === 'phone' && syncMessage && (
              <div className="w-full bg-stone-900/40 border border-stone-850 p-2.5 rounded-lg text-center mt-1">
                <span className="text-[9.5px] text-yellow-500/90 font-mono tracking-wide block leading-normal">
                  Status: {syncMessage}
                </span>
              </div>
            )}

            <div className="flex gap-4 justify-center items-center mt-1 border-t border-stone-800/60 pt-3 w-full">
              <button
                onClick={() => setDirectSyncStatus('idle')}
                className="text-stone-300 hover:text-white text-[10px] bg-stone-800 border border-stone-700 px-3 py-1.5 rounded-lg cursor-pointer transition-all font-bold"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('projection_deviceRole');
                  if (peerRef.current) peerRef.current.destroy();
                  setDirectSyncStatus('idle');
                }}
                className="text-stone-500 hover:text-stone-300 text-[10px] underline cursor-pointer"
              >
                Desconectar / Trocar papel
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
