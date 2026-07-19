/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Meeting } from './types';
import { MEETINGS } from './data';

/**
 * Calculates the next meeting and any currently ongoing meeting.
 * Meetings are assumed to last 90 minutes.
 */
export function getNextMeeting(now: Date, meetingsList: Meeting[] = MEETINGS): {
  nextMeeting: Meeting;
  nextMeetingDate: Date;
  ongoingMeeting: Meeting | null;
} {
  let ongoingMeeting: Meeting | null = null;
  
  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateStr(now);

  // 1. Check if there is an ongoing meeting (started within last 90 minutes)
  for (const m of meetingsList) {
    const isOngoingToday = m.date 
      ? m.date === todayStr
      : m.day === now.getDay();

    if (isOngoingToday) {
      const mStart = new Date(now);
      mStart.setHours(m.hours, m.minutes, 0, 0);
      const mEnd = new Date(mStart.getTime() + 90 * 60 * 1000); // 90 minutes later
      
      if (now >= mStart && now < mEnd) {
        ongoingMeeting = m;
        break;
      }
    }
  }

  // 2. Find the absolute next meeting
  for (let d = 0; d <= 7; d++) {
    const candidateDate = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = candidateDate.getDay();
    const candidateStr = formatDateStr(candidateDate);
    
    // Filter meetings on this candidate day
    const dayMeetings = meetingsList.filter(m => {
      if (m.date) {
        return m.date === candidateStr;
      }
      return m.day === dayOfWeek;
    });
    
    // Sort meetings by time of day
    const sorted = [...dayMeetings].sort((a, b) => {
      return (a.hours * 60 + a.minutes) - (b.hours * 60 + b.minutes);
    });
    
    for (const m of sorted) {
      const mTime = new Date(candidateDate);
      mTime.setHours(m.hours, m.minutes, 0, 0);
      
      // If we are looking at today, the meeting must be in the future
      if (mTime > now) {
        return {
          nextMeeting: m,
          nextMeetingDate: mTime,
          ongoingMeeting
        };
      }
    }
  }

  // Fallback
  const defaultMeeting = meetingsList[0] || MEETINGS[0];
  const fallbackDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  fallbackDate.setHours(defaultMeeting.hours, defaultMeeting.minutes, 0, 0);
  return {
    nextMeeting: defaultMeeting,
    nextMeetingDate: fallbackDate,
    ongoingMeeting
  };
}

// ==========================================
// INDEXEDDB STORAGE FOR CUSTOM MEDIA
// ==========================================

const DB_NAME = 'holyrics_media_db';
const STORE_NAME = 'media_items';

export interface DBMediaItem {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number; // in milliseconds
  enabledInLoop: boolean;
  blob: Blob;
  muted?: boolean;
  order?: number;
  fit?: 'contain' | 'cover' | 'fill';
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
}

export async function saveMediaItem(item: DBMediaItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllMediaItems(): Promise<DBMediaItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB not supported or accessible in this environment:", e);
    return [];
  }
}

export async function deleteMediaItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const getSlideDuration = (slideId: string, customMedia: any[] = []): number => {
  if (slideId.startsWith('custom_')) {
    const item = customMedia.find(m => m.id === slideId);
    return item ? item.duration : 10000;
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

