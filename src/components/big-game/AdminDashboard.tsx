// The Wilderness: Big Game — game director's live dashboard.
//
// This is the one screen a director actually runs the event from: it reads
// through useBigGameAdmin (poll + wrapped actions), and every state-changing
// control here confirms before it fires — a mistimed tap on "Reset tribe"
// mid-round is not something the physical event can undo. Modals below are
// built on the site's own surfaces (card/border/text tokens), not a dialog
// library, per the no-new-dependency rule for this feature.

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
  Copy,
  Download,
  Eye,
  FastForward,
  Flag,
  FlaskConical,
  Gauge,
  Loader2,
  MapPin,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Settings2,
  SkipForward,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import useBigGameAdmin from '../../hooks/useBigGameAdmin';
import type {
  AdminTribeRow,
  AdvancePreview,
  AuditEntry,
  BigGameStatus,
  ExportRow,
  RoundResultStatus,
  SelfTestResult,
} from '../../lib/bigGame/types';

type IconComponent = typeof Gauge;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'No activity yet';
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (deltaMs < 10_000) return 'just now';
  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleString();
}

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildExportCsv(rows: ExportRow[]): string {
  const header = [
    'Tribe',
    'Team',
    'Round',
    'Station',
    'Status',
    'Submitted code',
    'Completed at',
    'Overridden by',
  ];
  const lines = rows.map(row =>
    [
      row.tribeDisplayName,
      row.parentTeam,
      String(row.round),
      row.stationName,
      row.status,
      row.submittedCode ?? '',
      row.completedAt ?? '',
      row.overriddenBy ?? '',
    ]
      .map(escapeCsvField)
      .join(',')
  );
  return [header.map(escapeCsvField).join(','), ...lines].join('\r\n');
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Audit `detail` payloads are server-controlled and free-form. Station codes
// must never render outside CodeSheet, so any key that looks code-shaped is
// redacted here rather than trusted to be safe to print.
function redactDetail(
  detail: Record<string, unknown>
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(detail)) {
    redacted[key] = /code/i.test(key) ? '••••' : value;
  }
  return redacted;
}

// ---------------------------------------------------------------------------
// Status presentation
// ---------------------------------------------------------------------------

const GAME_STATUS_META: Record<
  BigGameStatus,
  { label: string; icon: IconComponent; className: string }
> = {
  SETUP: {
    label: 'Setup',
    icon: Settings2,
    className:
      'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  },
  ACTIVE: {
    label: 'Active',
    icon: Radio,
    className:
      'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  },
  PAUSED: {
    label: 'Paused',
    icon: Pause,
    className:
      'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  FINALE: {
    label: 'Finale',
    icon: Radio,
    className:
      'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  },
  FINISHED: {
    label: 'Finished',
    icon: Flag,
    className:
      'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  },
};

function StatusBadge({ status }: { status: BigGameStatus }) {
  const meta = GAME_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${meta.className}`}
    >
      <Icon className="h-4 w-4" />
      {meta.label}
    </span>
  );
}

const ROUND_STATUS_META: Record<
  RoundResultStatus,
  { label: string; className: string }
> = {
  CLEAR: {
    label: 'Clear',
    className:
      'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  },
  PARTIAL: {
    label: 'Partial',
    className:
      'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  FAIL: {
    label: 'Fail',
    className:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600',
  },
  MISSED: {
    label: 'Missed',
    className:
      'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  },
};

function RoundStatusPill({ status }: { status: RoundResultStatus | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <Clock className="h-3 w-3" />
        In progress
      </span>
    );
  }
  const meta = ROUND_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Shared modal shell — built on site surfaces, no dialog library
// ---------------------------------------------------------------------------

function Modal({
  title,
  onClose,
  children,
  widthClassName = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${widthClassName} max-h-[85vh] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 shadow-lg`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] active:opacity-70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  emphasize = false,
}: {
  label: string;
  value: string;
  icon: IconComponent;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        emphasize
          ? 'border-[var(--color-primary)] bg-[var(--color-bg-muted)]'
          : 'border-[var(--color-border)] bg-[var(--color-bg-muted)]'
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        className={`mt-1 font-black text-[var(--color-text)] ${emphasize ? 'text-4xl' : 'text-2xl'}`}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row-level confirmations: manual-complete, skip, reset one tribe
// ---------------------------------------------------------------------------

type RowActionKind = 'override' | 'skip' | 'reset';

const ROW_ACTION_META: Record<
  RowActionKind,
  {
    title: string;
    confirmLabel: string;
    variant: 'primary' | 'danger';
    body: (tribe: AdminTribeRow) => string;
  }
> = {
  override: {
    title: 'Manual-complete this station?',
    confirmLabel: 'Mark complete',
    variant: 'primary',
    body: tribe =>
      `Marks ${tribe.displayName}'s current station complete without a code — for dead phones and disputes. Recorded as an override in the audit log.`,
  },
  skip: {
    title: 'Skip this station?',
    confirmLabel: 'Skip station',
    variant: 'primary',
    body: tribe =>
      `${tribe.displayName} moves on without completing this station. Skipped stations do not count toward their completed total.`,
  },
  reset: {
    title: 'Reset this tribe?',
    confirmLabel: 'Reset tribe',
    variant: 'danger',
    body: tribe =>
      `Wipes ${tribe.displayName}'s progress back to the start of the game. This cannot be undone from this screen.`,
  },
};

// ---------------------------------------------------------------------------
// Advance-round confirmation
// ---------------------------------------------------------------------------

function AdvanceConfirmModal({
  preview,
  busy,
  onCancel,
  onConfirm,
}: {
  preview: AdvancePreview;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const pendingCount = preview.pendingTribes.length;
  return (
    <Modal title="Advance round?" onClose={onCancel} widthClassName="max-w-md">
      <div className="space-y-4">
        {pendingCount > 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>
                {pendingCount} tribe{pendingCount === 1 ? '' : 's'}
              </strong>{' '}
              {pendingCount === 1 ? 'has' : 'have'} not finished this round —{' '}
              {pendingCount === 1 ? 'it' : 'they'} will be marked{' '}
              <strong>missed</strong>:{' '}
              {preview.pendingTribes.map(t => t.displayName).join(', ')}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>All tribes have finished this round.</p>
          </div>
        )}

        {preview.willFinish ? (
          <p className="text-sm font-semibold text-[var(--color-danger)]">
            This is the last round — advancing will end the game.
          </p>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            Moving to round {preview.nextRound ?? preview.currentRound + 1}.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={onConfirm}>
            {preview.willFinish ? 'End the game' : 'Advance round'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Reset-all: type-to-confirm, then a second explicit confirmation
// ---------------------------------------------------------------------------

function ResetAllModal({
  status,
  busy,
  onCancel,
  onConfirm,
}: {
  status: BigGameStatus;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (confirmation: string, force: boolean) => void;
}) {
  const [text, setText] = useState('');
  const [force, setForce] = useState(false);
  const [stage, setStage] = useState<'type' | 'confirm'>('type');
  const requiresForce = status === 'ACTIVE' || status === 'PAUSED';
  const canProceed = text === 'RESET' && (!requiresForce || force);

  return (
    <Modal
      title="Reset all progress"
      onClose={onCancel}
      widthClassName="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>
            This wipes every tribe's progress for the whole game. It cannot be
            undone from this screen.
          </p>
        </div>

        {stage === 'type' ? (
          <>
            <div>
              <label
                htmlFor="reset-all-confirm"
                className="mb-1 block text-sm font-medium text-[var(--color-text)]"
              >
                Type <span className="font-mono font-bold">RESET</span> to
                continue
              </label>
              <input
                id="reset-all-confirm"
                value={text}
                onChange={event => setText(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              />
            </div>

            {requiresForce && (
              <label className="flex items-start gap-2 text-sm text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={event => setForce(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)]"
                />
                <span>
                  The game is currently{' '}
                  {status === 'ACTIVE' ? 'active' : 'paused'}. I understand this
                  resets a game in progress and want to force it.
                </span>
              </label>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={!canProceed}
                onClick={() => setStage('confirm')}
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text)]">
              Last check — this sets every tribe's progress back to zero. Are
              you absolutely sure?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStage('type')}>
                Back
              </Button>
              <Button
                variant="danger"
                loading={busy}
                disabled={!canProceed}
                onClick={() => onConfirm(text, force)}
              >
                Yes, reset everything
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

function AuditLogModal({
  entries,
  onClose,
}: {
  entries: AuditEntry[];
  onClose: () => void;
}) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return (
    <Modal title="Audit log" onClose={onClose} widthClassName="max-w-xl">
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
          No audit entries yet.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {sorted.map(entry => (
            <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {entry.action}
                </span>
                <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {entry.actorLabel}
              </p>
              {entry.detail && Object.keys(entry.detail).length > 0 && (
                <p className="mt-1 break-all font-mono text-xs text-[var(--color-text-muted)]">
                  {JSON.stringify(redactDetail(entry.detail))}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Self test
// ---------------------------------------------------------------------------

function SelfTestModal({
  results,
  onClose,
}: {
  results: SelfTestResult[];
  onClose: () => void;
}) {
  const passedCount = results.filter(r => r.passed).length;
  return (
    <Modal title="Self test" onClose={onClose} widthClassName="max-w-lg">
      <p className="mb-3 text-sm text-[var(--color-text-muted)]">
        {passedCount} / {results.length} checks passed.
      </p>
      {results.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
          No results.
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map(result => (
            <li
              key={result.name}
              className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                result.passed
                  ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40'
                  : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
              }`}
            >
              {result.passed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    result.passed
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {result.name}
                </p>
                {result.detail && (
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {result.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function ExportModal({
  rows,
  onClose,
}: {
  rows: ExportRow[];
  onClose: () => void;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle'
  );

  const handleCopy = async () => {
    const ok = await copyToClipboard(buildExportCsv(rows));
    setCopyState(ok ? 'copied' : 'error');
  };

  const handleDownload = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadCsv(buildExportCsv(rows), `big-game-results-${stamp}.csv`);
  };

  return (
    <Modal title="Export summary" onClose={onClose} widthClassName="max-w-md">
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        {rows.length} result row{rows.length === 1 ? '' : 's'} ready to copy or
        download as CSV.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          icon={<Copy className="h-4 w-4" />}
          onClick={() => void handleCopy()}
        >
          {copyState === 'copied' ? 'Copied!' : 'Copy to clipboard'}
        </Button>
        <Button
          variant="primary"
          icon={<Download className="h-4 w-4" />}
          onClick={handleDownload}
        >
          Download CSV
        </Button>
      </div>
      {copyState === 'error' && (
        <p className="mt-2 text-sm text-[var(--color-danger)]">
          Couldn't copy automatically — use Download instead.
        </p>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const {
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
  } = useBigGameAdmin();

  const [pendingAdvance, setPendingAdvance] = useState<AdvancePreview | null>(
    null
  );
  const [pendingRowAction, setPendingRowAction] = useState<{
    kind: RowActionKind;
    tribe: AdminTribeRow;
  } | null>(null);
  const [showResetAll, setShowResetAll] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[] | null>(null);
  const [selfTestResults, setSelfTestResults] = useState<
    SelfTestResult[] | null
  >(null);
  const [exportRows, setExportRows] = useState<ExportRow[] | null>(null);

  const status = overview?.game.status ?? 'SETUP';

  const handleAdvanceClick = async () => {
    const preview = await previewAdvance();
    if (preview) setPendingAdvance(preview);
  };

  const handleConfirmAdvance = async () => {
    const ok = await advance();
    if (ok) setPendingAdvance(null);
  };

  const handleConfirmRowAction = async () => {
    if (!pendingRowAction) return;
    const { kind, tribe } = pendingRowAction;
    const ok =
      kind === 'override'
        ? await override(tribe.id)
        : kind === 'skip'
          ? await skip(tribe.id)
          : await resetOne(tribe.id);
    if (ok) setPendingRowAction(null);
  };

  const handleResetAllConfirm = async (
    confirmation: string,
    force: boolean
  ) => {
    const ok = await resetEverything(confirmation, force);
    if (ok) setShowResetAll(false);
  };

  const handleAuditClick = async () => {
    setAuditEntries(await fetchAudit());
  };

  const handleSelfTestClick = async () => {
    setSelfTestResults(await runSelfTest());
  };

  const handleExportClick = async () => {
    setExportRows(await fetchExport());
  };

  const isTribeBusy = (tribeId: string) =>
    busy === `override:${tribeId}` ||
    busy === `skip:${tribeId}` ||
    busy === `reset:${tribeId}`;

  if (!overview && loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
        <span className="ml-3 text-[var(--color-text-muted)]">
          Loading the game board…
        </span>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/40">
        <p className="text-sm text-red-800 dark:text-red-200">
          {error ?? 'Could not load the game board.'}
        </p>
        <Button
          variant="outline"
          className="mt-3"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void refresh()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Gauge className="h-6 w-6 text-[var(--color-primary)]" />
              <h2 className="text-2xl font-bold text-[var(--color-text)]">
                Game Director
              </h2>
              <StatusBadge status={status} />
            </div>
            {error && (
              <p className="mt-2 text-xs text-[var(--color-danger)]">
                Live updates interrupted ({error}) — showing the last known
                state.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            title="Refresh now"
            aria-label="Refresh now"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] active:opacity-70"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile
            label="Round"
            value={`${overview.game.currentRound} / ${overview.game.roundCount}`}
            icon={Flag}
          />
          <StatTile
            label="Tribes done this round"
            value={`${overview.doneThisRound} / ${overview.tribeCount}`}
            icon={Users}
            emphasize
          />
          <StatTile
            label="Round elapsed"
            value={formatDuration(elapsedRoundMs)}
            icon={Clock}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
          Controls
        </h3>
        <div className="flex flex-wrap gap-2">
          {status === 'SETUP' && (
            <Button
              variant="primary"
              icon={<Play className="h-4 w-4" />}
              loading={busy === 'start'}
              onClick={() => void start()}
            >
              Start game
            </Button>
          )}

          {(status === 'ACTIVE' || status === 'PAUSED') && (
            <Button
              variant="primary"
              icon={<FastForward className="h-4 w-4" />}
              loading={busy === 'preview'}
              onClick={() => void handleAdvanceClick()}
            >
              Advance round
            </Button>
          )}

          {status === 'ACTIVE' && (
            <Button
              variant="outline"
              icon={<Pause className="h-4 w-4" />}
              loading={busy === 'pause'}
              onClick={() => void pause()}
            >
              Pause
            </Button>
          )}

          {status === 'PAUSED' && (
            <Button
              variant="primary"
              icon={<Play className="h-4 w-4" />}
              loading={busy === 'resume'}
              onClick={() => void resume()}
            >
              Resume
            </Button>
          )}

          <Button
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            loading={busy === 'export'}
            onClick={() => void handleExportClick()}
          >
            Export summary
          </Button>

          <Button
            variant="outline"
            icon={<ClipboardList className="h-4 w-4" />}
            loading={busy === 'audit'}
            onClick={() => void handleAuditClick()}
          >
            Audit log
          </Button>

          <Button
            variant="outline"
            icon={<FlaskConical className="h-4 w-4" />}
            loading={busy === 'selftest'}
            onClick={() => void handleSelfTestClick()}
          >
            Self test
          </Button>

          <Button
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setShowResetAll(true)}
          >
            Reset all progress
          </Button>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-4">
          <button
            type="button"
            role="switch"
            aria-checked={overview.game.revealNextEarly}
            disabled={busy === 'reveal'}
            onClick={() => void setReveal(!overview.game.revealNextEarly)}
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
              overview.game.revealNextEarly
                ? 'bg-[var(--color-primary)]'
                : 'bg-[var(--color-border)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                overview.game.revealNextEarly
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <Eye className="h-4 w-4" />
              Reveal next destination early
              {busy === 'reveal' && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-text-muted)]" />
              )}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              Off by default. Turning this on sends tribes drifting toward a
              station another tribe is still standing in — use only if you mean
              it.
            </p>
          </div>
        </div>
      </div>

      {/* Live board */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
          Live board
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-bg-muted)]">
              <tr>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Tribe
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Team
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Current station
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Round status
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Completed
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Last activity
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {overview.tribes.map(tribe => (
                <tr key={tribe.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-text)]">
                    {tribe.displayName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-muted)]">
                    {tribe.parentTeam}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text)]">
                    {tribe.currentStation ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                        {tribe.currentStation.id} {tribe.currentStation.name} —{' '}
                        {tribe.currentStation.location}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <RoundStatusPill status={tribe.currentRoundStatus} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text)]">
                    {tribe.completedCount} / {overview.game.roundCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-muted)]">
                    {formatRelativeTime(tribe.lastActivityAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Manual-complete — for dead phones and disputes"
                        aria-label={`Manually complete ${tribe.displayName}'s current station`}
                        disabled={isTribeBusy(tribe.id)}
                        onClick={() =>
                          setPendingRowAction({ kind: 'override', tribe })
                        }
                        className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy === `override:${tribe.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Skip station — does not count toward completed"
                        aria-label={`Skip ${tribe.displayName}'s current station`}
                        disabled={isTribeBusy(tribe.id)}
                        onClick={() =>
                          setPendingRowAction({ kind: 'skip', tribe })
                        }
                        className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy === `skip:${tribe.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SkipForward className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Reset tribe"
                        aria-label={`Reset ${tribe.displayName}'s progress`}
                        disabled={isTribeBusy(tribe.id)}
                        onClick={() =>
                          setPendingRowAction({ kind: 'reset', tribe })
                        }
                        className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-danger)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy === `reset:${tribe.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Station view */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-semibold text-[var(--color-text)]">
          Station view
        </h3>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          Who is at each station now, and who is arriving next.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-bg-muted)]">
              <tr>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Station
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Tribe now
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Tribe next
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {overview.stations.map(station => (
                <tr key={station.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[var(--color-text)]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      {station.id} {station.name}
                    </span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {station.location}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {station.active ? (
                      <RoundStatusPill status={station.currentRoundStatus} />
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text)]">
                    {station.currentTribe?.displayName ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-muted)]">
                    {station.nextTribe?.displayName ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {pendingAdvance && (
        <AdvanceConfirmModal
          preview={pendingAdvance}
          busy={busy === 'advance'}
          onCancel={() => setPendingAdvance(null)}
          onConfirm={() => void handleConfirmAdvance()}
        />
      )}

      {pendingRowAction && (
        <Modal
          title={ROW_ACTION_META[pendingRowAction.kind].title}
          onClose={() => setPendingRowAction(null)}
          widthClassName="max-w-md"
        >
          <p className="text-sm text-[var(--color-text)]">
            {ROW_ACTION_META[pendingRowAction.kind].body(
              pendingRowAction.tribe
            )}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingRowAction(null)}>
              Cancel
            </Button>
            <Button
              variant={ROW_ACTION_META[pendingRowAction.kind].variant}
              loading={isTribeBusy(pendingRowAction.tribe.id)}
              onClick={() => void handleConfirmRowAction()}
            >
              {ROW_ACTION_META[pendingRowAction.kind].confirmLabel}
            </Button>
          </div>
        </Modal>
      )}

      {showResetAll && (
        <ResetAllModal
          status={status}
          busy={busy === 'reset-all'}
          onCancel={() => setShowResetAll(false)}
          onConfirm={(confirmation, force) =>
            void handleResetAllConfirm(confirmation, force)
          }
        />
      )}

      {auditEntries && (
        <AuditLogModal
          entries={auditEntries}
          onClose={() => setAuditEntries(null)}
        />
      )}

      {selfTestResults && (
        <SelfTestModal
          results={selfTestResults}
          onClose={() => setSelfTestResults(null)}
        />
      )}

      {exportRows && (
        <ExportModal rows={exportRows} onClose={() => setExportRows(null)} />
      )}
    </div>
  );
}
