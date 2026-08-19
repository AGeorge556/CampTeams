// The Wilderness: Big Game — game director's data + actions.
//
// Every screen the director touches during the event reads through this one
// hook: it polls bg_admin_overview() so the board tracks the live game, and
// wraps every mutating RPC so a failed tap can never throw past a button's
// onClick or blank the board mid-round. Polling pauses for the duration of a
// write so a stray refresh can never land between a mutation and its own
// post-write refresh and show the director a stale "before" state.

import { useEffect, useRef, useState } from 'react';
import { useToast } from '../components/Toast';
import {
  adminOverview,
  advancePreview,
  advanceRound,
  auditLog,
  BigGameError,
  exportResults,
  overrideComplete,
  resetAll,
  resetTribe,
  selfTest,
  setPaused,
  setRevealNextEarly,
  skipStation,
  startGame,
} from '../lib/bigGame/api';
import type {
  AdminOverview,
  AdvancePreview,
  AuditEntry,
  ExportRow,
  SelfTestResult,
} from '../lib/bigGame/types';

const POLL_INTERVAL_MS = 5000;

function errorMessage(err: unknown): string {
  if (err instanceof BigGameError || err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

interface ActionOptions<T> {
  /** Toast title on failure. The server's own message is always shown verbatim underneath it. */
  errorTitle?: string;
  successTitle?: string;
  successMessage?: (result: T) => string;
}

export interface UseBigGameAdminResult {
  overview: AdminOverview | null;
  /** Advisory only — never used to gate or auto-trigger anything. */
  elapsedRoundMs: number | null;
  loading: boolean;
  error: string | null;
  busy: string | null;
  refresh: () => Promise<void>;
  start: () => Promise<boolean>;
  advance: () => Promise<boolean>;
  previewAdvance: () => Promise<AdvancePreview | null>;
  pause: () => Promise<boolean>;
  resume: () => Promise<boolean>;
  setReveal: (reveal: boolean) => Promise<boolean>;
  override: (tribeId: string) => Promise<boolean>;
  skip: (tribeId: string) => Promise<boolean>;
  resetOne: (tribeId: string) => Promise<boolean>;
  resetEverything: (confirmation: string, force: boolean) => Promise<boolean>;
  fetchAudit: () => Promise<AuditEntry[]>;
  fetchExport: () => Promise<ExportRow[]>;
  runSelfTest: () => Promise<SelfTestResult[]>;
}

export default function useBigGameAdmin(): UseBigGameAdminResult {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { addToast } = useToast();

  // A write in flight blocks the poller from landing mid-mutation — see the
  // file banner. A ref (not state) because flipping it must never itself
  // trigger a render.
  const mutatingRef = useRef(false);

  const refresh = async () => {
    if (mutatingRef.current) return;
    try {
      const data = await adminOverview();
      setOverview(data);
      setError(null);
    } catch (err) {
      // Keep the last good overview on screen — a failed poll must never
      // blank the director's board mid-game.
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // Intentionally mount-only: refresh() closes only over stable setters and
    // mutatingRef, so re-running this effect on every render would just churn
    // the interval for no benefit.
  }, []);

  // Ticks once a second purely to force a re-render, so any consumer showing
  // an elapsed or relative time visibly counts up between the 5-second polls.
  // Never touches the network.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Skew between this laptop's clock and the server's, resynced every time a
  // fresh overview lands. elapsedRoundMs below is computed through this skew
  // rather than off the raw local clock, so a wrong laptop clock can only get
  // the display's tick *rate* wrong — never its starting point.
  const skewRef = useRef(0);
  useEffect(() => {
    if (overview) {
      skewRef.current = Date.now() - new Date(overview.serverTime).getTime();
    }
  }, [overview]);

  let elapsedRoundMs: number | null = null;
  if (overview?.game.roundStartedAt) {
    const serverNow = Date.now() - skewRef.current;
    const startedAt = new Date(overview.game.roundStartedAt).getTime();
    elapsedRoundMs = Math.max(0, serverNow - startedAt);
  }

  /**
   * Every mutating/fetching action funnels through here: marks `busy` so one
   * button can spin without freezing the rest of the board, pauses polling
   * for the duration, refreshes the overview on success, and always toasts
   * and swallows failures rather than throwing out of an onClick.
   */
  async function runAction<T>(
    key: string,
    fn: () => Promise<T>,
    options: ActionOptions<T> = {}
  ): Promise<T | null> {
    setBusy(key);
    mutatingRef.current = true;
    try {
      const result = await fn();
      await refresh();
      if (options.successTitle) {
        addToast({
          type: 'success',
          title: options.successTitle,
          message: options.successMessage ? options.successMessage(result) : '',
        });
      }
      return result;
    } catch (err) {
      addToast({
        type: 'error',
        title: options.errorTitle ?? 'Action failed',
        // Verbatim server message — e.g. bg_admin_start names exactly which
        // setup checklist items are missing, and paraphrasing would hide that.
        message: errorMessage(err),
      });
      return null;
    } finally {
      mutatingRef.current = false;
      setBusy(null);
    }
  }

  const start = async () =>
    (await runAction('start', startGame, {
      errorTitle: 'Could not start game',
      successTitle: 'Game started',
    })) !== null;

  const advance = async () =>
    (await runAction('advance', advanceRound, {
      errorTitle: 'Could not advance round',
      successTitle: 'Round advanced',
    })) !== null;

  const previewAdvance = () =>
    runAction('preview', advancePreview, {
      errorTitle: 'Could not preview advance',
    });

  const pause = async () =>
    (await runAction('pause', () => setPaused(true), {
      errorTitle: 'Could not pause',
      successTitle: 'Game paused',
    })) !== null;

  const resume = async () =>
    (await runAction('resume', () => setPaused(false), {
      errorTitle: 'Could not resume',
      successTitle: 'Game resumed',
    })) !== null;

  const setReveal = async (reveal: boolean) =>
    (await runAction('reveal', () => setRevealNextEarly(reveal), {
      errorTitle: 'Could not update reveal setting',
      successTitle: reveal ? 'Reveal-next enabled' : 'Reveal-next disabled',
    })) !== null;

  const override = async (tribeId: string) =>
    (await runAction(`override:${tribeId}`, () => overrideComplete(tribeId), {
      errorTitle: 'Could not mark complete',
      successTitle: 'Marked complete',
    })) !== null;

  const skip = async (tribeId: string) =>
    (await runAction(`skip:${tribeId}`, () => skipStation(tribeId), {
      errorTitle: 'Could not skip station',
      successTitle: 'Station skipped',
    })) !== null;

  const resetOne = async (tribeId: string) =>
    (await runAction(`reset:${tribeId}`, () => resetTribe(tribeId), {
      errorTitle: 'Could not reset tribe',
      successTitle: 'Tribe reset',
    })) !== null;

  const resetEverything = async (confirmation: string, force: boolean) =>
    (await runAction('reset-all', () => resetAll(confirmation, force), {
      errorTitle: 'Could not reset progress',
      successTitle: 'All progress reset',
    })) !== null;

  const fetchAudit = async () =>
    (await runAction('audit', () => auditLog(), {
      errorTitle: 'Could not load audit log',
    })) ?? [];

  const fetchExport = async () =>
    (await runAction('export', () => exportResults(), {
      errorTitle: 'Could not load export',
    })) ?? [];

  const runSelfTest = async () =>
    (await runAction('selftest', () => selfTest(), {
      errorTitle: 'Could not run self test',
    })) ?? [];

  return {
    overview,
    elapsedRoundMs,
    loading,
    error,
    busy,
    refresh,
    start,
    advance,
    previewAdvance,
    pause,
    resume,
    setReveal,
    override,
    skip,
    resetOne,
    resetEverything,
    fetchAudit,
    fetchExport,
    runSelfTest,
  };
}
