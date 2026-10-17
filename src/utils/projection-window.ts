export interface ProjectionWindowCommand {
  id: string;
  action: 'open' | 'close';
  at: number;
}

export interface ProjectionWindowResult {
  id: string;
  status: 'open' | 'closed' | 'blocked';
  at: number;
}

const COMMAND_MAX_AGE_MS = 15_000;
const CLOCK_SKEW_TOLERANCE_MS = 5_000;
const MAX_REMEMBERED_COMMANDS = 100;
const DEFAULT_WINDOW_FEATURES = 'width=1280,height=720,menubar=no,status=no,titlebar=no';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasValidEnvelope(value: unknown): value is Record<string, unknown> {
  return isRecord(value) &&
    typeof value.id === 'string' && /^[a-f0-9-]{36}$/.test(value.id) &&
    typeof value.at === 'number' && Number.isSafeInteger(value.at) && value.at > 0 &&
    Object.keys(value).length === 3;
}

export function validWindowCommand(value: unknown): value is ProjectionWindowCommand {
  return hasValidEnvelope(value) && ['open', 'close'].includes(value.action as string);
}

export function validWindowResult(value: unknown): value is ProjectionWindowResult {
  return hasValidEnvelope(value) && ['open', 'closed', 'blocked'].includes(value.status as string);
}

export function isWindowMessage(key: string): boolean {
  return key === 'projectionWindowCommand' || key === 'projectionWindowResult';
}

/** Saved geometry is a hint; never send unvalidated storage values to window.open. */
export function projectionWindowFeatures(savedBounds: string | null): string {
  try {
    const bounds = JSON.parse(savedBounds || 'null');
    if (!bounds || ![bounds.left, bounds.top, bounds.width, bounds.height].every(Number.isFinite)) {
      return DEFAULT_WINDOW_FEATURES;
    }
    const {left, top, width, height} = bounds;
    if (Math.abs(left) > 32_000 || Math.abs(top) > 32_000 ||
        width < 320 || width > 8192 || height < 240 || height > 8192) {
      return DEFAULT_WINDOW_FEATURES;
    }
    return `${DEFAULT_WINDOW_FEATURES},left=${Math.round(left)},top=${Math.round(top)},width=${Math.round(width)},height=${Math.round(height)}`;
  } catch {
    return DEFAULT_WINDOW_FEATURES;
  }
}

/** Transient commands never replay after reconnect, backup, or browser reload. */
export class WindowCommandGate {
  private seen = new Set<string>();

  accept(command: ProjectionWindowCommand, now = Date.now()): boolean {
    if (!validWindowCommand(command) ||
        now - command.at > COMMAND_MAX_AGE_MS ||
        command.at - now > CLOCK_SKEW_TOLERANCE_MS ||
        this.seen.has(command.id)) {
      return false;
    }
    this.seen.add(command.id);
    if (this.seen.size > MAX_REMEMBERED_COMMANDS) {
      this.seen.delete(this.seen.values().next().value!);
    }
    return true;
  }
}
