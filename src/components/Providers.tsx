"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { Toaster } from "sonner";
import "lenis/dist/lenis.css";

/**
 * Global client providers, mounted once in the root layout:
 * - Lenis smooth scrolling (skipped entirely when the visitor prefers
 *   reduced motion — native scroll stays untouched).
 * - Sonner toasts, themed to the RiftFix dark palette.
 */
export default function Providers() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const lenis = new Lenis({ duration: 1.1, autoRaf: true });
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#0d1424",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          color: "#e6edf7",
        },
      }}
    />
  );
}
