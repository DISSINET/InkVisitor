import React, { useEffect, useState } from "react";

/** How often the figure is redrawn. */
const TICK_MS = 250;

interface ElapsedSeconds {
  /** Epoch milliseconds the count runs from. */
  since: number;
}

/**
 * The seconds a request has been running, counted here and nowhere above.
 *
 * The figure changes four times a second, so the clock is this component's own
 * state: held by the page, every tick would re-render everything the page and
 * the modals open over it hold.
 */
export const ElapsedSeconds: React.FC<ElapsedSeconds> = ({ since }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [since]);

  return <>{(Math.max(0, now - since) / 1000).toFixed(1)}s</>;
};
