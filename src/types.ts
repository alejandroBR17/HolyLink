/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Meeting {
  id: string;
  day?: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado (para recorrentes)
  dayName: string;
  theme: string;
  time: string; // e.g. "08:00", "19:30"
  hours: number;
  minutes: number;
  date?: string; // YYYY-MM-DD para eventos pontuais únicos
}

export interface DaySchedule {
  dayName: string;
  dayIndex: number;
  theme: string;
  times: string[];
}
