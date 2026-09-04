"use client";

import { Component, type ReactNode } from "react";

interface StudioErrorBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

interface StudioErrorBoundaryState {
  hasError: boolean;
}

// A crash anywhere inside the R3F tree (a bad prop, a texture the GPU
// rejects, anything) previously failed silently from the visitor's point
// of view — the canvas just stayed on its default opaque-black clear
// color with no way for anyone, including us, to know a crash was the
// cause rather than a rendering/config issue. This surfaces it: logs the
// real error to the console in dev, and hands control back to
// StudioExperience to show the existing "impossible de charger" screen
// instead of a silent black canvas either way.
export class StudioErrorBoundary extends Component<StudioErrorBoundaryProps, StudioErrorBoundaryState> {
  state: StudioErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Studio] render error inside the 3D scene:", error);
    }
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
