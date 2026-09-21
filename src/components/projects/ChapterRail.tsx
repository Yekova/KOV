"use client";

import { useEffect, useState } from "react";

export interface Chapter {
  id: string;
  label: string;
}

// Where you are in the page, and a way to jump.
//
// A scrollspy rather than a scroll position: the observer's root margin
// collapses the viewport to a single line across its middle, so exactly one
// chapter is ever intersecting and "which chapter am I in" needs no
// arithmetic and no scroll listener.
//
// The dots are real links. A progress indicator that cannot be used is
// decoration, and four full-screen chapters is exactly the situation where
// someone wants to skip one.
//
// Hidden below 1024px, where the chapters are not full screen either.
export function ChapterRail({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sections.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        }
      },
      // A zero-height band across the middle of the viewport.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [chapters]);

  return (
    <nav className="kov-rail" aria-label="Chapitres">
      <span aria-hidden="true" className="kov-rail__num">
        {String(active + 1).padStart(2, "0")}
      </span>

      <ol className="kov-rail__list">
        {chapters.map((chapter, index) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              className={`kov-rail__dot${index === active ? " is-active" : ""}`}
              aria-current={index === active ? "true" : undefined}
            >
              <span className="sr-only">{chapter.label}</span>
            </a>
          </li>
        ))}
      </ol>

      <span aria-hidden="true" className="kov-rail__total">
        {String(chapters.length).padStart(2, "0")}
      </span>
    </nav>
  );
}
