"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KovCTA } from "@/components/ui/KovCTA";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BADGE_CODE, CLICKS_REQUIRED, isBadgeUnlocked } from "@/lib/easterEgg";
import { BadgeStill } from "./BadgeStill";
import "./BadgePage.css";

// The lanyard drags in a physics engine compiled to WebAssembly — around 2 MB
// of JavaScript once its WASM is inlined. Loading it lazily, with ssr:false,
// keeps every byte of it inside this route's own chunk: nothing on the rest
// of the site pays for an easter egg, and the module never runs during a
// server render, where neither WebGL nor a canvas exists.
const Lanyard = dynamic(() => import("./Lanyard"), {
  ssr: false,
  loading: () => <div className="kov-badge-stage" aria-hidden="true" />,
});

// The unlock flag is external state that React does not own, so it is read
// the way external state should be. getServerSnapshot returns false, which
// means the server and the first client render agree on "locked" and React
// never reports a mismatch — and a visitor arriving from the nav is a client
// navigation, mounting fresh, so they land on the unlocked view directly
// without a flash of the locked one.
const subscribeUnlock = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};
const lockedOnServer = () => false;

export function BadgeReveal() {
  const unlocked = useSyncExternalStore(subscribeUnlock, isBadgeUnlocked, lockedOnServer);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  if (!unlocked) return <LockedView />;

  return (
    <div className="kov-badge-page">
      <div className="kov-badge-copy">
        <p className="kov-badge-eyebrow">
          <span aria-hidden="true" className="kov-badge-eyebrow__dot" />
          Accès débloqué
        </p>

        <h1 className="kov-badge-title">
          Vous avez insisté<span className="text-kov-red">.</span>
        </h1>

        <p className="kov-badge-lede">
          Cinq clics sur un logo, et vous voilà sur une page que rien ne référence. Ça se récompense :{" "}
          <strong>−10 % sur votre site web ou sur votre audit</strong>.
        </p>

        <p className="kov-badge-lede">
          Donnez-nous ce code quand vous nous écrivez, on l&apos;applique sur le devis.
        </p>

        <CodeBlock />

        <div className="kov-badge-actions">
          <KovCTA href="/contact" flat emphasis>
            Démarrer un projet
          </KovCTA>
          <Button href="/" variant="ghost">
            Retour au site
          </Button>
        </div>

        {!reducedMotion && <p className="kov-badge-hint">Attrapez le badge — il se balance.</p>}
      </div>

      <div className="kov-badge-stage">
        {reducedMotion ? <BadgeStill /> : <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />}
      </div>
    </div>
  );
}

function CodeBlock() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    // The code is selectable text either way (user-select: all on the value),
    // so a browser that refuses clipboard access costs the visitor a
    // keystroke, not the offer.
    void navigator.clipboard
      ?.writeText(BADGE_CODE)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  }, []);

  return (
    <div className="kov-badge-code">
      <span className="kov-badge-code__value">{BADGE_CODE}</span>
      <button type="button" onClick={copy} className="kov-badge-code__copy">
        {copied ? <Check size={13} strokeWidth={2} aria-hidden="true" /> : <Copy size={13} strokeWidth={2} aria-hidden="true" />}
        {copied ? "Copié" : "Copier"}
      </button>
    </div>
  );
}

// Typing the address is not finding it. The locked view keeps the game alive
// rather than handing the reward to anyone who guessed a URL — and it says
// enough that someone who got here by accident can still go and earn it.
function LockedView() {
  return (
    <div className="kov-badge-locked">
      <div className="kov-badge-copy">
        <p className="kov-badge-eyebrow">
          <span aria-hidden="true" className="kov-badge-eyebrow__dot" />
          Page verrouillée
        </p>

        <h1 className="kov-badge-title">Presque<span className="text-kov-red">.</span></h1>

        <p className="kov-badge-lede">
          Cette page ne s&apos;ouvre pas en tapant son adresse. Elle s&apos;ouvre depuis n&apos;importe où sur le
          site : le logo KOV, en haut à gauche. {CLICKS_REQUIRED} fois, sans traîner.
        </p>

        <div className="kov-badge-actions">
          <Button href="/" variant="ghost">
            Retour au site
          </Button>
        </div>
      </div>
    </div>
  );
}
