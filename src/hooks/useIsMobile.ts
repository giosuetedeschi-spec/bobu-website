"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 640px)";
const FORCE_DESKTOP_KEY = "bobuos-force-desktop";

/**
 * Returns true when the viewport is phone-sized AND the user hasn't opted into
 * the full desktop experience via localStorage.
 *
 * SSR/hydration-safe: always returns false on the server and on the first client
 * render (no viewport is known yet), then re-evaluates in an effect after mount.
 * The desktop OS is therefore the default and mobile is a post-mount switch.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    // A user who explicitly asked for BobuOS on this device always gets it.
    // isMobile already defaults to false, so we simply skip subscribing.
    if (window.localStorage?.getItem(FORCE_DESKTOP_KEY) === "1") {
      return;
    }

    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();

    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export { FORCE_DESKTOP_KEY };
