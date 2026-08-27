"use client";

import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 40;

// Shared by Nav and GlobalMenuButton: both need to know when the page has
// scrolled far enough that their "contained" variant (absolute, nested
// inside HeroScene) should switch to viewport-fixed instead of scrolling
// away with the Hero section like any other absolutely-positioned content.
export function useScrolled(threshold = SCROLL_THRESHOLD) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > threshold);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
}
