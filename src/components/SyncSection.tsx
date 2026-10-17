import {diagnosticSteps,runConnectionDiagnostics,type DiagnosticStep} from '../utils/connection-diagnostics';
import {readTransferMetadata} from '../utils/chunk-assembler';
import {BackupPanel} from './operator/BackupPanel';
import {prepareBackup,inspectBackup,applyPreparedBackup,MAX_BACKUP_FILE_BYTES,MAX_BACKUP_MEDIA_BYTES,type PreparedBackup} from '../utils/backup';
import {ConnectionPanel} from './operator/ConnectionPanel';
import {TRUST_KEY,getDeviceIdentity,createTrustSecret,createTrustNonce,isDeviceId,isTrustNonce,readTrustedDevices,saveTrustedDevice,removeTrustedDevice,findTrustedController,findTrustedReceiver,signResumeProof,verifyResumeProof,reconnectDelay,type ResumeContext,type TrustedDevice} from '../utils/trusted-pairing';
import {Smartphone} from './ui/icons';
import {MEETINGS, CAMPAIGNS} from '../data';
import {describeMedia, readMediaManifest, planMediaMerge, mapMediaReferences, readMediaCatalog} from '../utils/media-manifest';
import {sendPeerChunk} from '../utils/peer-send';
import {isSharedStateUpdate, readSharedStorage} from '../utils/shared-state';
import {PairingApproval} from './PairingApproval';
import {PairingSession, createPairingCode, isPairingCode} from '../utils/pairing-session';
import {ConsoleIntro} from './operator/ConsoleIntro';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Peer } from 'peerjs';
import QRCode from "react-qr-code";
import { Download, Upload, Laptop, RefreshCw, Activity, CheckCircle2, XCircle, FlaskConical, Zap, ShieldCheck, Play } from './ui/icons';
import { format } from 'date-fns';
import { getAllMediaItems, saveMediaItem, saveMediaBatch, deleteMediaItem } from '../utils';
import { sendMediaInChunks, handleIncomingChunk, cancelIncomingTransfers } from '../utils/webrtcChunking';

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

const approvedConnections = new WeakSet<object>();
const connectionTrust = new WeakMap<object,TrustedDevice>();

const MEDIA_ALIASES_KEY = 'holylink_media_aliases_v1';
function readMediaAliases(): Record<string,string> {
  try {
    const value = JSON.parse(localStorage.getItem(MEDIA_ALIASES_KEY) || '{}');
    if (!value || Array.isArray(value) || typeof value !== 'object') return Object.create(null);
    return Object.fromEntries(Object.entries(value).filter(([key,val])=>key.length<=200 && typeof val==='string' && val.length<=200).slice(-1000)) as Record<string,string>;
  } catch {return Object.create(null);}
}
function resolveMediaId(id:string) {const aliases=readMediaAliases();return Object.hasOwn(aliases,id)?aliases[id]:id;}
function clearRemoteCatalog() {window.dispatchEvent(new CustomEvent('holylink_remote_catalog',{detail:[]}));}
async function sendMediaCatalog(conn:any) {
  if (!conn.open || !approvedConnections.has(conn)) return;
  const aliases=readMediaAliases();
  const items = (await getAllMediaItems()).filter(item=>item.blob instanceof Blob && item.blob.size).slice(0,500).map(item=>({
    id:item.id,type:item.type,name:item.name,duration:item.duration,enabledInLoop:item.enabledInLoop,
    muted:item.muted,order:item.order,fit:item.fit,size:item.blob!.size,sourceIds:Object.keys(aliases).filter(id=>aliases[id]===item.id)
  }));
  if (conn.open && approvedConnections.has(conn)) conn.send({type:'MEDIA_CATALOG',mediaManifest:items,version:1});
}
export function requestRemoteMediaDelete(id:string):boolean {
  const conn=getApprovedPeerConnections()[0];
  if (!conn || typeof id!=='string' || !id.length || id.length>200) return false;
  try {conn.send({type:'MEDIA_DELETE',id,version:1});return true;} catch {return false;}
}
export function setRemoteMediaEnabled(item:any,enabled:boolean):boolean {
  const conn=getApprovedPeerConnections()[0];if(!conn)return false;
  try {conn.send({type:'MEDIA_SAVE',version:1,mediaItem:{id:item.id,type:item.type,name:item.name,duration:item.duration,enabledInLoop:enabled,muted:item.muted,order:item.order,fit:item.fit}});return true;}catch{return false;}
}
export function projectRemoteMedia(id:string):boolean {
  const conn=getApprovedPeerConnections()[0];
  if (!conn || typeof id!=='string' || !id.length || id.length>200) return false;
  try {
  conn.send({type:'UPDATE_STATE',key:'activeVerseIndex',value:null,version:1});
  conn.send({type:'UPDATE_STATE',key:'customVerseText',value:null,version:1});
  conn.send({type:'UPDATE_STATE',key:'customVerseRef',value:null,version:1});
  conn.send({type:'UPDATE_STATE',key:'manualSlideOverride',value:id,version:1});return true;
  } catch {return false;}
}


export function registerPeerConn(conn: any) {
  if (!approvedConnections.has(conn)) return;
  if (!conn) return;
  const list: any[] = (window as any).holyrics_peer_conns || [];
  if (!list.includes(conn)) {
    list.push(conn);
  }
  (window as any).holyrics_peer_conns = list;
  (window as any).holyrics_peer_conn = conn;
}

export function unregisterPeerConn(conn: any) {
  approvedConnections.delete(conn);
  connectionTrust.delete(conn);
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

export function getApprovedPeerConnections(): any[] {
  return ((window as any).holyrics_peer_conns || []).filter(conn => conn.open && approvedConnections.has(conn));
}

export function broadcastToPeers(data: any, excludeConn?: any) {
  const list: any[] = (window as any).holyrics_peer_conns || [];
  const activeList: any[] = [];
  for (const conn of list) {
    if (conn && conn.open && approvedConnections.has(conn)) {
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
  const backupInputRef=useRef<HTMLInputElement|null>(null);
  const [preparedBackup,setPreparedBackup]=useState<PreparedBackup|null>(null);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // States for direct wireless synchronization (PeerJS)
  const [directSyncStatus, setDirectSyncStatus] = useState<'idle' | 'initializing' | 'listening' | 'connecting' | 'sending' | 'receiving' | 'success' | 'error'>('idle');
  const [syncCode, setSyncCode] = useState(''); // Generated on receiver, typed on sender
  const [syncInputCode, setSyncInputCode] = useState(''); // Input value for manually typing the code
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);
  const [pendingPairing, setPendingPairing] = useState<{conn: any; session: PairingSession; code: string; deviceId?:string; requestNonce?:string} | null>(null);
  const pendingPairingRef = useRef<typeof pendingPairing>(null);
  const pairingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const clearPendingPairing = () => {
    if (pairingTimerRef.current) clearTimeout(pairingTimerRef.current);
    pairingTimerRef.current = null;
    pendingPairingRef.current = null;
    setPendingPairing(null);
  };
  const rejectPairing = () => {
    const pending = pendingPairingRef.current;
    clearPendingPairing();
    if (!pending) return;
    pending.session.close();
    try { pending.conn.send({type: 'PAIRING_REJECTED'}); } catch {}
    pending.conn.close();
    setSyncMessage('Solicitação recusada ou expirada. Aguardando outro celular.');
  };
  const approvePairing = (remember=false,label='Celular autorizado') => {
    const pending=pendingPairingRef.current;
    if(!pending||!pending.conn.open||!pending.session.approve(pending.code)){rejectPairing();return;}
    clearPendingPairing();
    let trust:TrustedDevice|undefined;
    const identity=getDeviceIdentity();
    if(remember&&identity.persistent&&crypto.subtle&&isDeviceId(pending.deviceId)&&isTrustNonce(pending.requestNonce)) {
      const now=Date.now();
      const record:TrustedDevice={role:'controller',id:pending.deviceId,secret:createTrustSecret(),code:syncCode,label:label.trim().slice(0,48)||'Celular autorizado',createdAt:now,lastUsedAt:now};
      if(saveTrustedDevice(record)){trust=record;blockedTrustRef.current.delete(record.id);connectionTrust.set(pending.conn,record);}
      else setTrustMessage('Controle permitido nesta sessão, mas não foi possível guardar a autorização.');
    }
    if(!remember&&pending.deviceId)removeTrustedDevice('controller',pending.deviceId);
    approvedConnections.add(pending.conn);registerPeerConn(pending.conn);
    pending.conn.send({type:'PAIRING_APPROVED',challenge:pending.code,...(trust?{trust:{receiverId:identity.id,controllerId:pending.deviceId,secret:trust.secret,code:syncCode,nonce:pending.requestNonce}}:{})});
    void sendMediaCatalog(pending.conn).catch(()=>{});
    setTrustVersion(value=>value+1);setDirectSyncStatus('success');setSyncMessage(trust?'Celular autorizado e lembrado para as próximas conexões.':'Celular autorizado nesta sessão. Agenda e mídias preservadas.');
  };

  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const pendingPullRef=useRef<{conn:any;manifestReceived:boolean;comparing:boolean;expected:Set<string>}|null>(null);
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const generationRef=useRef(0),retryAttemptRef=useRef(0),autoReconnectEnabledRef=useRef(true),blockedTrustRef=useRef(new Set<string>());
  const retryActionRef=useRef<(()=>void)|null>(null);
  const [trustVersion,setTrustVersion]=useState(0);
  const [trustMessage,setTrustMessage]=useState('');
  const [connectionBusy,setConnectionBusy]=useState(false);
  const [retryAttempt,setRetryAttempt]=useState(0);
  const invitationExpiresRef=useRef(0);const [invitationExpiresAt,setInvitationExpiresAt]=useState(0);
  const renewInvitation=()=>{const expires=Date.now()+600000;invitationExpiresRef.current=expires;setInvitationExpiresAt(expires);};
  const resetTransport=()=>{
    const generation=++generationRef.current;
    if(reconnectTimeoutRef.current)clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current=null;
    rejectPairing();
    for(const conn of getApprovedPeerConnections()){unregisterPeerConn(conn);cancelIncomingTransfers(conn);try{conn.close();}catch{}}
    if(connRef.current){unregisterPeerConn(connRef.current);cancelIncomingTransfers(connRef.current);try{connRef.current.close();}catch{}}
    const previous=peerRef.current;peerRef.current=null;connRef.current=null;
    previous?.destroy();clearRemoteCatalog();pendingPullRef.current=null;setIsPushing(false);setIsPulling(false);setVerificationCode('');setConnectionBusy(false);setTrustVersion(value=>value+1);
    window.dispatchEvent(new Event('projection_sync_finished'));
    return generation;
  };
  const stopConnection=()=>{
    autoReconnectEnabledRef.current=false;retryActionRef.current=null;resetTransport();
    localStorage.removeItem('projection_deviceRole');localStorage.removeItem('projection_lastPairedPeerCode');
    try{localStorage.setItem('holylink_connection_paused','true');}catch{/* Session pause remains active. */}
    setDirectSyncStatus('idle');setSyncMessage('Conexão interrompida. Seus arquivos e autorizações lembradas foram preservados.');
  };
  const allowReconnect=()=>{autoReconnectEnabledRef.current=true;try{localStorage.removeItem('holylink_connection_paused');}catch{/* Optional persistence. */}};
  const revokeTrust=(device:TrustedDevice)=>{
    if(device.role==='controller')blockedTrustRef.current.add(device.id);
    const saved=removeTrustedDevice(device.role,device.id);
    if(device.role==='receiver'&&localStorage.getItem('projection_lastPairedPeerCode')===device.code)stopConnection();
    for(const conn of getApprovedPeerConnections()){const record=connectionTrust.get(conn);if(record?.role===device.role&&record.id===device.id){unregisterPeerConn(conn);cancelIncomingTransfers(conn);conn.close();}}
    setTrustVersion(value=>value+1);setTrustMessage(saved?'Autorização removida. Uma nova conexão exigirá aprovação.':'Conexão encerrada, mas o navegador não conseguiu salvar a remoção da autorização.');
  };
  const queueReconnect=(action:()=>void)=>{
    if(!autoReconnectEnabledRef.current)return;
    retryActionRef.current=action;
    if(reconnectTimeoutRef.current)clearTimeout(reconnectTimeoutRef.current);
    if(!navigator.onLine||document.visibilityState==='hidden'){setConnectionBusy(false);setSyncMessage(!navigator.onLine?'Sem internet. A reconexão espera a rede voltar.':'Reconexão pausada enquanto esta aba está oculta.');return;}
    const attempt=retryAttemptRef.current++;setRetryAttempt(attempt+1);
    reconnectTimeoutRef.current=setTimeout(()=>{reconnectTimeoutRef.current=null;if(autoReconnectEnabledRef.current&&navigator.onLine&&document.visibilityState!=='hidden'){retryActionRef.current=null;action();}},reconnectDelay(attempt));
  };


  const [isTesting,setIsTesting]=useState(false);
  const [testSteps,setTestSteps]=useState<DiagnosticStep[]>([]);
  const [testSummary,setTestSummary]=useState<{success:boolean;latencyMs?:number;message:string}|null>(null);
  const [showTestPanel,setShowTestPanel]=useState(false);
  const diagnosticAbortRef=useRef<AbortController|null>(null);
  useEffect(()=>()=>diagnosticAbortRef.current?.abort(),[]);
  const runDiagnosticTest=async()=>{
    if(diagnosticAbortRef.current)return;
    const controller=new AbortController();diagnosticAbortRef.current=controller;
    setIsTesting(true);setShowTestPanel(true);setTestSummary(null);setTestSteps(diagnosticSteps());
    try{const result=await runConnectionDiagnostics((id,status,detail)=>{if(!controller.signal.aborted)setTestSteps(previous=>previous.map(step=>step.id===id?{...step,status,detail}:step));},()=>new Peer(),controller.signal);if(!controller.signal.aborted)setTestSummary(result);}
    catch(error){if(!controller.signal.aborted)setTestSummary({success:false,message:error instanceof Error?error.message:'Falha no diagnóstico.'});}
    finally{if(diagnosticAbortRef.current===controller)diagnosticAbortRef.current=null;if(!controller.signal.aborted)setIsTesting(false);}
  };

  // Cleanup peer and timeouts on unmount
  useEffect(() => {
    return () => {
      generationRef.current++;autoReconnectEnabledRef.current=false;
      for(const conn of getApprovedPeerConnections()){unregisterPeerConn(conn);cancelIncomingTransfers(conn);}
      if (pairingTimerRef.current) clearTimeout(pairingTimerRef.current);
      pendingPairingRef.current?.session.close();
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const triggerAutoReconnect=(targetCode:string)=>{
    if(localStorage.getItem('projection_deviceRole')==='phone'&&findTrustedReceiver(targetCode))queueReconnect(()=>{void connectAndSendData(targetCode);});
    else {setConnectionBusy(false);setDirectSyncStatus('error');setSyncMessage('A sessão terminou. Conecte novamente e confirme a aprovação no PC.');}
  };
  useEffect(()=>{
    const resume=()=>{if(!autoReconnectEnabledRef.current)return;if(navigator.onLine&&document.visibilityState!=='hidden'&&retryActionRef.current){const action=retryActionRef.current;queueReconnect(action);}else if(!navigator.onLine||document.visibilityState==='hidden'){if(reconnectTimeoutRef.current)clearTimeout(reconnectTimeoutRef.current);reconnectTimeoutRef.current=null;}};
    const changed=()=>{for(const conn of getApprovedPeerConnections()){const trust=connectionTrust.get(conn);if(trust&&!readTrustedDevices().some(item=>item.role===trust.role&&item.id===trust.id&&item.secret===trust.secret&&item.code===trust.code)){unregisterPeerConn(conn);cancelIncomingTransfers(conn);conn.close();}}setTrustVersion(value=>value+1);};
    const storage=(event:StorageEvent)=>{if(event.key===TRUST_KEY||event.key===null)changed();};
    window.addEventListener('online',resume);window.addEventListener('offline',resume);document.addEventListener('visibilitychange',resume);window.addEventListener('storage',storage);
    return()=>{window.removeEventListener('online',resume);window.removeEventListener('offline',resume);document.removeEventListener('visibilitychange',resume);window.removeEventListener('storage',storage);};
  },[]);

  // Initialize as Receiver (usually on PC)
  const startReceiver = (newCode = false) => {
    allowReconnect();const generation=resetTransport();
    setDirectSyncStatus('initializing');
    setSyncMessage('Iniciando conexão segura...');

    rejectPairing();
    const savedCode=localStorage.getItem('projection_myReceiverCode');
    const code=(!newCode&&isPairingCode(savedCode)?savedCode:undefined)||createPairingCode();
    const codeExpiresAt = Date.now() + 10 * 60_000;
    invitationExpiresRef.current=codeExpiresAt;setInvitationExpiresAt(codeExpiresAt);
    localStorage.setItem('projection_myReceiverCode', code);
    setSyncCode(code);

    // Salva o papel do dispositivo como PC para reconexão automática ao recarregar
    localStorage.setItem('projection_deviceRole', 'pc');

    const peerId = `holyrics_${code}`;
    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      if(generation!==generationRef.current||peerRef.current!==peer)return;
      retryAttemptRef.current=0;setRetryAttempt(0);retryActionRef.current=null;
      const live=getApprovedPeerConnections().length;setDirectSyncStatus(live?'success':'listening');
      setSyncMessage(live?'Sinalização retomada. O controle permanece conectado.':'Aguardando conexão do celular...');
    });

    peer.on('connection', (conn) => {
      if(generation!==generationRef.current||peerRef.current!==peer){conn.close();return;}
      connRef.current = conn;
      const pendingMediaWrites=new Set<Promise<any>>();
      const connectionAbort=new AbortController();
      let mediaTransferFailed=false;
      let session: PairingSession | null = null;
      let resume:{context:ResumeContext;trust:TrustedDevice;expiresAt:number;busy:boolean}|null=null;
      // Merely opening a WebRTC transport grants no read/write/control access.
      const requestTimeout = setTimeout(() => {
        if (!session?.approved) conn.close();
      }, 65_000);
      conn.on('data', async (data: any) => {
        if(generation!==generationRef.current||peerRef.current!==peer||!conn.open)return;
        if (!session?.approved) {
          try {
            if(data?.type==='REQUEST_TRUSTED_RECONNECT') {
              if(session||resume||!isDeviceId(data.deviceId)||!isTrustNonce(data.nonce))return;
              const trust=findTrustedController(data.deviceId,code);
              if(!trust||blockedTrustRef.current.has(data.deviceId)){conn.send({type:'PAIRING_REQUIRED'});conn.close();return;}
              const identity=getDeviceIdentity();
              if(!identity.persistent){conn.send({type:'PAIRING_REQUIRED'});conn.close();return;}
              const context:ResumeContext={receiverId:identity.id,controllerId:trust.id,code,clientNonce:data.nonce,serverNonce:createTrustNonce()};
              resume={context,trust,expiresAt:Date.now()+30000,busy:false};
              const proof=await signResumeProof(trust.secret,'receiver',context);
              if(generation!==generationRef.current||!conn.open||findTrustedController(trust.id,code)?.secret!==trust.secret||blockedTrustRef.current.has(trust.id))return;
              conn.send({type:'TRUSTED_RECONNECT_CHALLENGE',...context,proof,version:1});return;
            }
            if(data?.type==='TRUSTED_RECONNECT_PROOF'&&resume) {
              if(resume.busy||Date.now()>=resume.expiresAt)return;
              resume.busy=true;
              const attempt=resume;
              const valid=await verifyResumeProof(attempt.trust.secret,'controller',attempt.context,data.proof);
              if(!valid||Date.now()>=attempt.expiresAt||generation!==generationRef.current||!conn.open||blockedTrustRef.current.has(attempt.trust.id)||findTrustedController(attempt.trust.id,code)?.secret!==attempt.trust.secret){conn.close();return;}
              const proof=await signResumeProof(attempt.trust.secret,'approved',attempt.context);
              if(Date.now()>=attempt.expiresAt||generation!==generationRef.current||!conn.open||blockedTrustRef.current.has(attempt.trust.id)||findTrustedController(attempt.trust.id,code)?.secret!==attempt.trust.secret){conn.close();return;}
              const challenge=createPairingCode();session=new PairingSession(challenge);session.approve(challenge);
              approvedConnections.add(conn);connectionTrust.set(conn,attempt.trust);registerPeerConn(conn);
              conn.send({type:'TRUSTED_RECONNECT_APPROVED',proof,version:1});
              void sendMediaCatalog(conn).catch(()=>{});setTrustVersion(value=>value+1);setDirectSyncStatus('success');setSyncMessage('Celular lembrado reconectado. Nenhum arquivo foi copiado automaticamente.');return;
            }
            if(data?.type!=='REQUEST_PAIRING'||!isPairingCode(data.challenge))return;
            if(Date.now()>=invitationExpiresRef.current){conn.send({type:'PAIRING_REJECTED'});conn.close();setSyncMessage('O convite expirou para novos celulares. Renove o convite neste PC.');return;}
            if(session||resume||pendingPairingRef.current){conn.close();return;}
            session=new PairingSession(data.challenge);
            const pending={conn,session,code:data.challenge,...(isDeviceId(data.deviceId)&&isTrustNonce(data.nonce)?{deviceId:data.deviceId,requestNonce:data.nonce}:{})};
            pendingPairingRef.current=pending;setPendingPairing(pending);setSyncMessage('Confira a solicitação de controle neste computador.');pairingTimerRef.current=setTimeout(rejectPairing,60000);
          } catch {conn.close();}
          return;
        }
        try {
          if (data?.type==='SYNC_FAILED') {window.dispatchEvent(new Event('projection_sync_finished'));setDirectSyncStatus('error');setSyncMessage('O outro aparelho não conseguiu concluir a sincronização.');return;}
          if (data?.type==='REQUEST_MEDIA_CATALOG') {await sendMediaCatalog(conn);return;}
          if (data?.type==='UPDATE_STATE' && isSharedStateUpdate(data.key,data.value)) data={...data,value:mapMediaReferences(data.key,data.value,readMediaAliases())};
          if (data?.type==='MEDIA_SAVE' && typeof data.mediaItem?.id==='string') data={...data,mediaItem:{...data.mediaItem,id:resolveMediaId(data.mediaItem.id)}};
          if (data?.type==='MEDIA_CHUNK_START' && typeof data.metadata?.id==='string') data={...data,metadata:{...data.metadata,id:resolveMediaId(data.metadata.id)}};
          if (data && (data.type === 'MEDIA_CHUNK_START' || data.type === 'MEDIA_CHUNK_DATA')) {
            const write=handleIncomingChunk(data,conn);pendingMediaWrites.add(write);
            let res;
            try {res=await write;} catch(error){mediaTransferFailed=true;throw error;}
            finally{pendingMediaWrites.delete(write);}
            if (res.complete) {
              if(pendingPullRef.current?.conn===conn&&res.item)pendingPullRef.current.expected.delete(res.item.id);
              window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
              setSyncMessage('Mídia recebida e salva com sucesso!');
              await sendMediaCatalog(conn);
            }
            broadcastToPeers(data, conn);
            return;
          }

          if (data && data.type === 'UPDATE_STATE') {
            if (!isSharedStateUpdate(data.key, data.value)) {setSyncMessage('Comando inválido ignorado. A projeção foi preservada.'); return;}
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
            const item=data.mediaItem;
            if(item?.base64)throw Error('Atualize os dois aparelhos: arquivos agora são transferidos por blocos.');
            const existing=(await getAllMediaItems()).find(local=>local.id===item?.id&&local.blob);
            if(!conn.open||!session?.approved)return;
            if(!existing){await sendMediaCatalog(conn);return;}
            const {size:_size,mimeType:_mime,...safe}=readTransferMetadata({...item,size:existing.blob!.size,mimeType:existing.blob!.type||'application/octet-stream'});
            await saveMediaItem(safe,connectionAbort.signal);
            if(!conn.open||!session?.approved)return;
            window.dispatchEvent(new CustomEvent('projection_sync_update',{detail:{key:'mediaUpdateTrigger',value:Date.now().toString()}}));broadcastToPeers(data,conn);await sendMediaCatalog(conn);return;
          }

          if (data && data.type === 'MEDIA_DELETE') {
            if (typeof data.id!=='string' || !data.id.length || data.id.length>200) return;
            const canonical=resolveMediaId(data.id);
            const aliases=readMediaAliases();
            const related=[...new Set([canonical,data.id,...Object.keys(aliases).filter(id=>aliases[id]===canonical)])];
            data={...data,id:canonical};
            await deleteMediaItem(canonical);
            for (const id of related) {delete aliases[id];broadcastToPeers({type:'MEDIA_DELETE',id,version:1});}
            localStorage.setItem(MEDIA_ALIASES_KEY,JSON.stringify(aliases));

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
            await sendMediaCatalog(conn);
            return;
          }

          if (data && data.type === 'SYNC_MANIFEST') {
            const manifestItems=readMediaManifest(data.mediaManifest);
            mediaTransferFailed=false;
            const storage=readSharedStorage(data.localStorage || {});
            setSyncMessage('Conferindo conteúdo das mídias. Arquivos exclusivos do PC serão preservados...');
            const localMedia=await getAllMediaItems();
            const sizes=new Set(manifestItems.map(item=>item.size));
            const localManifest=await describeMedia(localMedia.filter(item=>item.blob && sizes.has(item.blob.size)),()=>conn.open && !!session?.approved);
            if (!conn.open || !session?.approved) return;
            const plan=planMediaMerge(localManifest,manifestItems);
            localStorage.setItem(MEDIA_ALIASES_KEY,JSON.stringify({...readMediaAliases(),...plan.aliases}));
            for (const {remote,localId} of plan.reused) {
              if (!conn.open || !session?.approved) return;
              const {size:_size,contentHash:_hash,...metadata}=remote;
              await saveMediaItem({...metadata,id:localId},connectionAbort.signal);
            }
            if(!conn.open || !session?.approved)return;
            for (const [key,value] of Object.entries(storage)) {
              const name=key.slice('projection_'.length);
              let mapped=mapMediaReferences(name,value,plan.aliases);
              if (name==='slidesOrder' || name==='disabledSlides') {
                const incoming=JSON.parse(mapped);
                const local=JSON.parse(localStorage.getItem(key)||'[]');
                const sharedIds=new Set(Object.values(plan.aliases));
                const preserved=Array.isArray(local)?local.filter(id=>!sharedIds.has(id)):[];
                mapped=JSON.stringify([...new Set([...incoming,...preserved])]);
              }
              localStorage.setItem(key,mapped);
            }
            window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
            await sendMediaCatalog(conn);
            if (!plan.requested.length) {
              setDirectSyncStatus('success');setSyncMessage('PC atualizado sem reenviar arquivos já existentes.');
              conn.send({type:'SYNC_COMPLETE',version:1});
            } else {
              setSyncMessage(`Recebendo ${plan.requested.length} arquivo(s) novo(s) ou alterado(s)...`);
              conn.send({type:'REQUEST_DELTA_MEDIA',ids:plan.requested,version:1});
            }
            return;
          }

          if (data && data.type === 'REQUEST_DELTA_MEDIA') {
            if(!Array.isArray(data.ids)||data.ids.length>500||!data.ids.every((id:unknown)=>typeof id==='string'&&id.length>0&&id.length<=200))throw Error('Lista de arquivos solicitados inválida.');
            const requestedIds = new Set(data.ids);
            const allMedia = await getAllMediaItems();
            const mediaToTransfer = allMedia.filter(item => requestedIds.has(item.id));

            for (let i = 0; i < mediaToTransfer.length; i++) {
              const item = mediaToTransfer[i];
              const realBlob = getRealBlob(item.blob);
              if (realBlob && realBlob.size > 0) {
                await sendMediaInChunks(
                  (payload) => sendPeerChunk(conn, payload, () => approvedConnections.has(conn)),
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

          if(data?.type==='DELTA_MEDIA_ITEMS'){conn.send({type:'SYNC_FAILED',version:1,message:'Formato antigo de transferência. Atualize o HolyLink nos dois aparelhos.'});setSyncMessage('Transferência antiga recusada. Arquivos preservados; atualize os dois aparelhos.');return;}

          if (data && data.type === 'SYNC_COMPLETE') {
            await Promise.allSettled([...pendingMediaWrites]);
            if(!conn.open || !session?.approved)return;
            if(mediaTransferFailed){conn.send({type:'SYNC_FAILED',version:1});window.dispatchEvent(new Event('projection_sync_finished'));setSyncMessage('Alguma mídia não foi salva. Confira a conexão e sincronize novamente.');return;}
            if(!data.ack)conn.send({type:'SYNC_COMPLETE',version:1,ack:true});
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
            const mediaManifest = readMediaManifest(await describeMedia(mediaItems,()=>conn.open && approvedConnections.has(conn)));

            conn.send({
              type: 'SYNC_MANIFEST',
              version: 1,
              localStorage: readSharedStorage(storageData),
              mediaManifest
            });
            return;
          }

          if(data?.mediaItems||data?.type==='FULL_SYNC') {conn.send({type:'SYNC_FAILED',version:1,message:'Formato antigo de transferência. Atualize o HolyLink nos dois aparelhos.'});setSyncMessage('Formato antigo recusado. Arquivos e configurações preservados.');}

        } catch (err) {
          if (!conn.open || !session?.approved) return;
          if(['SYNC_MANIFEST','REQUEST_FULL_SYNC','REQUEST_DELTA_MEDIA'].includes(data?.type)) {
            try {conn.send({type:'SYNC_FAILED',version:1,message:err instanceof Error?err.message:'Falha ao sincronizar.'});} catch {}
            window.dispatchEvent(new Event('projection_sync_finished'));
          }
          console.error('Erro na recepção dos dados:', err);
          setDirectSyncStatus('error');
          setSyncMessage('Falha ao receber os dados. Verifique a conexão e tente novamente.');
        }
      });

      conn.on('close', () => {
        connectionAbort.abort();clearTimeout(requestTimeout);
        window.dispatchEvent(new Event('projection_sync_finished'));
        cancelIncomingTransfers(conn);
        session?.close();
        if (pendingPairingRef.current?.conn === conn) clearPendingPairing();
        if(generation!==generationRef.current||peerRef.current!==peer){unregisterPeerConn(conn);return;}
        console.log("Conexão com o celular fechada.");
        unregisterPeerConn(conn);
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'pc') {
          setTrustVersion(value=>value+1);setDirectSyncStatus(getApprovedPeerConnections().length?'success':'listening');
          setSyncMessage('Celular desconectado. Aparelhos lembrados podem se reconectar.');
        }
      });

      conn.on('error', (err) => {
        connectionAbort.abort();clearTimeout(requestTimeout);
        window.dispatchEvent(new Event('projection_sync_finished'));
        cancelIncomingTransfers(conn);
        session?.close();
        if (pendingPairingRef.current?.conn === conn) clearPendingPairing();
        if(generation!==generationRef.current||peerRef.current!==peer){unregisterPeerConn(conn);return;}
        console.error('Erro na conexão com celular:', err);
        unregisterPeerConn(conn);
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'pc') {
          setTrustVersion(value=>value+1);setDirectSyncStatus(getApprovedPeerConnections().length?'success':'listening');
          setSyncMessage('Conexão perdida com celular. Aguardando reconexão...');
        }
      });
    });

    peer.on('error',(err:any)=>{
      if(generation!==generationRef.current||peerRef.current!==peer||!autoReconnectEnabledRef.current)return;
      if(err.type==='unavailable-id'){setDirectSyncStatus('error');setSyncMessage('Este código já está aberto em outra janela. Use a janela original ou gere outro código.');return;}
      if(getApprovedPeerConnections().length){setSyncMessage('Controle conectado. A sinalização será retomada quando a rede voltar.');queueReconnect(()=>{if(peerRef.current===peer&&peer.disconnected)peer.reconnect();});return;}
      setDirectSyncStatus('initializing');setSyncMessage('Rede instável. Tentando restabelecer este mesmo código...');queueReconnect(()=>startReceiver());
    });
    peer.on('disconnected',()=>{if(generation!==generationRef.current||peerRef.current!==peer)return;queueReconnect(()=>{if(peerRef.current===peer&&peer.disconnected)peer.reconnect();});});
  };

  // Initialize as Sender (usually on Mobile/Celular) and send data to the receiver ID
  const connectAndSendData = async (targetCode: string,forceManual=false) => {
    targetCode = targetCode.toUpperCase().trim();
    if (!isPairingCode(targetCode)) {
      notify('Confira o código atual exibido no computador.', 'error');
      return;
    }

    allowReconnect();const generation=resetTransport();
    const remembered=forceManual?undefined:findTrustedReceiver(targetCode);
    const identity=getDeviceIdentity();
    const clientNonce=createTrustNonce();
    localStorage.setItem('projection_deviceRole','phone');setConnectionBusy(true);
    setDirectSyncStatus('connecting');
    setSyncMessage('Conectando ao outro dispositivo...');

    const peer = new Peer(); // Random sender ID
    peerRef.current = peer;

    peer.on('open', () => {
      if(generation!==generationRef.current||peerRef.current!==peer)return;
      if(connRef.current?.open){retryActionRef.current=null;retryAttemptRef.current=0;setRetryAttempt(0);return;}
      if(reconnectTimeoutRef.current)clearTimeout(reconnectTimeoutRef.current);retryActionRef.current=null;
      const conn = peer.connect(`holyrics_${targetCode.toUpperCase().trim()}`);
      connRef.current = conn;
      const pendingMediaWrites=new Set<Promise<any>>();
      const connectionAbort=new AbortController();
      let mediaTransferFailed=false;

      const challenge = createPairingCode();
      const session = new PairingSession(challenge);
      let pairingRejected = false;
      let resumeContext:ResumeContext|null=null;let checkingResume=false;let resumeVerified=false;
      const approvalTimeout = setTimeout(() => {
        if (!session.approved&&generation===generationRef.current) {
          pairingRejected = true;setConnectionBusy(false);
          session.close();
          conn.close();
          setDirectSyncStatus('error');
          setSyncMessage('A aprovação expirou. Atualize o PC e conecte novamente.');
        }
      }, 65_000);

      // Listen to data from PC (for both full sync and real-time state updates)
      const finishApproval=()=>{
        clearTimeout(approvalTimeout);approvedConnections.add(conn);registerPeerConn(conn);
        localStorage.setItem('projection_lastPairedPeerCode',targetCode);localStorage.setItem('projection_deviceRole','phone');
        retryAttemptRef.current=0;setRetryAttempt(0);retryActionRef.current=null;setConnectionBusy(false);setVerificationCode('');setDirectSyncStatus('success');setTrustVersion(value=>value+1);
        setSyncMessage('Controle autorizado. Agenda e mídias preservadas nos dois aparelhos. Sincronize somente se precisar copiar os dados.');
        const url=new URL(window.location.href);url.searchParams.delete('syncCode');window.history.replaceState({},document.title,url.pathname+url.search+url.hash);
      };
      conn.on('data', async (incomingData: any) => {
        if(generation!==generationRef.current||peerRef.current!==peer||!conn.open)return;
        if(incomingData?.type==='PAIRING_REQUIRED'||incomingData?.type==='PAIRING_REJECTED') {
          pairingRejected=true;clearTimeout(approvalTimeout);session.close();unregisterPeerConn(conn);conn.close();setConnectionBusy(false);setDirectSyncStatus('error');
          setSyncMessage(incomingData.type==='PAIRING_REQUIRED'?'Este PC exige uma nova autorização. Confira o código e conecte novamente.':'O PC recusou a solicitação ou o prazo expirou.');return;
        }
        if(!session.approved) {
          try {
            if(remembered&&incomingData?.type==='TRUSTED_RECONNECT_CHALLENGE') {
              if(checkingResume||resumeContext)return;checkingResume=true;
              const context:ResumeContext={receiverId:incomingData.receiverId,controllerId:incomingData.controllerId,code:incomingData.code,clientNonce:incomingData.clientNonce,serverNonce:incomingData.serverNonce};
              const valid=context.receiverId===remembered.id&&context.controllerId===identity.id&&context.code===targetCode&&context.clientNonce===clientNonce&&await verifyResumeProof(remembered.secret,'receiver',context,incomingData.proof);
              if(!valid){pairingRejected=true;conn.close();setConnectionBusy(false);setDirectSyncStatus('error');setSyncMessage('Não foi possível confirmar a identidade do PC. A conexão foi bloqueada.');return;}
              const proof=await signResumeProof(remembered.secret,'controller',context);
              if(generation!==generationRef.current||!conn.open||findTrustedReceiver(targetCode)?.secret!==remembered.secret)return;
              resumeContext=context;conn.send({type:'TRUSTED_RECONNECT_PROOF',proof,version:1});return;
            }
            if(remembered&&resumeContext&&incomingData?.type==='TRUSTED_RECONNECT_APPROVED'&&!resumeVerified) {
              resumeVerified=true;
              if(!await verifyResumeProof(remembered.secret,'approved',resumeContext,incomingData.proof)||generation!==generationRef.current||!conn.open||findTrustedReceiver(targetCode)?.secret!==remembered.secret){pairingRejected=true;conn.close();return;}
              if(!session.approve(challenge))return;
              connectionTrust.set(conn,remembered);finishApproval();return;
            }
            if(remembered||incomingData?.type!=='PAIRING_APPROVED'||!session.approve(incomingData.challenge))return;
            const enrollment=incomingData.trust;
            if(enrollment&&identity.persistent&&enrollment.controllerId===identity.id&&enrollment.code===targetCode&&enrollment.nonce===clientNonce&&isDeviceId(enrollment.receiverId)&&isTrustNonce(enrollment.secret)) {
              const now=Date.now();const record:TrustedDevice={role:'receiver',id:enrollment.receiverId,secret:enrollment.secret,code:targetCode,label:`PC ${targetCode}`,createdAt:now,lastUsedAt:now};
              if(saveTrustedDevice(record))connectionTrust.set(conn,record);else setTrustMessage('Conectado nesta sessão. Este navegador não conseguiu guardar a autorização.');
            } else {const previous=findTrustedReceiver(targetCode);if(previous)removeTrustedDevice('receiver',previous.id);}
            finishApproval();return;
          } catch {pairingRejected=true;conn.close();setConnectionBusy(false);setDirectSyncStatus('error');setSyncMessage('Não foi possível verificar a autorização deste aparelho.');return;}
        }
        try {
          if (incomingData?.type==='MEDIA_CATALOG') {
            const catalog=readMediaCatalog(incomingData.mediaManifest);
            window.dispatchEvent(new CustomEvent('holylink_remote_catalog',{detail:catalog}));return;
          }
          if (incomingData && (incomingData.type === 'MEDIA_CHUNK_START' || incomingData.type === 'MEDIA_CHUNK_DATA')) {
            const pulling=pendingPullRef.current;
            if(pulling?.conn===conn&&incomingData.type==='MEDIA_CHUNK_START'&&!pulling.expected.has(incomingData.metadata?.id))throw Error('Arquivo não solicitado recusado.');
            const write=handleIncomingChunk(incomingData,conn);pendingMediaWrites.add(write);
            let res;
            try {res=await write;} catch(error){mediaTransferFailed=true;throw error;}
            finally{pendingMediaWrites.delete(write);}
            if (res.complete) {
              if(pendingPullRef.current?.conn===conn&&res.item)pendingPullRef.current.expected.delete(res.item.id);
              window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: 'mediaUpdateTrigger', value: Date.now().toString() } }));
              setSyncMessage('Mídia recebida e salva com sucesso!');
            }
            return;
          }

          if (incomingData && incomingData.type === 'REQUEST_DELTA_MEDIA') {
            if(!Array.isArray(incomingData.ids)||incomingData.ids.length>500||!incomingData.ids.every((id:unknown)=>typeof id==='string'&&id.length>0&&id.length<=200))throw Error('Lista de arquivos solicitados inválida.');
            const requestedIds = new Set(incomingData.ids);
            const allMedia = await getAllMediaItems();
            const mediaToTransfer = allMedia.filter(item => requestedIds.has(item.id));

            for (let i = 0; i < mediaToTransfer.length; i++) {
              const item = mediaToTransfer[i];
              const realBlob = getRealBlob(item.blob);
              if (realBlob && realBlob.size > 0) {
                await sendMediaInChunks(
                  (payload) => sendPeerChunk(conn, payload, () => approvedConnections.has(conn)),
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
            const pending=pendingPullRef.current;
            if(!pending||pending.conn!==conn||pending.manifestReceived){setSyncMessage('Recebimento não solicitado recusado. Seus dados foram preservados.');return;}
            const receivedManifest=readMediaManifest(incomingData.mediaManifest);const storage=readSharedStorage(incomingData.localStorage||{});
            pending.manifestReceived=true;mediaTransferFailed=false;setSyncMessage('Comparando dados do PC. Arquivos exclusivos deste celular serão preservados...');
            const localMedia=await getAllMediaItems();const localManifest=await describeMedia(localMedia,()=>conn.open&&session.approved);
            if(!conn.open||!session.approved||pendingPullRef.current!==pending)return;
            const localHashes=new Map(localManifest.map(item=>[item.id,item.contentHash]));const manifestIds=new Set(receivedManifest.map(item=>item.id));
            const exclusiveIds=new Set(localMedia.filter(item=>!manifestIds.has(item.id)).map(item=>item.id));
            const localMap=new Map(localMedia.map(item=>[item.id,item]));const missingIds:string[]=[];
            for(const item of receivedManifest){
              if(!conn.open||!session.approved)return;
              const local=localMap.get(item.id);
              if(!local?.blob||local.blob.size!==item.size||!item.contentHash||localHashes.get(item.id)!==item.contentHash)missingIds.push(item.id);
              else {const {size:_size,contentHash:_hash,...safe}=item;await saveMediaItem(safe,connectionAbort.signal);}
            }
            if(!conn.open||!session.approved||pendingPullRef.current!==pending)return;
            for(const[key,value]of Object.entries(storage)){
              let next=value;
              if(key==='projection_slidesOrder'||key==='projection_disabledSlides'){
                const incoming=JSON.parse(value);let current:string[]=[];try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(parsed))current=parsed.filter(id=>exclusiveIds.has(id));}catch{/* Ignore only corrupt old order metadata. */}
                next=JSON.stringify([...new Set([...incoming,...current])]);
              }
              localStorage.setItem(key,next);
            }
            pending.expected=new Set(missingIds);pending.comparing=false;
            if(!missingIds.length){pendingPullRef.current=null;window.dispatchEvent(new CustomEvent('projection_full_sync_received'));setDirectSyncStatus('success');setIsPulling(false);setSyncMessage('Dados do PC recebidos. Seus arquivos exclusivos foram preservados.');conn.send({type:'SYNC_COMPLETE',version:1});return;}
            setSyncMessage(`Recebendo ${missingIds.length} arquivo(s) novo(s) ou alterado(s)...`);conn.send({type:'REQUEST_DELTA_MEDIA',ids:missingIds,version:1});return;
          }

          if (incomingData?.type==='SYNC_FAILED') {pendingPullRef.current=null;setIsPulling(false);setIsPushing(false);window.dispatchEvent(new Event('projection_sync_finished'));setSyncMessage(typeof incomingData.message==='string'?incomingData.message.slice(0,500):'O PC não conseguiu salvar todas as mídias. Seus arquivos locais foram preservados.');return;}
          if (incomingData && incomingData.type === 'SYNC_COMPLETE') {
            if(pendingPullRef.current?.conn===conn&&pendingPullRef.current.comparing){mediaTransferFailed=true;throw Error('Confirmação recebida antes da comparação dos arquivos. Tente novamente.');}
            setIsPushing(false);
            await Promise.allSettled([...pendingMediaWrites]);
            if(!conn.open || !session.approved)return;
            if(mediaTransferFailed||pendingPullRef.current?.expected.size){pendingPullRef.current=null;window.dispatchEvent(new Event('projection_sync_finished'));setIsPulling(false);setSyncMessage('A transferência ficou incompleta. Arquivos locais preservados; tente novamente.');return;}
            pendingPullRef.current=null;
            window.dispatchEvent(new CustomEvent('projection_full_sync_received'));
            setDirectSyncStatus('success');
            setSyncMessage('Sincronização de mídias concluída!');
            setIsPulling(false);
            return;
          }

          if (incomingData && incomingData.type === 'UPDATE_STATE') {
            if (!isSharedStateUpdate(incomingData.key, incomingData.value)) {setSyncMessage('Comando inválido ignorado. As configurações foram preservadas.'); return;}
            const bc = new BroadcastChannel('holyrics_projection_sync');
            bc.postMessage({ type: 'UPDATE_STATE', key: incomingData.key, value: incomingData.value });
            bc.close();
            window.dispatchEvent(new CustomEvent('projection_sync_update', { detail: { key: incomingData.key, value: incomingData.value } }));
            if (incomingData.key==='mediaUpdateTrigger') conn.send({type:'REQUEST_MEDIA_CATALOG',version:1});
            return;
          }

          if (incomingData && incomingData.type === 'MEDIA_SAVE') {
            const item=incomingData.mediaItem;
            if(item?.base64)throw Error('Atualize os dois aparelhos: arquivos agora são transferidos por blocos.');
            const existing=(await getAllMediaItems()).find(local=>local.id===item?.id&&local.blob);
            if(!conn.open||!session.approved)return;
            if(!existing){conn.send({type:'REQUEST_MEDIA_CATALOG',version:1});return;}
            const {size:_size,mimeType:_mime,...safe}=readTransferMetadata({...item,size:existing.blob!.size,mimeType:existing.blob!.type||'application/octet-stream'});
            await saveMediaItem(safe,connectionAbort.signal);
            if(!conn.open||!session.approved)return;
            window.dispatchEvent(new CustomEvent('projection_sync_update',{detail:{key:'mediaUpdateTrigger',value:Date.now().toString()}}));return;
          }

          if (incomingData && incomingData.type === 'MEDIA_DELETE') {
            await deleteMediaItem(incomingData.id,connectionAbort.signal);

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

          if(incomingData?.type==='FULL_SYNC'||incomingData?.type==='DELTA_MEDIA_ITEMS'){pendingPullRef.current=null;setIsPulling(false);setSyncMessage('Transferência antiga recusada. Atualize o HolyLink nos dois aparelhos; arquivos preservados.');return;}

        } catch (e) {
          if (!conn.open || !session.approved) return;
          pendingPullRef.current=null;setIsPushing(false);setIsPulling(false);window.dispatchEvent(new Event('projection_sync_finished'));
          setSyncMessage(e instanceof Error?e.message:'Falha ao sincronizar com o PC.');
          console.error("Erro ao processar dados recebidos do PC:", e);
        }
      });

      conn.on('open',()=>{
        if(generation!==generationRef.current||peerRef.current!==peer||!conn.open)return;
        setDirectSyncStatus('sending');
        if(remembered){setVerificationCode('');setSyncMessage('Confirmando a autorização lembrada deste PC...');conn.send({type:'REQUEST_TRUSTED_RECONNECT',deviceId:identity.id,nonce:clientNonce,version:1});}
        else {setVerificationCode(challenge);setSyncMessage('Confira o código e permita o controle no computador.');conn.send({type:'REQUEST_PAIRING',challenge,...(identity.persistent&&crypto.subtle?{deviceId:identity.id,nonce:clientNonce}:{} )});}
      });

      conn.on('close', () => {
        connectionAbort.abort();if(pendingPullRef.current?.conn===conn)pendingPullRef.current=null;clearTimeout(approvalTimeout);
        cancelIncomingTransfers(conn);
        session.close();unregisterPeerConn(conn);
        if(generation!==generationRef.current||peerRef.current!==peer)return;
        setConnectionBusy(false);
        setIsPulling(false);
        setIsPushing(false);
        clearRemoteCatalog();
        window.dispatchEvent(new Event('projection_sync_finished'));
        console.log("Conexão com o PC fechada.");
        unregisterPeerConn(conn);
        if (pairingRejected) return;
        const role = localStorage.getItem('projection_deviceRole');
        if (role === 'phone') {
          setDirectSyncStatus('connecting');
          setSyncMessage('Conexão perdida. Reconectando ao PC automaticamente...');
          triggerAutoReconnect(targetCode);
        }
      });

      conn.on('error', (err) => {
        connectionAbort.abort();if(pendingPullRef.current?.conn===conn)pendingPullRef.current=null;clearTimeout(approvalTimeout);
        cancelIncomingTransfers(conn);
        session.close();unregisterPeerConn(conn);
        if(generation!==generationRef.current||peerRef.current!==peer)return;
        setConnectionBusy(false);
        clearRemoteCatalog();
        window.dispatchEvent(new Event('projection_sync_finished'));
        setIsPushing(false);setIsPulling(false);
        console.error('Erro na conexão com o destino:', err);
        unregisterPeerConn(conn);
        if (pairingRejected) return;
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
      if(generation!==generationRef.current||peerRef.current!==peer||!autoReconnectEnabledRef.current)return;
      setConnectionBusy(false);
      if(connRef.current?.open){setConnectionBusy(!getApprovedPeerConnections().length);setSyncMessage('Canal aberto. Restabelecendo a sinalização quando a rede voltar.');queueReconnect(()=>{if(peerRef.current===peer&&peer.disconnected)peer.reconnect();});return;}
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
      if(generation===generationRef.current&&peerRef.current===peer)queueReconnect(()=>{if(peerRef.current===peer&&peer.disconnected)peer.reconnect();});
    });
  };

  const forcePushToPC = async () => {
    const conn = connRef.current;
    if (!conn || !conn.open || !approvedConnections.has(conn)) {
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
      const mediaManifest = readMediaManifest(await describeMedia(mediaItems,()=>conn.open && approvedConnections.has(conn)));
      storageData.projection_customMeetings ??= JSON.stringify(MEETINGS);
      storageData.projection_customCampaigns ??= JSON.stringify(CAMPAIGNS);
      storageData.projection_disabledSlides ??= '[]';

      conn.send({
        type: 'SYNC_MANIFEST',
        version: 1,
        localStorage: readSharedStorage(storageData),
        mediaManifest
      });

      setSyncMessage("Manifesto transmitido ao PC. Atualizando deltas...");
    } catch (err) {
      setIsPushing(false);
      if(!conn.open || !approvedConnections.has(conn))return;
      console.error(err);
      setSyncMessage(err instanceof Error?err.message:"Erro ao transmitir os dados.");
    }
  };

  const forcePullFromPC = () => {
    const conn = connRef.current;
    if (!conn || !conn.open || !approvedConnections.has(conn)) {
      notify("Conexão inativa. Reconecte primeiro.", "error");
      return;
    }
    if(pendingPullRef.current)return;
    pendingPullRef.current={conn,manifestReceived:false,comparing:true,expected:new Set()};setIsPulling(true);
    setSyncMessage("Solicitando dados completos do PC...");
    conn.send({ type: 'REQUEST_FULL_SYNC', version: 1 });
  };

  // Startup respects a deliberate disconnect and never promotes an old code to trust.
  useEffect(()=>{
    const paused=localStorage.getItem('holylink_connection_paused')==='true';autoReconnectEnabledRef.current=!paused;
    const role=localStorage.getItem('projection_deviceRole');const codeFromUrl=new URLSearchParams(window.location.search).get('syncCode');
    if(codeFromUrl){const timer=setTimeout(()=>{void connectAndSendData(codeFromUrl);},500);return()=>clearTimeout(timer);}
    if(paused){setDirectSyncStatus('idle');return;}
    if(role==='pc'||(!role&&window.innerWidth>=768)){const timer=setTimeout(()=>startReceiver(),500);return()=>clearTimeout(timer);}
    localStorage.setItem('projection_deviceRole','phone');
    const last=localStorage.getItem('projection_lastPairedPeerCode');setDirectSyncStatus('connecting');setSyncMessage('Digite o código exibido no computador.');
    if(last&&isPairingCode(last)){setSyncInputCode(last);if(findTrustedReceiver(last)){const timer=setTimeout(()=>{void connectAndSendData(last);},500);return()=>clearTimeout(timer);}setSyncMessage('Código anterior preenchido. Toque em Conectar para pedir uma nova autorização.');}
  },[]);

  const handleExportBackup=async()=>{
    setIsExporting(true);setBackupMessage(null);
    try {
      const storageData:Record<string,string>={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('projection_')){const value=localStorage.getItem(key);if(value!==null)storageData[key]=value;}}
      storageData.projection_customMeetings??=JSON.stringify(MEETINGS);storageData.projection_customCampaigns??=JSON.stringify(CAMPAIGNS);
      const storage=readSharedStorage(storageData);const items=await getAllMediaItems();
      if(items.length>500||items.some(item=>!(item.blob instanceof Blob)||!item.blob.size))throw Error('Há mídias locais sem arquivo ou a biblioteca excede 500 itens. Confira a biblioteca antes de exportar.');
      if(items.reduce((sum,item)=>sum+item.blob!.size,0)>MAX_BACKUP_MEDIA_BYTES)throw Error('A biblioteca excede os 128 MB de mídias aceitos pelo backup JSON. Preserve também os arquivos originais.');
      const serialized=[];
      // Sequential encoding avoids loading all media binaries at the same time.
      for(const item of items){const {base64,mimeType}=await blobToBase64(item.blob);if(!base64)throw Error('Uma mídia não pôde ser lida. O backup não foi gerado.');serialized.push({id:item.id,type:item.type,name:item.name,duration:item.duration,enabledInLoop:item.enabledInLoop,muted:item.muted,order:item.order,fit:item.fit,mimeType,base64});}
      const backup={version:2,product:'holylink',timestamp:Date.now(),localStorage:storage,mediaItems:serialized};
      // Use the same validation as restoration before offering a supposedly complete file.
      inspectBackup(backup);
      const blob=new Blob([JSON.stringify(backup)],{type:'application/json'});if(blob.size>MAX_BACKUP_FILE_BYTES)throw Error('O arquivo de backup ultrapassa o limite de 192 MB.');
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`holylink_backup_${format(new Date(),'yyyy-MM-dd_HH-mm')}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      setBackupMessage({type:'success',text:'Arquivo de backup gerado. Guarde-o em um lugar seguro.'});
    } catch(error){setBackupMessage({type:'error',text:error instanceof Error?error.message:'Não foi possível gerar o backup.'});}
    finally{setIsExporting(false);}
  };
  const handleImportBackup=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    setIsImporting(true);setPreparedBackup(null);setBackupMessage(null);
    try {
      if(file.size>MAX_BACKUP_FILE_BYTES)throw Error('Escolha um backup JSON de até 192 MB.');
      const prepared=prepareBackup(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));
      setPreparedBackup(prepared);setBackupMessage({type:'success',text:'Arquivo conferido. Revise os dados antes de aplicar.'});
    } catch(error){setBackupMessage({type:'error',text:error instanceof SyntaxError?'O arquivo não contém um backup JSON válido.':error instanceof Error?error.message:'Não foi possível verificar o backup.'});}
    finally{setIsImporting(false);}
  };
  const applyBackup=async()=>{
    if(!preparedBackup||isImporting||isExporting)return;
    const role=localStorage.getItem('projection_deviceRole'),target=localStorage.getItem('projection_lastPairedPeerCode'),wasRunning=!!peerRef.current;
    autoReconnectEnabledRef.current=false;retryActionRef.current=null;const generation=resetTransport();setDirectSyncStatus('idle');setIsImporting(true);setBackupMessage(null);
    try {await applyPreparedBackup(preparedBackup,saveMediaBatch);setPreparedBackup(null);window.dispatchEvent(new CustomEvent('projection_full_sync_received'));setBackupMessage({type:'success',text:'Backup aplicado. Os demais arquivos deste aparelho foram preservados.'});}
    catch(error){setBackupMessage({type:'error',text:error instanceof Error?error.message:'Não foi possível aplicar o backup.'});}
    finally{setIsImporting(false);if(generation===generationRef.current&&wasRunning&&localStorage.getItem('projection_deviceRole')===role){if(role==='pc')startReceiver();else if(role==='phone'&&target&&findTrustedReceiver(target))void connectAndSendData(target);else{setDirectSyncStatus('connecting');setSyncMessage('Restauração concluída ou cancelada. Conecte novamente quando quiser.');}}}
  };

  return (
    <div className="sync-workspace console-area bg-hl-panel border border-hl-line rounded-3xl p-5 flex flex-col gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)]">
      {pendingPairing && <PairingApproval code={pendingPairing.code} canRemember={!!pendingPairing.deviceId&&!!crypto.subtle} onApprove={approvePairing} onReject={rejectPairing}/>}
      <ConsoleIntro icon={Smartphone} title="Conexão e backup" eyebrow="O PC projeta. O celular controla." description="Use o código do computador para conectar o celular e levar o controle da reunião com você." stats={[{label:'Este aparelho',value:localStorage.getItem('projection_deviceRole') === 'phone' ? 'Celular · controle' : 'PC · projeção'},{label:'Conexão',value:({idle:'Pausada',initializing:'Preparando',listening:'Aguardando celular',connecting:connectionBusy?'Conectando':'Pronto para conectar',sending:'Autorizando',receiving:'Recebendo',success:'Conectado',error:'Verificar conexão'})[directSyncStatus]}]}/>
      <ol className="console-connection-path" aria-label="Como conectar"><li><span>01</span><Laptop size={21}/><strong>PC no telão</strong><small>Abra a projeção na segunda tela.</small></li><li><span>02</span><Smartphone size={21}/><strong>Celular no controle</strong><small>Use o código ou QR do computador.</small></li><li><span>03</span><CheckCircle2 size={21}/><strong>Confira a conexão</strong><small>Verifique a exibição no PC e no telão.</small></li></ol>

      <ConnectionPanel role={localStorage.getItem('projection_deviceRole')} code={syncCode} inputCode={syncInputCode} onInputCode={setSyncInputCode} status={directSyncStatus} message={syncMessage} verificationCode={verificationCode} busy={connectionBusy||directSyncStatus==='initializing'} connectedCount={getApprovedPeerConnections().length} attempt={retryAttempt} invitationExpiresAt={invitationExpiresAt}
        onReceiver={()=>startReceiver()} onController={()=>{stopConnection();allowReconnect();localStorage.setItem('projection_deviceRole','phone');setSyncInputCode('');setDirectSyncStatus('connecting');setSyncMessage('Digite o código exibido no computador.');}} onConnect={()=>{void connectAndSendData(syncInputCode,true);}} onStop={stopConnection} onRenew={renewInvitation}
        onNewCode={()=>showConfirm('Gerar outro código?', 'Os celulares conectados serão desconectados. O novo código precisará ser informado novamente; seus arquivos continuam salvos.',()=>startReceiver(true),'info')}
        isPushing={isPushing} isPulling={isPulling}
        onPush={()=>showConfirm('Enviar dados para o PC?','A agenda e as configurações do celular serão usadas no PC. As mídias serão mescladas: arquivos exclusivos do PC permanecem e conteúdos iguais não são reenviados.',()=>{void forcePushToPC();},'danger')}
        onPull={()=>showConfirm('Receber dados do PC?','A agenda e as configurações do PC serão usadas neste celular. As mídias serão mescladas; arquivos exclusivos deste celular permanecem. Exporte um backup se quiser guardar a configuração anterior.',forcePullFromPC,'danger')}
        trusted={readTrustedDevices()} trustMessage={trustMessage}
        onReconnect={device=>{setSyncInputCode(device.code);void connectAndSendData(device.code);}}
        onRevoke={device=>showConfirm('Esquecer aparelho?',`A autorização de ${device.label} será removida e sua conexão atual será encerrada. Nenhum arquivo será apagado.`,()=>revokeTrust(device),'danger')}/>

<details className="holy-disclosure sync-diagnostics"><summary>Diagnóstico de conexão</summary>      {/* BOTÃO DE DIAGNÓSTICO E TESTE AUTOMÁTICO */}
      <div className="bg-hl-canvas border border-hl-line-soft rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_2px_8px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-hl-gold-bright" />
            <div>
              <span className="text-xs font-bold text-hl-soft block font-sans">Diagnóstico do Sistema & Rede</span>
              <span className="text-[10px] text-hl-dim">Testes deste navegador, armazenamento e servidor de sinalização</span>
            </div>
          </div>
          <button
            onClick={runDiagnosticTest}
            disabled={isTesting}
            className="bg-hl-gold hover:bg-hl-gold-bright text-black text-[11px] font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,211,79,0.3)] active:translate-y-[1px] disabled:opacity-50"
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
          <div className="flex flex-col gap-2 mt-1 bg-hl-panel p-3 rounded-xl border border-hl-line-soft text-xs animate-fadeIn shadow-[inset_0_1px_4px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between text-[11px] font-bold text-hl-muted border-b border-hl-line-soft pb-2 font-mono">
              <span>Resultado dos testes neste aparelho:</span>
              {testSummary && (
                <span className={`px-2 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] ${
                  testSummary.success ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' : 'bg-red-950/80 text-red-400 border border-red-800/80'
                }`}>
                  {testSummary.success ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>TESTE CONCLUÍDO</span>
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
                <div key={step.id} className="flex flex-col gap-0.5 bg-hl-canvas p-2.5 rounded-lg border border-hl-line-soft">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-hl-soft text-[11px]">{step.name}</span>
                    <span className="shrink-0">
                      {step.status === 'skipped' && <span className="text-hl-dim text-[10px]">Não realizado</span>}
                      {step.status === 'pending' && <span className="text-hl-dim text-[10px] font-mono">Aguardando</span>}
                      {step.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-hl-gold-bright animate-spin" />}
                      {step.status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {step.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    </span>
                  </div>
                  {step.detail && (
                    <span className={`text-[10px] ${step.status === 'fail' ? 'text-red-400 font-mono' : 'text-hl-muted'}`}>
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
                    Ida e volta WebRTC neste aparelho: {testSummary.latencyMs}ms
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

</details>
      <BackupPanel busy={isExporting||isImporting} exporting={isExporting} importing={isImporting} onExport={()=>{void handleExportBackup();}} onSelect={()=>backupInputRef.current?.click()} onApply={()=>{void applyBackup();}} onCancel={()=>{setPreparedBackup(null);setBackupMessage(null);}} summary={preparedBackup?{files:preparedBackup.mediaItems.length,settings:Object.keys(preparedBackup.localStorage).length,bytes:preparedBackup.totalBytes}:null} message={backupMessage}/>
      <input ref={backupInputRef} id="backup-file-input" type="file" accept=".json,application/json" aria-label="Selecionar arquivo de backup" onChange={handleImportBackup} disabled={isExporting||isImporting} className="sr-only"/>

    </div>
  );
});
