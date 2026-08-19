// The Wilderness: Big Game — tribe-leader session hook.
//
// Owns every piece of state the mobile leader screen needs: bootstrapping a
// cached session instantly, polling for round advances, and queuing a code
// submission durably so a dead patch of camp Wi-Fi never loses a correct
// answer. Nothing here renders anything — see LeaderScreen.tsx for that.
//
// The rule that matters most: a failed network request must never clear the
// screen, drop the session, or fabricate a result. Every outcome the UI can
// show came from the server; this hook only ever forwards it.

import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../lib/bigGame/api';
import * as session from '../lib/bigGame/session';
import type { PendingSubmission } from '../lib/bigGame/session';
import type { LeaderState, SubmitOutcome } from '../lib/bigGame/types';

const POLL_INTERVAL_MS = 7000;
const RETRY_DELAYS_MS = [2000, 4000, 8000];
const RETRY_DELAY_CAP_MS = 15000;

export type ConnectionState = 'online' | 'reconnecting' | 'offline';

/**
 * Symbolic reason for a join failure. The hook stays language-agnostic —
 * LeaderScreen maps this to a localized string via bigGameStrings().
 */
export type JoinErrorReason = 'INVALID' | 'THROTTLED' | 'NETWORK';

export interface UseBigGameLeaderResult {
  state: LeaderState | null;
  loading: boolean;
  joining: boolean;
  submitting: boolean;
  connection: ConnectionState;
  lastOutcome: SubmitOutcome | null;
  pending: PendingSubmission | null;
  error: JoinErrorReason | null;
  joinTribe: (code: string) => void;
  submit: (code: string) => void;
  leave: () => void;
  dismissOutcome: () => void;
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function useBigGameLeader(): UseBigGameLeaderResult {
  const [token, setToken] = useState<string | null>(() => session.getToken());
  const [state, setState] = useState<LeaderState | null>(() =>
    session.getCachedState()
  );
  const [pending, setPending] = useState<PendingSubmission | null>(() =>
    session.getPendingSubmission()
  );
  const [submitting, setSubmitting] = useState<boolean>(
    () => session.getPendingSubmission() !== null
  );
  const [loading, setLoading] = useState<boolean>(
    () => session.getToken() !== null && session.getCachedState() === null
  );
  const [joining, setJoining] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>(() =>
    isOnline() ? 'online' : 'offline'
  );
  const [lastOutcome, setLastOutcome] = useState<SubmitOutcome | null>(null);
  const [error, setError] = useState<JoinErrorReason | null>(null);

  // Refs mirror the state above so callbacks that must stay referentially
  // stable (for the poll effect's dependency array) can still read the
  // latest value instead of closing over a stale one.
  const tokenRef = useRef(token);
  const stateRef = useRef(state);
  const pendingRef = useRef(pending);
  const submittingRef = useRef(submitting);
  const joiningRef = useRef(false);
  const lastRoundRef = useRef<number | null>(state?.game.currentRound ?? null);
  const retryAttemptRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const pollInFlightRef = useRef(false);

  const clearPendingInternal = useCallback(() => {
    session.clearPendingSubmission();
    pendingRef.current = null;
    setPending(null);
    retryAttemptRef.current = 0;
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Single funnel for every server-confirmed LeaderState, whether it came
   * from bootstrap, a poll, a join, or a submit response. Detects a round
   * change exactly once here so the other four call sites don't each need
   * their own copy of that logic.
   */
  const applyState = useCallback(
    (newState: LeaderState, opts?: { outcome?: SubmitOutcome }) => {
      const previousRound = lastRoundRef.current;
      const roundChanged =
        opts?.outcome === 'ROUND_CHANGED' ||
        (previousRound !== null &&
          previousRound !== newState.game.currentRound);

      lastRoundRef.current = newState.game.currentRound;
      stateRef.current = newState;
      setState(newState);
      session.setCachedState(newState);

      if (roundChanged) {
        const activePending = pendingRef.current;
        if (
          activePending &&
          activePending.round !== newState.game.currentRound
        ) {
          clearPendingInternal();
          submittingRef.current = false;
          setSubmitting(false);
        }
        setLastOutcome('ROUND_CHANGED');
      } else if (opts?.outcome) {
        setLastOutcome(opts.outcome);
      }
    },
    [clearPendingInternal]
  );

  const handleInvalidSession = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    session.clearToken(); // also wipes cached state + any pending submission
    tokenRef.current = null;
    setToken(null);
    stateRef.current = null;
    setState(null);
    pendingRef.current = null;
    setPending(null);
    retryAttemptRef.current = 0;
    lastRoundRef.current = null;
    submittingRef.current = false;
    setSubmitting(false);
    setError(null);
  }, []);

  /**
   * Sends one submission attempt. On a definitive server answer (ok:true or
   * INVALID_SESSION) it resolves the pending submission. On a thrown
   * (network) error it schedules a retry with the SAME idempotency key,
   * backing off 2s/4s/8s and then capping at 15s, and never fabricates a
   * result in the meantime.
   */
  const performSubmit = useCallback(
    async (pendingSub: PendingSubmission) => {
      const activeToken = tokenRef.current;
      if (!activeToken) return;
      try {
        const res = await api.submitCode({
          token: activeToken,
          code: pendingSub.code,
          expectedRound: pendingSub.round,
          idempotencyKey: pendingSub.idempotencyKey,
        });
        // A round change (via poll) or a fresh submit may have superseded
        // this one while it was in flight — drop a now-stale answer.
        if (pendingRef.current?.idempotencyKey !== pendingSub.idempotencyKey) {
          return;
        }
        if (res.ok) {
          setConnection('online');
          clearPendingInternal();
          submittingRef.current = false;
          setSubmitting(false);
          applyState(res.state, { outcome: res.outcome });
        } else {
          handleInvalidSession();
        }
      } catch {
        if (pendingRef.current?.idempotencyKey !== pendingSub.idempotencyKey) {
          return;
        }
        setConnection(isOnline() ? 'reconnecting' : 'offline');
        const attempt = retryAttemptRef.current;
        const delay =
          attempt < RETRY_DELAYS_MS.length
            ? RETRY_DELAYS_MS[attempt]
            : RETRY_DELAY_CAP_MS;
        retryAttemptRef.current = attempt + 1;
        if (retryTimeoutRef.current !== null) {
          window.clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = window.setTimeout(() => {
          retryTimeoutRef.current = null;
          void performSubmit(pendingSub);
        }, delay);
      }
    },
    [applyState, clearPendingInternal, handleInvalidSession]
  );

  // Bootstrap — runs once. Cached state (if any) is already on screen via
  // the lazy useState initializers above, so this just validates/refreshes
  // it in the background and resumes any submission that never got a
  // definitive answer before the app was last closed.
  useEffect(() => {
    const existingToken = tokenRef.current;
    if (!existingToken) {
      setLoading(false);
      return;
    }

    const existingPending = pendingRef.current;
    if (existingPending) {
      retryAttemptRef.current = 0;
      void performSubmit(existingPending);
    }

    void (async () => {
      try {
        const res = await api.leaderState(existingToken);
        if (res.ok) {
          setConnection('online');
          applyState(res.state);
        } else {
          handleInvalidSession();
        }
      } catch {
        setConnection(isOnline() ? 'reconnecting' : 'offline');
      } finally {
        setLoading(false);
      }
    })();
    // Intentionally runs once on mount only — join()/leave() own the
    // `token` transitions directly, and the effect below reacts to them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 7s while a session exists, plus an immediate re-check on
  // reconnect and when the tab becomes visible again — phones aggressively
  // suspend background timers, so those two events matter more than the
  // interval itself.
  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const poll = async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        const res = await api.leaderState(token);
        if (cancelled) return;
        if (res.ok) {
          setConnection('online');
          applyState(res.state);
        } else {
          handleInvalidSession();
        }
      } catch {
        if (!cancelled) setConnection(isOnline() ? 'reconnecting' : 'offline');
      } finally {
        pollInFlightRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    const onOnline = () => {
      setConnection(prev => (prev === 'online' ? prev : 'reconnecting'));
      void poll();
      const activePending = pendingRef.current;
      if (activePending) {
        if (retryTimeoutRef.current !== null) {
          window.clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        void performSubmit(activePending);
      }
    };
    const onOffline = () => setConnection('offline');
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void poll();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [token, applyState, handleInvalidSession, performSubmit]);

  const joinTribe = useCallback(
    (code: string) => {
      if (joiningRef.current) return;
      joiningRef.current = true;
      setJoining(true);
      setError(null);

      void (async () => {
        try {
          const deviceId = session.getDeviceId();
          const res = await api.join(session.normaliseCode(code), deviceId);
          if (res.ok) {
            session.setToken(res.token);
            tokenRef.current = res.token;
            setToken(res.token);
            lastRoundRef.current = null; // fresh join — no "previous round" yet
            applyState(res.state);
          } else {
            // Never clear existing state on a failed join.
            setError(res.reason);
          }
        } catch {
          setError('NETWORK');
        } finally {
          joiningRef.current = false;
          setJoining(false);
        }
      })();
    },
    [applyState]
  );

  const submit = useCallback(
    (code: string) => {
      const activeToken = tokenRef.current;
      const currentState = stateRef.current;
      if (!activeToken || !currentState || submittingRef.current) return;

      const pendingSub: PendingSubmission = {
        code: session.normaliseCode(code),
        round: currentState.game.currentRound,
        idempotencyKey: session.randomId(),
        queuedAt: new Date().toISOString(),
      };

      // Persist before the request goes out so a killed tab still has it.
      session.setPendingSubmission(pendingSub);
      pendingRef.current = pendingSub;
      setPending(pendingSub);
      retryAttemptRef.current = 0;
      submittingRef.current = true;
      setSubmitting(true);
      setLastOutcome(null);

      void performSubmit(pendingSub);
    },
    [performSubmit]
  );

  const leave = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    session.clearToken();
    tokenRef.current = null;
    setToken(null);
    stateRef.current = null;
    setState(null);
    pendingRef.current = null;
    setPending(null);
    retryAttemptRef.current = 0;
    lastRoundRef.current = null;
    submittingRef.current = false;
    setSubmitting(false);
    setLastOutcome(null);
    setError(null);
    setLoading(false);
    setConnection(isOnline() ? 'online' : 'offline');
  }, []);

  const dismissOutcome = useCallback(() => {
    setLastOutcome(null);
  }, []);

  return {
    state,
    loading,
    joining,
    submitting,
    connection,
    lastOutcome,
    pending,
    error,
    joinTribe,
    submit,
    leave,
    dismissOutcome,
  };
}
