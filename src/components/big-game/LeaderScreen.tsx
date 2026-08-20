// The Wilderness: Big Game — the tribe-leader mobile screen.
//
// One screen, no navigation. A leader reaches this page with nothing but a
// paper join code, on whatever phone is in their pocket and whatever Wi-Fi
// the camp has that hour. All the hard logic lives in useBigGameLeader() —
// this file only decides which of the six states to paint and how to lay
// it out.

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Compass,
  Flag,
  Hourglass,
  Loader2,
  LogOut,
  PauseCircle,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import FinaleLeader from './FinaleLeader';
import { bigGameStrings, type BigGameStrings } from '../../lib/bigGame/strings';
import {
  useBigGameLeader,
  type JoinErrorReason,
} from '../../hooks/useBigGameLeader';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type {
  GameSummary,
  LeaderStation,
  LeaderTribe,
  RoundResultStatus,
  SubmitOutcome,
} from '../../lib/bigGame/types';

// Shared classes for the two "enter a code" inputs — large, high contrast,
// and always LTR since the printed codes are Latin even in Arabic mode.
const CODE_INPUT_CLASSES =
  'min-h-[56px] text-left text-2xl font-bold tracking-[0.2em]';

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

function Shell({
  isRTL,
  chip,
  showLeave,
  onLeave,
  leaveLabel,
  children,
}: {
  isRTL: boolean;
  chip: ReactNode;
  showLeave: boolean;
  onLeave?: () => void;
  leaveLabel?: string;
  children: ReactNode;
}) {
  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="flex min-h-screen w-full flex-col bg-[var(--gradient-app-bg)]"
    >
      {chip}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
      {showLeave && onLeave && (
        <div className="flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onLeave}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-md px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {leaveLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectionChip({
  icon: Icon,
  spinning,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  spinning: boolean;
  label: string;
  tone: 'warning' | 'danger';
}) {
  return (
    <div className="flex w-full justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div
        role="status"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm ${
          tone === 'danger'
            ? 'bg-[var(--color-danger)]'
            : 'bg-[var(--color-warning)]'
        }`}
      >
        <Icon
          className={
            spinning
              ? 'h-3.5 w-3.5 motion-safe:animate-spin motion-reduce:animate-none'
              : 'h-3.5 w-3.5'
          }
        />
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A — Not joined
// ---------------------------------------------------------------------------

function JoinScreen({
  strings,
  joining,
  error,
  onJoin,
}: {
  strings: BigGameStrings;
  joining: boolean;
  error: JoinErrorReason | null;
  onJoin: (code: string) => void;
}) {
  const [code, setCode] = useState('');

  const errorText =
    error === 'INVALID'
      ? strings.joinInvalid
      : error === 'THROTTLED'
        ? strings.joinThrottled
        : error === 'NETWORK'
          ? strings.offline
          : null;

  return (
    <div className="text-center">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {strings.gameTitle}
      </p>
      <h1 className="mb-3 text-2xl font-black text-[var(--color-text)]">
        {strings.joinTitle}
      </h1>
      <p className="mb-6 text-base text-[var(--color-text-muted)]">
        {strings.joinIntro}
      </p>

      <form
        onSubmit={e => {
          e.preventDefault();
          if (code.trim() && !joining) onJoin(code);
        }}
        className="space-y-4"
      >
        <Input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={strings.joinPlaceholder}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          dir="ltr"
          disabled={joining}
          aria-label={strings.joinPlaceholder}
          className={CODE_INPUT_CLASSES}
        />
        {errorText && (
          <p
            role="alert"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--color-danger)]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {errorText}
          </p>
        )}
        <Button
          type="submit"
          variant="mobile-primary"
          fullWidth
          loading={joining}
          disabled={joining || !code.trim()}
        >
          {strings.joinButton}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// B — Waiting for start (SETUP)
// ---------------------------------------------------------------------------

function WaitingScreen({
  strings,
  tribe,
}: {
  strings: BigGameStrings;
  tribe: LeaderTribe;
}) {
  return (
    <div className="text-center">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {strings.gameTitle}
      </p>
      <p className="mb-8 text-lg font-bold text-[var(--color-text)]">
        {strings.tribeLabel.toUpperCase()}: {tribe.displayName} —{' '}
        {tribe.parentTeam}
      </p>
      <Hourglass
        className="mx-auto mb-6 h-14 w-14 text-[var(--color-primary)]"
        aria-hidden="true"
      />
      <h1 className="mb-3 text-2xl font-black text-[var(--color-text)]">
        {strings.waitingTitle}
      </h1>
      <p className="text-base text-[var(--color-text-muted)]">
        {strings.waitingBody}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C — Active round, not completed
// ---------------------------------------------------------------------------

function ActiveRoundScreen({
  strings,
  tribe,
  game,
  station,
  submitting,
  lastOutcome,
  onDismissOutcome,
  onSubmit,
}: {
  strings: BigGameStrings;
  tribe: LeaderTribe;
  game: GameSummary;
  station: LeaderStation | null;
  submitting: boolean;
  lastOutcome: SubmitOutcome | null;
  onDismissOutcome: () => void;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState('');

  // A round change means this input's contents no longer refer to anything.
  useEffect(() => {
    setCode('');
  }, [game.currentRound]);

  const feedback =
    lastOutcome === 'INCORRECT'
      ? { text: strings.incorrect, tone: 'danger' as const }
      : lastOutcome === 'THROTTLED'
        ? { text: strings.throttled, tone: 'warning' as const }
        : lastOutcome === 'NOT_STARTED'
          ? { text: strings.notStarted, tone: 'warning' as const }
          : null;

  // The server guarantees a station once ACTIVE and not yet completed; this
  // is only a defensive fallback for a stale/in-between render.
  if (!station) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2
          className="h-8 w-8 text-[var(--color-primary)] motion-safe:animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {strings.gameTitle}
      </p>
      <p className="mb-1 text-center text-sm font-semibold text-[var(--color-text)]">
        {strings.tribeLabel.toUpperCase()}: {tribe.displayName} —{' '}
        {tribe.parentTeam}
      </p>
      <p className="mb-6 text-center text-sm text-[var(--color-text-muted)]">
        {strings.roundLabel.toUpperCase()}: {game.currentRound}{' '}
        {strings.ofRounds} {game.roundCount}
      </p>

      <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-5 text-center shadow-sm">
        <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
          <Compass className="h-4 w-4" aria-hidden="true" />
          {strings.currentDestination}
        </p>
        <h1 className="mb-2 break-words text-3xl font-black leading-tight text-[var(--color-text)] sm:text-4xl">
          {station.name}
        </h1>
        <p className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">
          {strings.stationLabel} {station.id} · {station.location}
        </p>
        {station.shortDescription && (
          <p className="mb-2 text-base text-[var(--color-text)]">
            {station.shortDescription}
          </p>
        )}
        {station.instructions && (
          <p className="text-sm text-[var(--color-text-muted)]">
            {station.instructions}
          </p>
        )}
      </div>

      <p className="mb-4 text-center text-sm text-[var(--color-text-muted)]">
        {strings.stationInstructionsHint}
      </p>

      <form
        onSubmit={e => {
          e.preventDefault();
          if (code.trim() && !submitting) onSubmit(code);
        }}
        className="space-y-3"
      >
        <Input
          value={code}
          onChange={e => {
            setCode(e.target.value);
            if (lastOutcome) onDismissOutcome();
          }}
          placeholder={strings.codePlaceholder}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          dir="ltr"
          disabled={submitting}
          aria-label={strings.codePlaceholder}
          className={CODE_INPUT_CLASSES}
        />
        {feedback && (
          <p
            role="alert"
            className={`flex items-center justify-center gap-1.5 text-sm font-medium ${
              feedback.tone === 'danger'
                ? 'text-[var(--color-danger)]'
                : 'text-[var(--color-warning)]'
            }`}
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {feedback.text}
          </p>
        )}
        <Button
          type="submit"
          variant="mobile-primary"
          fullWidth
          loading={submitting}
          disabled={submitting || !code.trim()}
        >
          {submitting ? strings.submitting : strings.submitButton}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// D — Round completed, waiting
// ---------------------------------------------------------------------------

function CompletedRoundScreen({
  strings,
  tribe,
  game,
  roundStatus,
  currentStation,
  nextStation,
}: {
  strings: BigGameStrings;
  tribe: LeaderTribe;
  game: GameSummary;
  roundStatus: RoundResultStatus | null;
  currentStation: LeaderStation | null;
  nextStation: LeaderStation | null;
}) {
  const missed = roundStatus === 'MISSED';

  return (
    <div className="text-center">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {strings.gameTitle}
      </p>
      <p className="mb-1 text-sm font-semibold text-[var(--color-text)]">
        {strings.tribeLabel.toUpperCase()}: {tribe.displayName} —{' '}
        {tribe.parentTeam}
      </p>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        {strings.roundLabel.toUpperCase()}: {game.currentRound}{' '}
        {strings.ofRounds} {game.roundCount}
      </p>

      {missed ? (
        <AlertCircle
          className="mx-auto mb-4 h-16 w-16 text-[var(--color-warning)]"
          aria-hidden="true"
        />
      ) : (
        <CheckCircle2
          className="mx-auto mb-4 h-16 w-16 text-[var(--color-accent)]"
          aria-hidden="true"
        />
      )}

      <h1 className="mb-3 text-2xl font-black text-[var(--color-text)]">
        {strings.completeTitle.toUpperCase()}
      </h1>

      {missed ? (
        <p className="text-base text-[var(--color-text)]">
          {strings.missedNotice}
        </p>
      ) : (
        <>
          {currentStation && (
            <p className="mb-2 text-lg font-semibold text-[var(--color-text)]">
              {currentStation.name} — {strings.clearedSuffix}
            </p>
          )}
          <p className="text-base text-[var(--color-text-muted)]">
            {strings.completeBody}
          </p>
          <p className="mt-4 rounded-xl border border-[var(--color-primary)] bg-[var(--color-bg-muted)] px-4 py-3 text-base font-semibold text-[var(--color-text)]">
            {strings.stoneCardReminder}
          </p>
        </>
      )}

      {nextStation && (
        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-4 shadow-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            {strings.nextDestination}
          </p>
          <p className="text-xl font-black text-[var(--color-text)]">
            {nextStation.name}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// E — Paused
// ---------------------------------------------------------------------------

function PausedScreen({
  strings,
  tribe,
}: {
  strings: BigGameStrings;
  tribe: LeaderTribe;
}) {
  return (
    <div className="text-center">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {strings.gameTitle}
      </p>
      <p className="mb-8 text-sm font-semibold text-[var(--color-text)]">
        {strings.tribeLabel.toUpperCase()}: {tribe.displayName} —{' '}
        {tribe.parentTeam}
      </p>
      <PauseCircle
        className="mx-auto mb-4 h-16 w-16 text-[var(--color-warning)]"
        aria-hidden="true"
      />
      <h1 className="mb-3 text-2xl font-black text-[var(--color-text)]">
        {strings.pausedTitle}
      </h1>
      <p className="text-base text-[var(--color-text-muted)]">
        {strings.pausedBody}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// F — Journey complete (FINISHED)
// ---------------------------------------------------------------------------

function FinishedScreen({
  strings,
  tribe,
  game,
  completedCount,
}: {
  strings: BigGameStrings;
  tribe: LeaderTribe;
  game: GameSummary;
  completedCount: number;
}) {
  const finishedTime = game.finishedAt
    ? new Date(game.finishedAt).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="text-center">
      <Flag
        className="mx-auto mb-4 h-16 w-16 text-[var(--color-primary)]"
        aria-hidden="true"
      />
      <h1 className="mb-2 text-3xl font-black text-[var(--color-text)]">
        {strings.finishedTitle.toUpperCase()}
      </h1>
      <p className="mb-6 text-base text-[var(--color-text-muted)]">
        {strings.finishedBody}
      </p>

      <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-5 shadow-sm">
        <p className="text-xl font-black text-[var(--color-text)]">
          {tribe.displayName}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {tribe.parentTeam}
        </p>
        <p className="pt-2 text-base font-semibold text-[var(--color-text)]">
          {strings.stationsCompleted}: {completedCount} / {game.roundCount}
        </p>
        {finishedTime && (
          <p className="text-sm text-[var(--color-text-muted)]">
            {strings.finishedAt} {finishedTime}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function LeaderScreen() {
  const { language, isRTL } = useLanguage();
  const strings = bigGameStrings(language);
  const {
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
  } = useBigGameLeader();

  let chip: ReactNode = null;
  if (pending !== null && connection !== 'online') {
    chip = (
      <ConnectionChip
        icon={RefreshCw}
        spinning
        label={strings.offlineQueued}
        tone="warning"
      />
    );
  } else if (connection === 'reconnecting') {
    chip = (
      <ConnectionChip
        icon={RefreshCw}
        spinning
        label={strings.reconnecting}
        tone="warning"
      />
    );
  } else if (connection === 'offline') {
    chip = (
      <ConnectionChip
        icon={WifiOff}
        spinning={false}
        label={strings.offline}
        tone="danger"
      />
    );
  }

  if (loading) {
    return (
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="flex min-h-screen w-full items-center justify-center bg-[var(--gradient-app-bg)] px-4"
      >
        <div role="status" aria-label={strings.gameTitle}>
          <Loader2
            className="h-10 w-10 text-[var(--color-primary)] motion-safe:animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <Shell isRTL={isRTL} chip={chip} showLeave={false}>
        <JoinScreen
          strings={strings}
          joining={joining}
          error={error}
          onJoin={joinTribe}
        />
      </Shell>
    );
  }

  const { game, tribe } = state;

  let body: ReactNode;
  if (game.status === 'FINALE') {
    body = <FinaleLeader state={state} />;
  } else if (game.status === 'SETUP') {
    body = <WaitingScreen strings={strings} tribe={tribe} />;
  } else if (game.status === 'PAUSED') {
    body = <PausedScreen strings={strings} tribe={tribe} />;
  } else if (game.status === 'FINISHED') {
    body = (
      <FinishedScreen
        strings={strings}
        tribe={tribe}
        game={game}
        completedCount={state.completedCount}
      />
    );
  } else if (state.currentRoundCompleted) {
    body = (
      <CompletedRoundScreen
        strings={strings}
        tribe={tribe}
        game={game}
        roundStatus={state.currentRoundStatus}
        currentStation={state.currentStation}
        nextStation={state.nextStation}
      />
    );
  } else {
    body = (
      <ActiveRoundScreen
        strings={strings}
        tribe={tribe}
        game={game}
        station={state.currentStation}
        submitting={submitting}
        lastOutcome={lastOutcome}
        onDismissOutcome={dismissOutcome}
        onSubmit={submit}
      />
    );
  }

  return (
    <Shell
      isRTL={isRTL}
      chip={chip}
      showLeave
      onLeave={leave}
      leaveLabel={strings.leaveTribe}
    >
      {lastOutcome === 'ROUND_CHANGED' && (
        <div
          role="status"
          className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-glow)] px-4 py-3 text-center text-sm font-medium text-[var(--color-text)]"
        >
          <RefreshCw
            className="h-4 w-4 shrink-0 text-[var(--color-accent)]"
            aria-hidden="true"
          />
          {strings.roundMovedOn}
        </div>
      )}
      {body}

      {game.status !== 'SETUP' && game.status !== 'FINISHED' && (
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          {state.hintsRemaining > 0
            ? `${strings.hintsRemaining}: ${state.hintsRemaining}`
            : strings.hintsNone}
        </p>
      )}
    </Shell>
  );
}
