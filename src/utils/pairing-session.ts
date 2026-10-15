/** Approval belongs to one transport, never to a remembered peer ID. */
export class PairingSession {
  private state: 'pending' | 'approved' | 'closed' = 'pending';
  private readonly expiresAt: number;
  private readonly challenge: string;
  constructor(challenge: string, now = Date.now()) {
    this.challenge = challenge;
    this.expiresAt = now + 60_000;
  }
  approve(challenge: unknown, now = Date.now()): boolean {
    if (this.state !== 'pending' || now >= this.expiresAt || challenge !== this.challenge) return false;
    this.state = 'approved';
    return true;
  }
  get approved(): boolean { return this.state === 'approved'; }
  close(): void { this.state = 'closed'; }
}

export function createPairingCode(): string {
  // 32 symbols: unbiased mapping, without visually ambiguous I/O/0/1.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return [...crypto.getRandomValues(new Uint8Array(6))].map(byte => alphabet[byte % 32]).join('');
}

export function isPairingCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-HJ-NP-Z2-9]{6}$/.test(value);
}
