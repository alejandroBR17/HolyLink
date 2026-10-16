import {calendarDate} from './agenda.ts';
type Validator = (value: unknown) => boolean;
const text = (max: number): Validator => value => typeof value === 'string' && value.length <= max;
const nullable = (check: Validator): Validator => value => value === null || check(value);
const oneOf = (...values: unknown[]): Validator => value => values.includes(value);
const number = (min: number, max: number, integer = false): Validator => value => {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^-?\d+(\.\d+)?$/.test(value))) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max && (!integer || Number.isInteger(parsed));
};
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const array = (check: Validator, max = 500): Validator => value => {
  let parsed = value;
  if (typeof value === 'string') {
    if (value.length > 500_000) return false;
    try { parsed = JSON.parse(value); } catch { return false; }
  }
  return Array.isArray(parsed) && parsed.length <= max && parsed.every(check) && JSON.stringify(parsed).length <= 500_000;
};
const optional = (value: unknown, check: Validator) => value === undefined || check(value);
const date = (value: unknown) => calendarDate(value)!==null;
const meeting: Validator = value => record(value) && Object.keys(value).every(key => ['id','theme','day','dayName','time','hours','minutes','date'].includes(key))
  && text(200)(value.id) && text(2000)(value.theme) && text(100)(value.dayName)
  && typeof value.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)
  && number(0, 23, true)(value.hours) && number(0, 59, true)(value.minutes)
  && Number(value.hours)===Number(value.time.slice(0,2)) && Number(value.minutes)===Number(value.time.slice(3))
  && optional(value.day, number(0, 6, true)) && optional(value.date, date);
const campaign: Validator = value => record(value) && Object.keys(value).every(key => ['id','title','duration','iconType','endDate'].includes(key))
  && text(200)(value.id) && text(4000)(value.title)
  && text(2000)(value.duration) && oneOf('flame', 'wifi_off', 'globe', 'faith')(value.iconType)
  && optional(value.endDate, v => v === '' || date(v));

// Explicit application state only: device identity and arbitrary storage keys are never transferable.
const validators: Record<string, Validator> = {
  manualSlideOverride: nullable(text(200)), slidesOrder: array(text(200)), disabledSlides: array(text(200)),
  customVerseText: nullable(text(100_000)), customVerseRef: nullable(text(500)), activeVerseIndex: nullable(number(0, 10_000, true)),
  projectionMode: oneOf('pre', 'post'), projectionTheme: oneOf('auto','fju','regular'), fjuProjectsEnabled: oneOf(true,false,'true','false'),
  activeAlert: nullable(text(10_000)), tickerText: nullable(text(10_000)),
  blackoutEnabled: oneOf(true, false, 'true', 'false'), clearContentEnabled: oneOf(true, false, 'true', 'false'),
  countdownPaused: oneOf(true, false, 'true', 'false'), dismissedJustStarted: oneOf(true, false, 'true', 'false'),
  countdownAnchor: nullable(number(0,4102444800000,true)), pausedSeconds: nullable(number(0, 31_536_000, true)), countdownOffset: number(-31_536_000_000, 31_536_000_000, true),
  videoPinBehavior: oneOf('unpin', 'loop'), finalMinuteDisplayMode: oneOf('split', 'full_video'),
  verseDisplayPriority: oneOf('verse_over_video', 'video_over_verse'),
  carouselStartTimeOffset: number(-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true),
  customMeetings: array(meeting), customCampaigns: array(campaign), volume: number(0, 1),
  isProjectionOpen: oneOf(true, false, 'true', 'false'), projectionCloseTrigger: nullable(text(100)),
  mediaUpdateTrigger: text(100), background3DStyle: oneOf('auto', 'aurora', 'veil', 'fju_aura', 'particles_2d', 'off'),
  background3DFps: oneOf(30, 60, '30', '60'), background3DIntensity: oneOf('high', 'medium', 'low'),
  default_img_duration: number(2000, 86_400_000, true),
};

export function isSharedStateUpdate(key: unknown, value: unknown): key is string {
  return typeof key === 'string' && Object.hasOwn(validators, key) && validators[key](value);
}

/** Validate everything before the caller writes anything. Unknown/device keys are skipped. */
export function readSharedStorage(value: unknown): Record<string, string> {
  if (!record(value) || Object.keys(value).length > 200) throw new Error('Configurações de sincronização inválidas.');
  const result: Record<string, string> = {};
  let total = 0;
  for (const [key, val] of Object.entries(value)) {
    if (!key.startsWith('projection_')) continue;
    const name = key.slice('projection_'.length);
    if (!Object.hasOwn(validators, name) || ['isProjectionOpen', 'projectionCloseTrigger', 'mediaUpdateTrigger'].includes(name)) continue;
    if (typeof val !== 'string' || !isSharedStateUpdate(name, val)) throw new Error('Configuração inválida: ' + name);
    total += val.length;
    if (total > 1_000_000) throw new Error('Configurações de sincronização excedem o limite.');
    result[key] = val;
  }
  return result;
}
