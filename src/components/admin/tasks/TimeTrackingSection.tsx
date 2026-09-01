"use client";

import { useEffect, useState, useTransition } from "react";
import { startTimer, stopTimer, addManualTimeEntry, deleteTimeEntry } from "@/app/admin/tasks/actions";

type TimeEntry = {
  id: string;
  userId: string;
  userName: string;
  startedAt: string;
  endedAt: string | null;
  minutes: number | null;
  note: string | null;
};

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Ticks once a second while a timer is running, purely for display — the
// actual duration is computed server-side (from started_at) when the timer
// stops, this is never what gets persisted.
function useLiveElapsed(startedAt: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;
  return formatElapsed(now - new Date(startedAt).getTime());
}

export function TimeTrackingSection({
  taskId,
  entries,
  runningTimerId,
  estimatedMinutes,
  onChange,
}: {
  taskId: string;
  entries: TimeEntry[];
  runningTimerId: string | null;
  estimatedMinutes: number | null;
  onChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualNote, setManualNote] = useState("");

  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes ?? 0), 0);
  const runningEntry = runningTimerId ? entries.find((e) => e.id === runningTimerId) : undefined;
  const liveElapsed = useLiveElapsed(runningEntry?.startedAt ?? null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        onChange();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'action a échoué.");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Suivi du temps</p>
        <span className="text-kov-steel text-xs">
          {formatMinutes(totalMinutes)}
          {estimatedMinutes ? ` / ${formatMinutes(estimatedMinutes)} estimées` : ""}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          disabled={isPending}
          aria-label={runningTimerId ? "Arrêter le chronomètre" : "Démarrer le chronomètre"}
          onClick={() => run(() => (runningTimerId ? stopTimer(runningTimerId) : startTimer(taskId)))}
          className="w-9 h-9 flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
          style={{ background: runningTimerId ? "var(--kov-red)" : "var(--kov-graphite)", borderRadius: "var(--radius-pill)" }}
        >
          {runningTimerId ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--kov-white)">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--kov-bone)">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>
        {liveElapsed ? (
          <span className="font-display text-kov-bone text-lg tabular-nums">{liveElapsed}</span>
        ) : (
          <span className="text-kov-steel text-xs uppercase tracking-widest">Démarrer le chronomètre</span>
        )}
      </div>

      {error && <p className="text-kov-red text-xs mb-2">{error}</p>}

      {entries.length > 0 && (
        <ul className="space-y-2 mb-4">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-2 text-sm group">
              <div className="min-w-0">
                <span className="text-kov-bone">{entry.userName}</span>
                <span className="text-kov-steel ml-2">
                  {entry.minutes !== null ? formatMinutes(entry.minutes) : "en cours…"}
                  {entry.note ? ` — ${entry.note}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => run(() => deleteTimeEntry(entry.id))}
                className="text-kov-steel hover:text-kov-red text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={manualMinutes}
          onChange={(e) => setManualMinutes(e.target.value)}
          placeholder="Minutes"
          disabled={isPending}
          className="w-24 bg-transparent border px-3 py-1.5 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--kov-border)" }}
        />
        <input
          value={manualNote}
          onChange={(e) => setManualNote(e.target.value)}
          placeholder="Note (facultatif)"
          disabled={isPending}
          className="flex-1 bg-transparent border px-3 py-1.5 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--kov-border)" }}
        />
        <button
          type="button"
          disabled={isPending || !manualMinutes}
          onClick={() => {
            const minutes = Number(manualMinutes);
            setManualMinutes("");
            setManualNote("");
            run(() => addManualTimeEntry(taskId, minutes, manualNote.trim() || null));
          }}
          className="text-kov-red text-xs uppercase tracking-widest disabled:opacity-40 shrink-0"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
