"use client";

import { useSyncExternalStore } from "react";

// L'heure, en grand et presque effacée.
//
// ── POURQUOI useSyncExternalStore ────────────────────────────────────
//
// L'heure est un état EXTERNE : elle avance sans que React le sache. La
// recopier dans un useState mis à jour depuis un effet est ce que le
// compilateur React refuse (« Avoid calling setState() directly within an
// effect »), et ce serait doublement faux ici — le serveur rendrait une
// heure, le navigateur en rendrait une autre une seconde plus tard, et
// React signalerait un désaccord d'hydratation.
//
// getServerSnapshot rend donc `null` : côté serveur, il n'y a pas d'heure
// locale à afficher. Le HTML sort sans, et le navigateur la pose après
// l'hydratation. Un chiffre qui apparaît une frame plus tard est
// invisible ; une heure fausse ne l'est pas.
//
// ── LA MINUTE, PAS LA SECONDE ────────────────────────────────────────
//
// L'instantané est arrondi à la minute. getSnapshot doit rendre une valeur
// STABLE entre deux appels — React l'appelle plusieurs fois par rendu — et
// un Date.now() brut provoquerait une boucle de rendus infinie. Le tic est
// à quinze secondes pour que le changement de minute ne se voie pas
// attendre.

let currentMinute = minuteOf(Date.now());
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function minuteOf(ms: number): number {
  return Math.floor(ms / 60_000);
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);

  if (!timer) {
    timer = setInterval(() => {
      const next = minuteOf(Date.now());
      if (next === currentMinute) return;
      currentMinute = next;
      for (const listener of listeners) listener();
    }, 15_000);
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  return currentMinute;
}

function getServerSnapshot(): number | null {
  return null;
}

export function LiveClock({ className = "" }: { className?: string }) {
  const minute = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (minute === null) return null;

  const label = new Date(minute * 60_000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <span
      // aria-hidden : l'heure est un ornement. Un lecteur d'écran qui
      // l'annonce au milieu du titre de la page dit « Bonjour Mattéo
      // quatorze trente-deux », ce qui n'aide personne — et l'heure est
      // déjà dans la barre du système.
      aria-hidden="true"
      className={`font-display tabular-nums select-none ${className}`}
      style={{
        fontSize: "clamp(64px, 11vw, 168px)",
        lineHeight: 0.8,
        letterSpacing: "-0.02em",
        color: "var(--kov-bone)",
        opacity: 0.07,
      }}
    >
      {label}
    </span>
  );
}
