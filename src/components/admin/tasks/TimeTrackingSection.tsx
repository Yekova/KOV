"use client";

import { useState, useTransition } from "react";
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

      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => (runningTimerId ? stopTimer(runningTimerId) : startTimer(taskId)))}
        className="text-xs uppercase tracking-widest px-3 py-2 border mb-4 disabled:opacity-50"
        style={{
          borderColor: runningTimerId ? "var(--kov-red)" : "var(--kov-border)",
          color: runningTimerId ? "var(--kov-red)" : "var(--kov-bone)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        {runningTimerId ? "Arrêter le chronomètre" : "Démarrer le chronomètre"}
      </button>

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
