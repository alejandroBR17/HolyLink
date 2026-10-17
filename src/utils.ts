/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {mergeMediaRecord} from './utils/media-record';
import { Meeting } from './types';
import { MEETINGS } from './data';

import {findMeetingSchedule} from './utils/agenda';
export function getNextMeeting(now:Date,meetingsList:Meeting[]=MEETINGS){return findMeetingSchedule(now,meetingsList);}

// ==========================================
// INDEXEDDB STORAGE FOR CUSTOM MEDIA & CONFIGS
// ==========================================

const DB_NAME = 'holyrics_media_db';
const STORE_NAME = 'media_items';
const SETTINGS_STORE = 'settings';

export interface DBMediaItem {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number; // in milliseconds
  enabledInLoop: boolean;
  blob?: Blob;
  localBlobVersion?:string;
  muted?: boolean;
  order?: number;
  fit?: 'contain' | 'cover' | 'fill';
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE); // keyless store, explicit keys will be passed
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
}

export async function saveSetting(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Could not save setting to IndexedDB:", e);
    // Fallback to localStorage as a safety net
    try {
      localStorage.setItem(`idb_fallback_${key}`, JSON.stringify(value));
    } catch (err) {}
  }
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result !== undefined ? request.result : defaultValue);
      };
      request.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch (e) {
    console.warn("Could not read setting from IndexedDB:", e);
    try {
      const val = localStorage.getItem(`idb_fallback_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch (err) {
      return defaultValue;
    }
  }
}

export async function saveMediaItem(item: DBMediaItem, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  const db = await openDB();
  if (signal?.aborted) {db.close(); signal.throwIfAborted();}
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const abort = () => {try {transaction.abort();} catch {}};
    const cleanup = () => {signal?.removeEventListener('abort', abort); db.close();};
    signal?.addEventListener('abort', abort, {once:true});
    transaction.oncomplete = () => {cleanup(); resolve();};
    transaction.onerror = () => {cleanup(); reject(signal?.reason || transaction.error || new Error('Falha ao salvar mídia.'));};
    transaction.onabort = () => {cleanup(); reject(signal?.reason || transaction.error || new Error('Gravação de mídia cancelada.'));};
    const request = store.get(item.id);
    request.onsuccess = () => {
      if (signal?.aborted) {abort(); return;}
      const existing = request.result;
      try {store.put(mergeMediaRecord(existing,item));} catch {abort();}
    };
  });
}

/** All restored files commit together; an aborted batch leaves the old library intact. */
export async function saveMediaBatch(items:DBMediaItem[]):Promise<void> {
  if(!items.length)return;
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(STORE_NAME,'readwrite');const store=transaction.objectStore(STORE_NAME);
    transaction.oncomplete=()=>{db.close();resolve();};
    transaction.onabort=()=>{db.close();reject(transaction.error||new Error('Restauração de mídias cancelada.'));};
    transaction.onerror=()=>{ /* IndexedDB aborts the entire transaction. */ };
    for(const item of items){const request=store.get(item.id);request.onsuccess=()=>{try{const current=request.result;store.put(mergeMediaRecord(current,item));}catch{transaction.abort();}};}
  });
}

/** A failed read is not an empty library. Callers keep their last good snapshot. */
export async function getAllMediaItems(): Promise<DBMediaItem[]> {
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(STORE_NAME,'readonly');
    let items:DBMediaItem[]=[];
    const request=transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess=()=>{items=request.result||[];};
    transaction.oncomplete=()=>{db.close();resolve(items);};
    transaction.onerror=()=>{db.close();reject(transaction.error||request.error||new Error('Não foi possível ler a biblioteca local.'));};
    transaction.onabort=()=>{db.close();reject(transaction.error||new Error('Leitura da biblioteca cancelada.'));};
  });
}

export async function deleteMediaItem(id:string,signal?:AbortSignal):Promise<void> {
  signal?.throwIfAborted();const db=await openDB();if(signal?.aborted){db.close();signal.throwIfAborted();}
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(STORE_NAME,'readwrite');
    const abort=()=>{try{transaction.abort();}catch{}};const cleanup=()=>{signal?.removeEventListener('abort',abort);db.close();};
    signal?.addEventListener('abort',abort,{once:true});transaction.oncomplete=()=>{cleanup();resolve();};
    transaction.onabort=()=>{cleanup();reject(signal?.reason||transaction.error||new Error('Exclusão cancelada.'));};
    transaction.onerror=()=>{ /* Default IndexedDB abort rolls this operation back. */ };
    if(signal?.aborted){abort();return;}transaction.objectStore(STORE_NAME).delete(id);
  });
}

export const getSlideDuration = (slideId: string, customMedia: any[] = []): number => {
  if (slideId.startsWith('custom_')) {
    const item = customMedia.find(m => m.id === slideId);
    if (item && item.duration && !isNaN(item.duration) && isFinite(item.duration) && item.duration > 0) {
      return item.duration;
    }
    return 10000;
  }
  if (slideId.startsWith('agenda_day_')) return 12000;
  if (slideId.startsWith('meeting_event_')) return 12000;
  if (slideId.startsWith('verse_')) return 15000;
  if (slideId === 'world_god') return 15000;
  if (slideId === 'soon') return 7000;
  if (['seat', 'bathroom', 'phone', 'no_chat'].includes(slideId)) return 8000;
  if (['social', 'campaigns'].includes(slideId)) return 12000;
  if (slideId === 'donations') return 20000;
  return 10000;
};

