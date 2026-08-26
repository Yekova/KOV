"use client";

import { GlobalMenuButton } from "@/components/layout/GlobalMenuButton";
import { useGlobalMenu } from "@/components/layout/GlobalMenuContext";

// Thin client wrapper so HeroScene (a server component) can render the
// "contained" GlobalMenuButton without itself needing to call the
// useGlobalMenu() hook — same reasoning as any other small client island.
export function HeroGlobalMenuButton() {
  const { open, toggle } = useGlobalMenu();
  return <GlobalMenuButton variant="contained" open={open} onToggle={toggle} />;
}
