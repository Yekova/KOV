"use client";

import { useEffect, useState } from "react";
import type { Brand } from "@/lib/studio/brands";
import { brandSubtitle } from "./BrandInteractionPanel";

const PANEL: React.CSSProperties = {
  border: "1px solid var(--kov-border)",
  background: "rgba(8,8,9,0.72)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

// What the visitor needs to know, for as long as they need to know it.
//
// The controls show themselves once, then get out of the way. A help
// button brings them back, and the list opens the same brands as a plain
// panel for anyone who cannot or does not want to walk the room.
export function BrandGalleryHUD({
  brands,
  locked,
  nearExit,
  level,
  onExit,
  onSelect,
}: {
  brands: Brand[];
  locked: boolean;
  nearExit: boolean;
  /** Which floor the visitor is on. The building has two, and a visitor
   *  who has just come up a flight in a room with no windows has no other
   *  way to be sure which one they are standing on. */
  level: 0 | 1;
  onExit: () => void;
  onSelect: (brand: Brand) => void;
}) {
  const [showHelp, setShowHelp] = useState(true);
  const [showList, setShowList] = useState(false);

  // Shown on arrival, gone a few seconds later. Not a dismissable dialog:
  // a first-run hint that has to be closed is a first-run obstacle.
  useEffect(() => {
    if (!showHelp) return;
    const timer = setTimeout(() => setShowHelp(false), 7000);
    return () => clearTimeout(timer);
  }, [showHelp]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: "var(--z-nav)" }}>
      {/* Where you are. The studio's own HUD is hidden while a walkable
          room is mounted, so without this the visitor has left the studio
          as far as the screen is concerned. */}
      <p
        className="absolute left-6 top-24 font-mono"
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: "var(--kov-steel)",
        }}
      >
        P04 <span style={{ color: "var(--kov-bone)" }}>Brands Gallery</span>
        <span aria-hidden="true" style={{ opacity: 0.35 }}> · </span>
        <span style={{ color: "var(--kov-bone)" }}>Niveau {level}</span>
      </p>

      {/* The reticle. One pixel of intent: in a pointer-locked room there
          is no cursor, and without a mark the visitor cannot tell what
          they are pointing at. */}
      {locked && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2"
          style={{
            width: 5,
            height: 5,
            marginLeft: -2.5,
            marginTop: -2.5,
            borderRadius: 999,
            background: "rgba(245,243,239,0.55)",
          }}
        />
      )}

      {/* Click to take the pointer. Shown only while it is not held, so it
          never covers the room once the visitor is walking. */}
      {!locked && !showList && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            className="px-5 py-3 font-mono"
            style={{
              ...PANEL,
              borderRadius: "var(--radius-pill)",
              fontSize: 10,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--kov-bone)",
            }}
          >
            Cliquez pour explorer
          </p>
        </div>
      )}

      {showHelp && (
        <div className="absolute inset-x-0 bottom-24 flex justify-center px-6">
          <div
            className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 px-5 py-3 font-mono"
            style={{
              ...PANEL,
              borderRadius: "var(--radius-pill)",
              fontSize: 9.5,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--kov-steel)",
            }}
          >
            <span>
              <b style={{ color: "var(--kov-bone)", fontWeight: 500 }}>ZQSD / WASD / ↑↓←→</b> se déplacer
            </span>
            <span>
              <b style={{ color: "var(--kov-bone)", fontWeight: 500 }}>Souris</b> regarder
            </span>
            <span>
              <b style={{ color: "var(--kov-bone)", fontWeight: 500 }}>E</b> découvrir
            </span>
            <span>
              <b style={{ color: "var(--kov-bone)", fontWeight: 500 }}>Escalier</b> niveau 1
            </span>
            <span>
              <b style={{ color: "var(--kov-bone)", fontWeight: 500 }}>Échap</b> libérer le curseur
            </span>
          </div>
        </div>
      )}

      {/* Standing in the doorway. The offer, not an automatic exit — the
          visitor decides when they are done. */}
      {nearExit && !showList && (
        <div className="absolute inset-x-0 bottom-40 flex justify-center">
          <button
            type="button"
            onClick={onExit}
            className="pointer-events-auto px-5 py-3 font-mono"
            style={{
              ...PANEL,
              borderRadius: "var(--radius-pill)",
              borderColor: "rgba(227,30,36,0.5)",
              fontSize: 9.5,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--kov-bone)",
              cursor: "pointer",
            }}
          >
            Retour au studio
          </button>
        </div>
      )}

      {/* Two small controls, bottom right, out of the walking line. */}
      <div className="absolute right-6 bottom-24 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setShowHelp((value) => !value)}
          className="pointer-events-auto px-3 py-2 font-mono"
          style={{
            ...PANEL,
            borderRadius: "var(--radius-pill)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--kov-steel)",
            cursor: "pointer",
          }}
        >
          Commandes
        </button>
        {/* The whole room, as a list. Nothing here is reachable only by
            walking — §26, and the right default regardless: a visitor on a
            trackpad, or one who simply does not want to walk, still gets
            every brand. */}
        <button
          type="button"
          onClick={() => setShowList(true)}
          className="pointer-events-auto px-3 py-2 font-mono"
          style={{
            ...PANEL,
            borderRadius: "var(--radius-pill)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--kov-steel)",
            cursor: "pointer",
          }}
        >
          Explorer en liste
        </button>
        {/* Always there, not only when standing in the doorway. Walking
            back across a seventeen-metre room to find the way out is a
            room holding someone hostage; the doorway prompt stays as the
            diegetic version of the same thing. */}
        <button
          type="button"
          onClick={onExit}
          className="pointer-events-auto px-3 py-2 font-mono"
          style={{
            ...PANEL,
            borderRadius: "var(--radius-pill)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--kov-steel)",
            cursor: "pointer",
          }}
        >
          Quitter la salle
        </button>
      </div>

      {showList && (
        <div
          className="pointer-events-auto absolute inset-0 flex items-center justify-center p-6"
          style={{ background: "rgba(6,6,7,0.82)", backdropFilter: "blur(14px)" }}
        >
          <div
            className="w-full max-w-lg p-6"
            style={{ ...PANEL, borderRadius: "var(--radius-glass)", maxHeight: "72vh", overflowY: "auto" }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <p
                className="font-mono"
                style={{ fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--kov-red)" }}
              >
                Les marques
              </p>
              <button
                type="button"
                onClick={() => setShowList(false)}
                className="font-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--kov-steel)",
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>

            {brands.length === 0 ? (
              // No "aucune marque". The room is the offer; the list says
              // what the room is for.
              <p className="mt-6 text-sm leading-relaxed" style={{ color: "var(--kov-concrete)" }}>
                Les emplacements de la galerie sont disponibles. Chacun est une position construite dans la salle —
                un socle, une lumière, un mur — et non une ligne dans une liste de partenaires.
              </p>
            ) : (
              <ul className="mt-5" style={{ listStyle: "none" }}>
                {brands.map((brand) => (
                  <li key={brand.id} style={{ borderTop: "1px solid var(--kov-border)" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowList(false);
                        onSelect(brand);
                      }}
                      className="w-full flex items-baseline justify-between gap-4 py-4 text-left"
                      style={{ cursor: "pointer" }}
                    >
                      <span style={{ fontSize: 15, color: "var(--kov-bone)" }}>{brand.name}</span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "var(--kov-steel)",
                        }}
                      >
                        {brandSubtitle(brand)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
