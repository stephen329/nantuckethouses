"use client";

import { useLayoutEffect } from "react";

const HTML_CLASS = "map-route";
const BODY_CLASS = "map-route";

/**
 * Locks document scroll and coordinates with globals.css (footer hidden, main flex).
 * Mount only under `/map` layout.
 */
export function MapRouteEffects() {
  useLayoutEffect(() => {
    document.documentElement.classList.add(HTML_CLASS);
    document.body.classList.add(BODY_CLASS);
    return () => {
      document.documentElement.classList.remove(HTML_CLASS);
      document.body.classList.remove(BODY_CLASS);
    };
  }, []);

  return null;
}
