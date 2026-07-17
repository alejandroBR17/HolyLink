export type SlideType = string;

export interface CustomMedia {
  id: string;
  type: 'image' | 'video';
  name: string;
  duration: number; // in milliseconds
  enabledInLoop: boolean;
  url: string;
  videoMuted?: boolean;
  unpinOnEnd?: boolean;
}

export interface Meeting {
  id: string;
  day: number;
  dayName: string;
  theme: string;
  time: string;
  hours: number;
  minutes: number;
}

export interface DaySchedule {
  dayName: string;
  dayIndex: number;
  theme: string;
  times: string[];
}
