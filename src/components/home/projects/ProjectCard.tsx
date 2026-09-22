"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { isExternalHref, type Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

// An off-white card on the section's black field. The contrast is the whole
// point: these are the only light objects on the page at this scroll depth,
// which is what makes six of them read as one set.
export function ProjectCard({ project }: ProjectCardProps) {
  // Hover is the card's own business now. It used to be lifted into the
  // parent so a card could light its line to the hub; with no hub there is
  // nothing to coordinate, and local state beats threading three props
  // through for an effect that never leaves this element.
  const [hovered, setHovered] = useState(false);
  const reserved = project.status === "upcoming";
  const invitation = project.status === "invitation";

  const inner = (
    <div
      className="group relative flex flex-col h-full overflow-hidden transition-[transform,box-shadow,opacity] duration-300 ease-out"
      style={{
        borderRadius: 22,
        background: reserved || invitation ? "rgba(20,20,22,0.72)" : "#f5f3ef",
        border: reserved || invitation ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.8)",
        boxShadow: hovered
          ? "0 28px 64px rgba(0,0,0,0.34), inset 1px 1px 0 rgba(255,255,255,0.6)"
          : "0 20px 50px rgba(0,0,0,0.22), inset 1px 1px 0 rgba(255,255,255,0.45)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      <div className="flex items-start justify-between gap-3 shrink-0" style={{ padding: "16px 18px 12px" }}>
        <div className="min-w-0">
          <p
            className="font-mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.12em",
              fontVariantNumeric: "tabular-nums",
              color: reserved || invitation ? "rgba(231,231,229,0.45)" : "rgba(17,18,23,0.42)",
            }}
          >
            {project.id}
          </p>
          <p
            className="truncate"
            style={{
              marginTop: 4,
              fontSize: 23,
              fontWeight: 600,
              lineHeight: 1.15,
              color: reserved || invitation ? "var(--kov-bone)" : "#111217",
            }}
          >
            {project.name}
          </p>
          <p
            className="truncate"
            style={{
              marginTop: 7,
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: reserved || invitation ? "rgba(231,231,229,0.42)" : "rgba(17,18,23,0.45)",
            }}
          >
            {project.tags.join("  /  ")}
          </p>
        </div>

        {/* Red only on the arrow of the card being read — the accent marks
            attention, it doesn't decorate every card at rest. */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          aria-hidden="true"
          className="shrink-0 transition-colors duration-300"
          style={{
            marginTop: 2,
            stroke: hovered
              ? "var(--kov-red)"
              : reserved || invitation
                ? "rgba(231,231,229,0.5)"
                : "rgba(17,18,23,0.5)",
          }}
        >
          {project.href ? (
            <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          )}
        </svg>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden" style={{ margin: "0 12px 12px", borderRadius: 14 }}>
        {project.image ? (
          <Image
            src={project.image}
            alt={`${project.name} — ${project.category}`}
            fill
            sizes="(max-width: 1024px) 90vw, 320px"
            className="object-cover transition-transform duration-500 ease-out"
            style={{ transform: hovered ? "scale(1.02)" : "scale(1)" }}
          />
        ) : (
          // No fabricated preview. A reserved panel that says what it is.
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: invitation
                ? "radial-gradient(120% 90% at 50% 120%, rgba(227,30,36,0.24), rgba(12,12,13,0.9) 62%)"
                : "linear-gradient(160deg, rgba(38,38,42,0.85), rgba(12,12,13,0.92))",
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: invitation ? "var(--kov-red)" : "rgba(231,231,229,0.38)",
              }}
            >
              {invitation ? "Démarrer" : "Bientôt"}
            </span>
          </div>
        )}

        {project.tagline && (
          <span
            className="absolute left-0 right-0 bottom-0 px-3 pt-8 pb-2.5"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#f5f3ef",
              background: "linear-gradient(180deg, transparent, rgba(8,8,9,0.82))",
            }}
          >
            {project.tagline}
          </span>
        )}
      </div>
    </div>
  );

  const shell = (
    <div
      className="h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {inner}
    </div>
  );

  // A card is a link only where a real page exists. The ones without a
  // destination stay inert rather than pointing somewhere that isn't there.
  if (!project.href) return shell;

  const className = "block h-full rounded-[22px] focus-visible:outline-2 focus-visible:outline-offset-4";
  const style = { outlineColor: "var(--kov-red)" };

  // A client's own site is not this site.
  //
  // The whole tile is the link — it cannot hold a nested button, and a
  // second interactive element inside a link is not a thing to add — so
  // the distinction lives in the link itself: a real destination opens in
  // its own tab, and the accessible name says so before the click rather
  // than after it. Without this, clicking a homepage card silently took
  // the visitor off the homepage, which is the opposite of what a project
  // grid is for.
  if (isExternalHref(project.href)) {
    return (
      <a
        href={project.href}
        target="_blank"
        // The destination is another origin; noopener keeps it from
        // reaching back through window.opener.
        rel="noopener noreferrer"
        className={className}
        style={style}
        aria-label={`${project.name} — ${project.category} (nouvel onglet)`}
      >
        {shell}
      </a>
    );
  }

  return (
    <Link href={project.href} className={className} style={style} aria-label={`${project.name} — ${project.category}`}>
      {shell}
    </Link>
  );
}
