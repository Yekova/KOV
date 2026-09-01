"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

export function BrowserTTSPlayer({ text }: { text: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // "speechSynthesis" in window can only be checked client-side, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function pickFrenchVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang.startsWith("fr")) ?? voices[0] ?? null;
  }

  function handleToggle() {
    if (!isSupported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(stripHtml(text));
    const voice = pickFrenchVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "fr-FR";
    utterance.rate = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-4 p-4" style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-md)" }}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isSpeaking ? "Arrêter la lecture" : "Écouter l'article"}
        className="w-10 h-10 flex items-center justify-center shrink-0 transition-colors"
        style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
      >
        {isSpeaking ? <Square size={14} strokeWidth={1.5} color="var(--kov-white)" /> : <Play size={16} strokeWidth={1.5} color="var(--kov-white)" />}
      </button>

      <div className="flex items-center gap-1 flex-1">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: isSpeaking ? `${8 + ((i * 37) % 20)}px` : "4px",
              background: isSpeaking ? "var(--kov-red)" : "var(--kov-border)",
              transition: "height 0.3s ease",
              animation: isSpeaking ? `kov-tts-bar 0.8s ease-in-out ${i * 0.05}s infinite alternate` : "none",
            }}
          />
        ))}
      </div>

      <span className="text-kov-steel text-xs whitespace-nowrap">Synthèse vocale</span>

      <style>{`
        @keyframes kov-tts-bar {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
