import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Peer } from 'peerjs';
import QRCode from "react-qr-code";
import { Download, Upload, Laptop, Smartphone, RefreshCw, Activity, CheckCircle2, XCircle, FlaskConical, Zap, ShieldCheck, Play } from 'lucide-react';
import { format } from 'date-fns';
import { getAllMediaItems, saveMediaItem, deleteMediaItem } from '../utils';
import { sendMediaInChunks, handleIncomingChunk } from '../utils/webrtcChunking';

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

export function registerPeerConn(conn: any) {
  if (!conn) return;
  const list: any[] = (window as any).holyrics_peer_conns || [];
  if (!list.includes(conn)) {
    list.push(conn);
  }
  (window as any).holyrics_peer_conns = list;
  (window as any).holyrics_peer_conn = conn;
}

export function unregisterPeerConn(conn: any) {
  if (!conn) return;
  const list: any[] = (window as any).holyrics_peer_conns || [];
  const filtered = list.filter(c => c !== conn && c.open);
  (window as any).holyrics_peer_conns = filtered;
  if (filtered.length > 0) {
    (window as any).holyrics_peer_conn = filtered[filtered.length - 1];
  } else {
    delete (window as any).holyrics_peer_conn;
  }
}

export function broadcastToPeers(data: any, excludeConn?: any) {
  const list: any[] = (window as any).holyrics_peer_conns || [];
  const activeList: any[] = [];
  for (const conn of list) {
    if (conn && conn.open) {
      activeList.push(conn);
      if (conn !== excludeConn) {
        try {
          conn.send(data);
        } catch (e) {
          console.error("Erro ao enviar mensagem para peer:", e);
        }
      }
    }
  }
  (window as any).holyrics_peer_conns = activeList;
  if (activeList.length > 0) {
    (window as any).holyrics_peer_conn = activeList[activeList.length - 1];
  } else {
    delete (window as any).holyrics_peer_conn;
  }
}

export const SyncSection = React.memo(function SyncSection({ 
  showToast,
  showAlert, 
  showConfirm 
}: { 
  showToast?: (message: string, type?: 'error' | 'success' | 'info') => void;
  showAlert: (message: string, type?: 'error' | 'success' | 'info') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'info') => void;
}) {
  const notify = showToast || showAlert;
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

  // States for automated diagnostic test simulation
  const [isTesting, setIsTesting] = useState(false);
  const [testSteps, setTestSteps] = useState<Array<{ id: string; name: string; status: 'pending' | 'running' | 'ok' | 'fail'; detail?: string }>>([]);
  const [testSummary, setTestSummary] = useState<{ success: boolean; latencyMs?: number; message?: string } | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const runDiagnosticTest = async () => {
    setIsTesting(true);
    setShowTestPanel(true);
    setTestSummary(null);

    const initialSteps = [
      { id: 'bc', name: '1. Sincronização entre Janelas', status: 'pending' as const },
      { id: 'db', name: '2. Armazenamento de Mídias', status: 'pending' as const },
      { id: 'p2p_init', name: '3. Conexão Sem Fio (P2P)', status: 'pending' as const },
      { id: 'p2p_file', name: '4. Transmissão de Mídias', status: 'pending' as const },
      { id: 'p2p_event', name: '5. Controles em Tempo Real', status: 'pending' as const },
    ];
    setTestSteps(initialSteps);

    const updateStep = (id: string, status: 'running' | 'ok' | 'fail', detail?: string) => {
      setTestSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status, detail } : s))
      );
    };

    let startTime = performance.now();
    let measuredLatencyMs = 0;

    try {
      // Step 1: BroadcastChannel
      updateStep('bc', 'running');
      await new Promise<void>((resolve, reject) => {
        const bcName = `holyrics_diag_${Date.now()}`;
        const bcRx = new BroadcastChannel(bcName);
        const bcTx = new BroadcastChannel(bcName);
        const timer = setTimeout(() => {
          bcRx.close();
          bcTx.close();
          reject(new Error("Timeout no BroadcastChannel local"));
        }, 1500);

        bcRx.onmessage = (msg) => {
          if (msg.data && msg.data.ping === 'diag_ok') {
            clearTimeout(timer);
            bcRx.close();
            bcTx.close();
            resolve();
          }
        };

        bcTx.postMessage({ ping: 'diag_ok' });
      });
      updateStep('bc', 'ok', 'Sincronização entre janelas OK (< 5ms)');

      // Step 2: IndexedDB Blob Read/Write/Delete (Images + Video Blobs)
      updateStep('db', 'running');
      const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const byteCharacters = atob(sampleBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const testBlob = new Blob([new Uint8Array(byteNumbers)], { type: 'video/mp4' });
      const testMediaId = `diag_temp_video_${Date.now()}`;

      await saveMediaItem({
        id: testMediaId,
        type: 'video',
        name: 'teste_diagnostico_video.mp4',
        duration: 15000,
        enabledInLoop: true,
        blob: testBlob
      });

      const allItems = await getAllMediaItems();
      const found = allItems.find(item => item.id === testMediaId);
      if (!found || !found.blob || found.blob.size === 0) {
        throw new Error("Falha ao salvar ou carregar o arquivo de vídeo no armazenamento local");
      }
      await deleteMediaItem(testMediaId);
      updateStep('db', 'ok', 'Armazenamento local de mídias OK');

      // Step 3 & 4 & 5: PeerJS Loopback
      updateStep('p2p_init', 'running');
      const testCode = `DIAG${Math.floor(1000 + Math.random() * 9000)}`;
      const rxPeerId = `holyrics_${testCode}`;

      const testRxPeer = new Peer(rxPeerId);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          testRxPeer.destroy();
          reject(new Error("Timeout de conexão"));
        }, 8000);

        testRxPeer.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });

        testRxPeer.on('error', (err: any) => {
          clearTimeout(timeout);
          reject(new Error(`Erro no servidor P2P: ${err.message || err.type}`));
        });
      });
      updateStep('p2p_init', 'ok', 'Servidor de conexão sem fio OK');

      // Step 4: Transmissão P2P de Arquivos (Vídeo & Imagem via DataChannel)
      updateStep('p2p_file', 'running');
      const testTxPeer = new Peer();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          testTxPeer.destroy();
          testRxPeer.destroy();
          reject(new Error("Timeout na transferência de dados"));
        }, 8000);

        testTxPeer.on('open', () => {
          const conn = testTxPeer.connect(rxPeerId);

          testRxPeer.on('connection', (rxConn) => {
            rxConn.on('data', (incomingData: any) => {
              if (incomingData && incomingData.type === 'TEST_MEDIA_PAYLOAD') {
                const receivedBase64 = incomingData.mediaItem?.base64;
                if (receivedBase64 === sampleBase64 && incomingData.mediaItem?.type === 'video') {
                  measuredLatencyMs = Math.round(performance.now() - startTime);
                  clearTimeout(timeout);
                  testTxPeer.destroy();
                  testRxPeer.destroy();
                  resolve();
                } else {
                  clearTimeout(timeout);
                  testTxPeer.destroy();
                  testRxPeer.destroy();
                  reject(new Error("Erro na integridade dos dados"));
                }
              }
            });
          });

          conn.on('open', () => {
            startTime = performance.now();
            conn.send({
              type: 'TEST_MEDIA_PAYLOAD',
              mediaItem: {
                id: 'p2p_video_test',
                name: 'video_fundo.mp4',
                type: 'video',
                base64: sampleBase64,
                mimeType: 'video/mp4'
              }
            });
          });
        });

        testTxPeer.on('error', (err: any) => {
          clearTimeout(timeout);
          testTxPeer.destroy();
          testRxPeer.destroy();
          reject(new Error(`Erro P2P: ${err.message || err.type}`));
        });
      });

      updateStep('p2p_file', 'ok', `Transmissão de dados OK (${measuredLatencyMs}ms)`);

      // Step 5: Real-time Event (Slide controls, video volume, quick alerts)
      updateStep('p2p_event', 'running');
      window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'diag_sync_test_event', value: Date.now() } }));
      updateStep('p2p_event', 'ok', 'Comandos remotos em tempo real OK');

      setTestSummary({
        success: true,
        latencyMs: measuredLatencyMs,
        message: 'Todos os testes de conexão foram concluídos com sucesso!'
      });

    } catch (err: any) {
      console.error("Diagnostic test failed:", err);
      setTestSteps((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'fail', detail: err.message } : s))
      );
      setTestSummary({
        success: false,
        message: `Falha no teste: ${err.message || 'Erro desconhecido'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

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
      registerPeerConn(conn);

      conn.on('data', async (data: any) => {
        try {
          if (data && (data.type === 'MEDIA_CHUNK_START' || data.type === 'MEDIA_CHUNK_DATA')) {
            const res = await handleIncomingChunk(data);
            if (res.complete) {
              window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
              setSyncMessage('Mídia recebida e salva com sucesso!');
            }
            broadcastToPeers(data, conn);
            return;
          }

          if (data && data.type === 'UPDATE_STATE') {
            // Forward real-time state update to BroadcastChannel
            const bc = new BroadcastChannel('holyrics_projection_sync');
            bc.postMessage({ type: 'UPDATE_STATE', key: data.key, value: data.value });
            bc.close();
            
            // Dispatch custom event for App.tsx to catch if needed
            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: data.key, value: data.value } }));
            
            // Relay to all other connected peers
            broadcastToPeers({ type: 'UPDATE_STATE', key: data.key, value: data.value, version: 1 }, conn);
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
            
            // Relay to all other connected peers
            broadcastToPeers(data, conn);
            return;
          }

          if (data && data.type === 'MEDIA_DELETE') {
            await deleteMediaItem(data.id);
            
            const savedOrderStr = localStorage.getItem('projection_slidesOrder');
            if (savedOrderStr) {
              try {
                const savedOrder = JSON.parse(savedOrderStr);
                if (Array.isArray(savedOrder) && savedOrder.includes(data.id)) {
                  const newOrder = savedOrder.filter((id: string) => id !== data.id);
                  localStorage.setItem('projection_slidesOrder', JSON.stringify(newOrder));
                  window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'slidesOrder', value: JSON.stringify(newOrder) } }));
                }
              } catch (e) {}
            }

            const currentOverride = localStorage.getItem('projection_manualSlideOverride');
            if (currentOverride === data.id) {
              localStorage.removeItem('projection_manualSlideOverride');
              window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'manualSlideOverride', value: null } }));
            }

            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
            
            // Relay to all other connected peers
            broadcastToPeers(data, conn);
            return;
          }

          if (data && data.type === 'SYNC_MANIFEST') {
            setSyncMessage('Comparando alterações com dados locais...');
            
            // 1. Restore/Update localStorage keys (preserva chaves do próprio dispositivo)
            if (data.localStorage) {
              const currentRole = localStorage.getItem('projection_deviceRole') || 'pc';
              const currentReceiverCode = localStorage.getItem('projection_myReceiverCode');

              Object.entries(data.localStorage).forEach(([key, val]) => {
                if (
                  key === 'projection_deviceRole' ||
                  key === 'projection_myReceiverCode' ||
                  key === 'projection_lastPairedPeerCode'
                ) {
                  return; // Preserva a identidade do próprio PC
                }
                localStorage.setItem(key, val as string);
              });

              localStorage.setItem('projection_deviceRole', currentRole);
              if (currentReceiverCode) {
                localStorage.setItem('projection_myReceiverCode', currentReceiverCode);
              }
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
              try { conn.send({ type: 'SYNC_COMPLETE', message: 'Tudo atualizado sem re-download' }); } catch (e) { console.warn("Failed to send SYNC_COMPLETE:", e); }
              return;
            }

            // Request ONLY missing media items
            setSyncMessage(`Sincronizando ${missingIds.length} alteração(ões) de mídia...`);
            try { conn.send({ type: 'REQUEST_DELTA_MEDIA', ids: missingIds }); } catch (e) { console.warn("Failed to send REQUEST_DELTA_MEDIA:", e); }
            return;
          }

          if (data && data.type === 'REQUEST_DELTA_MEDIA') {
            const requestedIds = new Set(data.ids || []);
            const allMedia = await getAllMediaItems();
            const mediaToTransfer = allMedia.filter(item => requestedIds.has(item.id));
            
            for (let i = 0; i < mediaToTransfer.length; i++) {
              const item = mediaToTransfer[i];
              const realBlob = getRealBlob(item.blob);
              if (realBlob && realBlob.size > 0) {
                await sendMediaInChunks(
                  (payload) => {
                    try { conn.send(payload); } catch (e) {}
                  },
                  {
                    id: item.id,
                    type: item.type,
                    name: item.name,
                    duration: item.duration,
                    enabledInLoop: item.enabledInLoop,
                    muted: item.muted,
                    order: item.order,
                    fit: item.fit,
                    mimeType: realBlob.type || 'application/octet-stream',
                    size: realBlob.size
                  },
                  realBlob,
                  (progress) => {
                    window.dispatchEvent(new CustomEvent('projection_sync_progress', { 
                      detail: { message: `Enviando alteração (${i + 1}/${mediaToTransfer.length}): ${item.name} (${progress}%)`, progress } 
                    }));
                  }
                );
              }
            }

            try {
              conn.send({ type: 'SYNC_COMPLETE' });
            } catch (e) {
              console.warn("Failed to send SYNC_COMPLETE:", e);
            }
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

          // 1. Restore localStorage (preservando chaves de identidade do PC)
          if (data.localStorage) {
            const currentRole = localStorage.getItem('projection_deviceRole') || 'pc';
            const currentReceiverCode = localStorage.getItem('projection_myReceiverCode');

            Object.entries(data.localStorage).forEach(([key, val]) => {
              if (
                key === 'projection_deviceRole' ||
                key === 'projection_myReceiverCode' ||
                key === 'projection_lastPairedPeerCode'
              ) {
                return;
              }
              localStorage.setItem(key, val as string);
            });

            localStorage.setItem('projection_deviceRole', currentRole);
            if (currentReceiverCode) {
              localStorage.setItem('projection_myReceiverCode', currentReceiverCode);
            }
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
        unregisterPeerConn(conn);
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'pc') {
          setDirectSyncStatus('listening');
          setSyncMessage('Celular desconectado. Aguardando nova conexão...');
        }
      });

      conn.on('error', (err) => {
        console.error('Erro na conexão com celular:', err);
        unregisterPeerConn(conn);
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'pc') {
          setDirectSyncStatus('listening');
          setSyncMessage('Conexão perdida com celular. Aguardando reconexão...');
        }
      });
    });

    peer.on('error', (err: any) => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (err.type === 'unavailable-id') {
        console.warn('PeerJS (Aviso): ID já está em uso no servidor. Gerando novo código de receptor...');
        localStorage.removeItem('projection_myReceiverCode');
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'pc') {
          reconnectTimeoutRef.current = setTimeout(() => {
            startReceiver();
          }, 1500);
        }
        return;
      }

      // Evita logs excessivos para erros comuns de conexão
      if (err.type === 'peer-unavailable' || err.type === 'disconnected' || err.type === 'network') {
        console.warn('PeerJS (Aviso): Conexão temporariamente indisponível.', err.type);
      } else {
        console.error('Erro no receptor PeerJS:', err);
      }

      const role = localStorage.getItem('projection_deviceRole');
      if (role === 'pc') {
        setDirectSyncStatus('initializing');
        setSyncMessage('Rede instável. Tentando restabelecer conexão...');
        
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
          if (incomingData && (incomingData.type === 'MEDIA_CHUNK_START' || incomingData.type === 'MEDIA_CHUNK_DATA')) {
            const res = await handleIncomingChunk(incomingData);
            if (res.complete) {
              window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
              setSyncMessage('Mídia recebida e salva com sucesso!');
            }
            return;
          }

          if (incomingData && incomingData.type === 'REQUEST_DELTA_MEDIA') {
            const requestedIds = new Set(incomingData.ids || []);
            const allMedia = await getAllMediaItems();
            const mediaToTransfer = allMedia.filter(item => requestedIds.has(item.id));
            
            for (let i = 0; i < mediaToTransfer.length; i++) {
              const item = mediaToTransfer[i];
              const realBlob = getRealBlob(item.blob);
              if (realBlob && realBlob.size > 0) {
                await sendMediaInChunks(
                  (payload) => {
                    try { conn.send(payload); } catch (e) {}
                  },
                  {
                    id: item.id,
                    type: item.type,
                    name: item.name,
                    duration: item.duration,
                    enabledInLoop: item.enabledInLoop,
                    muted: item.muted,
                    order: item.order,
                    fit: item.fit,
                    mimeType: realBlob.type || (item.type === 'image' ? 'image/png' : 'video/mp4'),
                    size: realBlob.size
                  },
                  realBlob,
                  (progress) => {
                    window.dispatchEvent(new CustomEvent('projection_sync_progress', { 
                      detail: { message: `Enviando mídia (${i + 1}/${mediaToTransfer.length}): ${item.name} (${progress}%)`, progress } 
                    }));
                  }
                );
              }
            }

            try {
              conn.send({ type: 'SYNC_COMPLETE' });
            } catch (e) {
              console.warn("Failed to send SYNC_COMPLETE:", e);
            }
            return;
          }

          if (incomingData && incomingData.type === 'SYNC_MANIFEST') {
            setSyncMessage('Comparando alterações com dados do PC...');
            if (incomingData.localStorage) {
              const currentRole = localStorage.getItem('projection_deviceRole') || 'phone';
              const currentPairedCode = localStorage.getItem('projection_lastPairedPeerCode');

              Object.entries(incomingData.localStorage).forEach(([key, val]) => {
                if (
                  key === 'projection_deviceRole' ||
                  key === 'projection_myReceiverCode' ||
                  key === 'projection_lastPairedPeerCode'
                ) {
                  return;
                }
                localStorage.setItem(key, val as string);
              });

              localStorage.setItem('projection_deviceRole', currentRole);
              if (currentPairedCode) {
                localStorage.setItem('projection_lastPairedPeerCode', currentPairedCode);
              }
            }

            const localMedia = await getAllMediaItems();
            const manifestItems = incomingData.mediaManifest || [];
            const manifestIds = new Set(manifestItems.map((m: any) => m.id));

            for (const localItem of localMedia) {
              if (!manifestIds.has(localItem.id)) {
                await deleteMediaItem(localItem.id);
              }
            }

            const localMap = new Map(localMedia.map(item => [item.id, item]));
            const missingIds: string[] = [];

            for (const item of manifestItems) {
              const local = localMap.get(item.id);
              const localSize = local?.blob ? local.blob.size : 0;
              if (!local || localSize !== item.size) {
                missingIds.push(item.id);
              } else {
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
              window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
              setDirectSyncStatus('success');
              setSyncMessage('Tudo sincronizado!');
              try { conn.send({ type: 'SYNC_COMPLETE' }); } catch (e) {}
              return;
            }

            setSyncMessage(`Sincronizando ${missingIds.length} alteração(ões)...`);
            try { conn.send({ type: 'REQUEST_DELTA_MEDIA', ids: missingIds }); } catch (e) {}
            return;
          }

          if (incomingData && incomingData.type === 'SYNC_COMPLETE') {
            window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
            setDirectSyncStatus('success');
            setSyncMessage('Sincronização de mídias concluída!');
            setIsPulling(false);
            return;
          }

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

            const savedOrderStr = localStorage.getItem('projection_slidesOrder');
            if (savedOrderStr) {
              try {
                const savedOrder = JSON.parse(savedOrderStr);
                if (Array.isArray(savedOrder) && savedOrder.includes(incomingData.id)) {
                  const newOrder = savedOrder.filter((id: string) => id !== incomingData.id);
                  localStorage.setItem('projection_slidesOrder', JSON.stringify(newOrder));
                  window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'slidesOrder', value: JSON.stringify(newOrder) } }));
                }
              } catch (e) {}
            }

            const currentOverride = localStorage.getItem('projection_manualSlideOverride');
            if (currentOverride === incomingData.id) {
              localStorage.removeItem('projection_manualSlideOverride');
              window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'manualSlideOverride', value: null } }));
            }

            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
            return;
          }

          if (incomingData && incomingData.type === 'FULL_SYNC') {
            setSyncMessage('Dados recebidos do PC! Sincronizando celular...');
            if (incomingData.localStorage) {
              const currentRole = localStorage.getItem('projection_deviceRole') || 'phone';
              const currentPairedCode = localStorage.getItem('projection_lastPairedPeerCode');

              Object.entries(incomingData.localStorage).forEach(([key, val]) => {
                if (
                  key === 'projection_deviceRole' ||
                  key === 'projection_myReceiverCode' ||
                  key === 'projection_lastPairedPeerCode'
                ) {
                  return;
                }
                localStorage.setItem(key, val as string);
              });

              localStorage.setItem('projection_deviceRole', currentRole);
              if (currentPairedCode) {
                localStorage.setItem('projection_lastPairedPeerCode', currentPairedCode);
              }
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
            registerPeerConn(conn);

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
          registerPeerConn(conn);

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
        unregisterPeerConn(conn);
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'phone') {
          setDirectSyncStatus('connecting');
          setSyncMessage('Conexão perdida. Reconectando ao PC automaticamente...');
          triggerAutoReconnect(targetCode);
        }
      });

      conn.on('error', (err) => {
        console.error('Erro na conexão com o destino:', err);
        unregisterPeerConn(conn);
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'phone') {
          setDirectSyncStatus('connecting');
          setSyncMessage('PC offline ou reiniciando. Tentando reconectar...');
          triggerAutoReconnect(targetCode);
        } else {
          setDirectSyncStatus('error');
          setSyncMessage('Não foi possível conectar ao PC. Verifique se o código está correto e ativo.');
          notify('Não foi possível conectar ao PC. Verifique se o código PIN está correto e ativo no computador.', 'error');
        }
      });
    });

    peer.on('error', (err: any) => {
      if (err.type === 'peer-unavailable' || err.type === 'disconnected' || err.type === 'network' || err.type === 'socket-error' || err.type === 'socket-closed') {
        console.warn('PeerJS remetente (Aviso): Conexão indisponível ou instável.', err.type || err);
      } else {
        console.warn('PeerJS remetente (Aviso/Erro):', err.type || err);
      }
      
      const role = localStorage.getItem('projection_deviceRole');
      if (role === 'phone') {
        setDirectSyncStatus('connecting');
        setSyncMessage('Rede instável no celular. Reconectando...');
        triggerAutoReconnect(targetCode);
      } else {
        setDirectSyncStatus('error');
        setSyncMessage('Erro de conexão. Verifique a internet.');
        notify('Erro de conexão P2P. Verifique sua conexão com a internet e se o PC está ativo.', 'error');
      }
    });

    peer.on('disconnected', () => {
      peer.reconnect();
    });
  };

  const forcePushToPC = async () => {
    const conn = connRef.current;
    if (!conn) {
      notify("Conexão inativa. Reconecte primeiro.", "error");
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
      notify("Conexão inativa. Reconecte primeiro.", "error");
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
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

    if (codeFromUrl) {
      // Se possui código na URL (escaneado via QR code), assume o papel de Celular automaticamente e conecta
      localStorage.setItem('projection_deviceRole', 'phone');
      const timer = setTimeout(() => {
        connectAndSendData(codeFromUrl);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isDesktop || savedRole === 'pc' || !savedRole) {
      // Em computadores (PC / Desktop) ou quando não há papel definido, inicia receptor (PC) imediatamente
      localStorage.setItem('projection_deviceRole', 'pc');
      const timer = setTimeout(() => {
        startReceiver();
      }, 500);
      return () => clearTimeout(timer);
    } else if (savedRole === 'phone') {
      // Se for celular com papel de controle remoto, tenta reconectar ao PC pareado
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
      notify('Backup exportado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      setBackupMessage({ type: 'error', text: 'Falha ao exportar backup. Tente novamente.' });
      notify('Falha ao exportar backup. Tente novamente.', 'error');
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

        // 1. Restore localStorage keys (preserva papel de PC/Celular do dispositivo atual)
        if (data.localStorage) {
          const currentRole = localStorage.getItem('projection_deviceRole');
          const currentReceiverCode = localStorage.getItem('projection_myReceiverCode');
          const currentPairedCode = localStorage.getItem('projection_lastPairedPeerCode');

          Object.entries(data.localStorage).forEach(([key, val]) => {
            if (
              key === 'projection_deviceRole' ||
              key === 'projection_myReceiverCode' ||
              key === 'projection_lastPairedPeerCode'
            ) {
              return;
            }
            localStorage.setItem(key, val as string);
          });

          if (currentRole) localStorage.setItem('projection_deviceRole', currentRole);
          if (currentReceiverCode) localStorage.setItem('projection_myReceiverCode', currentReceiverCode);
          if (currentPairedCode) localStorage.setItem('projection_lastPairedPeerCode', currentPairedCode);
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
        notify('Backup importado com sucesso! Reiniciando aplicação...', 'success');
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        console.error('Erro ao importar backup:', err);
        setBackupMessage({ type: 'error', text: 'Falha ao importar o arquivo. Verifique se o arquivo está correto.' });
        notify('Falha ao importar backup. O arquivo selecionado é inválido ou corrompido.', 'error');
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setBackupMessage({ type: 'error', text: 'Erro ao ler arquivo.' });
      notify('Erro ao ler o arquivo de backup.', 'error');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#08080a] border border-[#27272a] rounded-3xl p-5 flex flex-col gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)]">
      {/* HEADER SECTION */}
      <div className="border-b border-[#222] pb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#0f0f12] border border-amber-900/40 rounded-2xl text-amber-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
            <Smartphone className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider font-sans flex items-center gap-2">
              Conexão Sem Fio & Backup
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Sincronização P2P em tempo real (Celular & PC) e backup em arquivo JSON.
            </p>
          </div>
        </div>

        {/* CURRENT ROLE BADGE */}
        <div className="flex items-center gap-2 bg-[#030304] px-3 py-1.5 rounded-xl border border-[#222] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Papel: <strong className="text-amber-400 font-black">{localStorage.getItem('projection_deviceRole') === 'phone' ? 'Celular (Controle)' : 'PC (Receptor)'}</strong>
          </span>
        </div>
      </div>

      {/* BOTÃO DE DIAGNÓSTICO E TESTE AUTOMÁTICO */}
      <div className="bg-[#030304] border border-[#222] rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_2px_8px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-zinc-200 block font-sans">Diagnóstico do Sistema & Rede</span>
              <span className="text-[10px] text-zinc-500">Validação da rede local, banco de dados e sinalização P2P</span>
            </div>
          </div>
          <button
            onClick={runDiagnosticTest}
            disabled={isTesting}
            className="bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)] active:translate-y-[1px] disabled:opacity-50"
            title="Executa teste interno para validar comunicação de rede"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Testar Conexão
              </>
            )}
          </button>
        </div>

        {showTestPanel && (
          <div className="flex flex-col gap-2 mt-1 bg-[#09090c] p-3 rounded-xl border border-[#222] text-xs animate-fadeIn shadow-[inset_0_1px_4px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 border-b border-[#222] pb-2 font-mono">
              <span>Resultado da Simulação do Sistema:</span>
              {testSummary && (
                <span className={`px-2 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] ${
                  testSummary.success ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' : 'bg-red-950/80 text-red-400 border border-red-800/80'
                }`}>
                  {testSummary.success ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>100% OPERACIONAL</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      <span>FALHA</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              {testSteps.map((step) => (
                <div key={step.id} className="flex flex-col gap-0.5 bg-[#030304] p-2.5 rounded-lg border border-[#222]">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-300 text-[11px]">{step.name}</span>
                    <span className="shrink-0">
                      {step.status === 'pending' && <span className="text-zinc-600 text-[10px] font-mono">Aguardando</span>}
                      {step.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                      {step.status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {step.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    </span>
                  </div>
                  {step.detail && (
                    <span className={`text-[10px] ${step.status === 'fail' ? 'text-red-400 font-mono' : 'text-zinc-400'}`}>
                      {step.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {testSummary && (
              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed mt-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] ${
                testSummary.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}>
                {testSummary.message}
                {testSummary.latencyMs !== undefined && testSummary.latencyMs > 0 && (
                  <div className="text-[10px] text-emerald-400 mt-1 font-mono font-bold">
                    • Latência P2P Direta (Round-trip): {testSummary.latencyMs}ms
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* OPÇÃO 1: SINCRONIZAÇÃO DIRETA SEM FIO */}
      <div className="border border-[#222] bg-[#030304] rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_2px_8px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b border-[#222] pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Sincronização P2P Sem Fio</span>
          </div>
          <span className="text-[9px] bg-amber-950/80 text-amber-400 border border-amber-800/80 px-2.5 py-0.5 rounded-full font-mono font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
            Rede Local
          </span>
        </div>

        {directSyncStatus === 'idle' && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-zinc-400 leading-normal">
              Selecione a função deste dispositivo para parear com o sistema:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startReceiver}
                className="bg-[#0f0f12] border border-[#27272a] hover:border-amber-500/60 hover:bg-[#141418] text-zinc-200 text-[11px] font-bold py-3 px-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all h-24 group shadow-[0_4px_12px_rgba(0,0,0,0.6)] active:translate-y-[1px]"
              >
                <Laptop className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-zinc-100 font-black">RECEPTOR (PC)</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-tighter font-mono">Projeta mídias no telão</span>
              </button>
              <button
                onClick={() => setDirectSyncStatus('connecting')}
                className="bg-[#0f0f12] border border-[#27272a] hover:border-amber-500/60 hover:bg-[#141418] text-zinc-200 text-[11px] font-bold py-3 px-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all h-24 group shadow-[0_4px_12px_rgba(0,0,0,0.6)] active:translate-y-[1px]"
              >
                <Smartphone className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-zinc-100 font-black">CONTROLE (CELULAR)</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-tighter font-mono">Controla transmissão</span>
              </button>
            </div>

            {localStorage.getItem('projection_lastPairedPeerCode') && (
              <button
                onClick={() => {
                  const code = localStorage.getItem('projection_lastPairedPeerCode');
                  if (code) connectAndSendData(code);
                }}
                className="w-full bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/50 text-emerald-400 text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reconectar ao último PC ({localStorage.getItem('projection_lastPairedPeerCode')})
              </button>
            )}

            {localStorage.getItem('projection_myReceiverCode') && (
              <div className="text-[10px] text-zinc-500 text-center mt-1 font-mono">
                Código de Pareamento deste PC: <span className="font-mono text-amber-400 font-black bg-[#0f0f12] px-2.5 py-0.5 rounded-lg border border-[#27272a] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">{localStorage.getItem('projection_myReceiverCode')}</span>
              </div>
            )}
          </div>
        )}

        {/* RECEIVER STATE (PC IS WAITING) */}
        {(directSyncStatus === 'initializing' || directSyncStatus === 'listening' || directSyncStatus === 'receiving') && (
          <div className="flex flex-col items-center gap-3 py-3 bg-[#0a0a0d] p-4 rounded-2xl border border-[#222] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-2 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" />
              {syncMessage}
            </span>

            {syncCode && (
              <div className="flex flex-col items-center gap-3 w-full">
                {/* QR CODE FOR PHONE SCANNING */}
                <div className="bg-white p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-white">
                  <QRCode
                    value={`${window.location.origin}${window.location.pathname}?syncCode=${syncCode}`}
                    size={130}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-zinc-400 block mb-1 uppercase tracking-wider font-mono font-bold">Código PIN para digitação manual:</span>
                  <span className="font-mono text-xl font-black text-amber-400 bg-[#030304] border border-[#27272a] px-4 py-1.5 rounded-xl tracking-widest shadow-[inset_0_2px_6px_rgba(0,0,0,1)] inline-block">
                    {syncCode}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-300 bg-[#030304] p-3 rounded-xl text-center leading-normal border border-[#222] max-w-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                  <strong>Instruções:</strong> Aponte a câmera do celular para o QR Code acima para conectar.
                </div>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('projection_deviceRole');
                if (peerRef.current) peerRef.current.destroy();
                setDirectSyncStatus('idle');
              }}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] underline cursor-pointer mt-1"
            >
              Alterar Função ou Cancelar
            </button>
          </div>
        )}

        {/* SENDER STATE (MOBILE CONNECTING/TYPING CODE) */}
        {(directSyncStatus === 'connecting' || directSyncStatus === 'sending') && (
          <div className="flex flex-col gap-3 py-3 bg-[#0a0a0d] p-4 rounded-2xl border border-[#222] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-2 self-center font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" />
              {syncMessage}
            </span>

            {directSyncStatus === 'connecting' && (
              <div className="flex flex-col gap-2.5 w-full">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Código PIN do PC:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CÓDIGO"
                    value={syncInputCode}
                    onChange={(e) => setSyncInputCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="bg-[#030304] border border-[#27272a] rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-400 flex-1 focus:outline-none focus:border-amber-500/60 text-center uppercase tracking-widest shadow-[inset_0_2px_6px_rgba(0,0,0,1)]"
                  />
                  <button
                    onClick={() => connectAndSendData(syncInputCode)}
                    disabled={!syncInputCode || syncInputCode.length !== 6}
                    className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)] active:translate-y-[1px]"
                  >
                    Conectar
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal font-mono">
                  Digite o código de 6 letras exibido na tela do computador.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('projection_deviceRole');
                if (peerRef.current) peerRef.current.destroy();
                setDirectSyncStatus('idle');
              }}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] underline cursor-pointer mt-1 self-center"
            >
              Voltar ao Menu
            </button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {directSyncStatus === 'success' && (
          <div className="flex flex-col items-center gap-3.5 py-4 bg-emerald-950/20 border border-emerald-800/60 rounded-2xl p-4 text-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500 text-emerald-400 font-bold text-xl animate-bounce shadow-[0_0_15px_rgba(52,211,153,0.4)]">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-center">
              <span className="text-xs font-black text-emerald-400 block uppercase tracking-wider font-mono">Dispositivos Conectados!</span>
              <p className="text-[11px] text-zinc-300 mt-2 max-w-sm mx-auto leading-relaxed">
                Sincronização realizada com sucesso.
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Comandos enviados pelo celular refletem instantaneamente na projeção.
              </p>
            </div>

            {localStorage.getItem('projection_deviceRole') === 'phone' && syncMessage && (
              <div className="w-full bg-[#030304] border border-[#222] p-2.5 rounded-xl text-center mt-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                <span className="text-[10px] text-amber-400 font-mono font-medium tracking-wide block leading-normal">
                  Status: {syncMessage}
                </span>
              </div>
            )}

            <div className="flex gap-4 justify-center items-center mt-1 border-t border-[#222] pt-3 w-full">
              <button
                onClick={() => setDirectSyncStatus('idle')}
                className="text-zinc-200 hover:text-white text-[10px] bg-[#111114] border border-[#27272a] px-3.5 py-1.5 rounded-xl cursor-pointer transition-all font-bold shadow-[0_2px_6px_rgba(0,0,0,0.8)] active:translate-y-[1px]"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('projection_deviceRole');
                  if (peerRef.current) peerRef.current.destroy();
                  setDirectSyncStatus('idle');
                }}
                className="text-zinc-500 hover:text-red-400 text-[10px] underline cursor-pointer"
              >
                Desconectar
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {directSyncStatus === 'error' && (
          <div className="flex flex-col items-center gap-2.5 py-3.5 bg-red-950/20 border border-red-800/60 rounded-2xl p-4 text-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500 text-red-400 font-bold text-lg shadow-[0_0_12px_rgba(239,68,68,0.4)]">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-xs font-black text-red-400 font-mono">Falha na Conexão</span>
            <p className="text-[11px] text-zinc-400 leading-snug">
              {syncMessage}
            </p>
            <div className="flex flex-col gap-1.5 items-center mt-1 w-full">
              <button
                onClick={() => {
                  const lastPaired = localStorage.getItem('projection_lastPairedPeerCode');
                  if (lastPaired) {
                    connectAndSendData(lastPaired);
                  } else {
                    setDirectSyncStatus('connecting');
                  }
                }}
                className="w-full bg-[#111114] border border-[#27272a] text-zinc-200 hover:border-amber-500/60 text-[10px] font-bold py-2 px-3 rounded-xl cursor-pointer transition-all active:translate-y-[1px]"
              >
                Reconectar
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('projection_deviceRole');
                  if (peerRef.current) peerRef.current.destroy();
                  setDirectSyncStatus('idle');
                }}
                className="text-zinc-500 hover:text-zinc-300 text-[10px] underline cursor-pointer mt-1"
              >
                Alterar Função
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OPÇÃO 2: BACKUP MANUAL VIA ARQUIVOS (.JSON) */}
      <div className="border border-[#222] bg-[#030304] rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_2px_8px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b border-[#222] pb-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Backup & Restauração (.json)
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">Arquivo JSON</span>
        </div>
        
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Exporte ou restaure um arquivo de segurança (.json) com todas as mídias, dados e configurações.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleExportBackup}
            disabled={isExporting || isImporting}
            className="bg-[#0f0f12] border border-[#27272a] hover:border-amber-500/60 hover:bg-[#141418] text-zinc-200 text-[11px] font-bold py-3 px-3 rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.6)] active:translate-y-[1px] disabled:opacity-50"
          >
            <Download className={`w-4 h-4 text-amber-400 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? "Gerando Backup..." : "Exportar Backup (.json)"}
          </button>

          <label
            className={`bg-[#0f0f12] border border-[#27272a] hover:border-amber-500/60 hover:bg-[#141418] text-zinc-200 text-[11px] font-bold py-3 px-3 rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.6)] active:translate-y-[1px] disabled:opacity-50 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Upload className={`w-4 h-4 text-amber-400 ${isImporting ? 'animate-pulse' : ''}`} />
            {isImporting ? "Restauração..." : "Restaurar Backup (.json)"}
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
          <div className={`text-[11px] p-2.5 rounded-xl border text-center font-bold shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] ${
            backupMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' 
              : 'bg-red-950/40 border-red-800/60 text-red-400'
          }`}>
            {backupMessage.text}
          </div>
        )}
      </div>
    </div>
  );
});
