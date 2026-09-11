import { useEffect, useState } from "react";

import { loadPrefs } from "@/lib/nexus/session";

/** True when the OS or the in-app preference asks for reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compute = () => setReduced(query.matches || loadPrefs().reduceMotion);
    compute();
    query.addEventListener("change", compute);
    window.addEventListener("nexus:prefs", compute);
    return () => {
      query.removeEventListener("change", compute);
      window.removeEventListener("nexus:prefs", compute);
    };
  }, []);

  return reduced;
}
