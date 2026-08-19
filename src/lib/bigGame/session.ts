// The Wilderness: Big Game — client-side persistence for the tribe-leader screen.
//
// Nothing here is authoritative. The token identifies a server-side session;
// the cached state exists only so a leader who walks behind the dining hall and
// loses signal keeps seeing their destination instead of a blank screen. Every
// value is re-derived from the server the moment the network returns.

import type { LeaderState } from './types';

const TOKEN_KEY = 'bg_leader_token';
const DEVICE_KEY = 'bg_device_id';
const STATE_KEY = 'bg_leader_state_cache';
const PENDING_KEY = 'bg_pending_submission';

export interface PendingSubmission {
  code: string;
  round: number;
  idempotencyKey: string;
  queuedAt: string;
}

/** crypto.randomUUID needs a secure context; camp Wi-Fi may not give us one. */
export function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private-browsing / storage-disabled phones still get a working game;
    // they just lose their session on refresh.
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* not fatal — see read() */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* not fatal — see read() */
  }
}

/** Stable per-device id, used only to rate-limit join attempts. */
export function getDeviceId(): string {
  const existing = read(DEVICE_KEY);
  if (existing) return existing;
  const created = randomId();
  write(DEVICE_KEY, created);
  return created;
}

export function getToken(): string | null {
  return read(TOKEN_KEY);
}

export function setToken(token: string): void {
  write(TOKEN_KEY, token);
}

export function clearToken(): void {
  remove(TOKEN_KEY);
  remove(STATE_KEY);
  remove(PENDING_KEY);
}

export function getCachedState(): LeaderState | null {
  const raw = read(STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LeaderState;
  } catch {
    remove(STATE_KEY);
    return null;
  }
}

export function setCachedState(state: LeaderState): void {
  write(STATE_KEY, JSON.stringify(state));
}

export function getPendingSubmission(): PendingSubmission | null {
  const raw = read(PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSubmission;
  } catch {
    remove(PENDING_KEY);
    return null;
  }
}

export function setPendingSubmission(pending: PendingSubmission): void {
  write(PENDING_KEY, JSON.stringify(pending));
}

export function clearPendingSubmission(): void {
  remove(PENDING_KEY);
}

/**
 * Same normalisation the server applies, so the leader sees the string that
 * will actually be compared rather than whatever autocorrect produced.
 */
export function normaliseCode(input: string): string {
  return input.trim().replace(/\s+/g, ' ').toUpperCase();
}
