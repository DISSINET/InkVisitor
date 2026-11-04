import { Tooltip } from "components";
import React, { useEffect, useState } from "react";

/**
 * The page's one hover hint, drawn with the app's own tooltip.
 *
 * An element asks for a hint with `data-hint="text"` where it would have used
 * the browser's `title`. The browser's version cannot be placed, waits its own
 * time, is never shown on touch or to keyboard focus, and sits over any other
 * tooltip opened beside it; this one is the same card the rest of the app draws.
 *
 * One listener on the document rather than a wrapper around every control, so a
 * hint adds nothing to the element that carries it — no extra box to disturb a
 * flex row, no handlers to compose — and the text is read when the hint opens,
 * so one that changes while the page is open is always current. A line break in
 * the text is a line break in the card.
 */

const SELECTOR = "[data-hint]";

const hintOwner = (node: EventTarget | null): HTMLElement | null =>
  node instanceof Element ? node.closest<HTMLElement>(SELECTOR) : null;

export const HintLayer: React.FC = () => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const show = (event: Event) => {
      const owner = hintOwner(event.target);
      if (!owner) {
        return;
      }
      setText(owner.dataset.hint ?? "");
      setAnchor(owner);
    };
    const hide = (event: Event) => {
      const owner = hintOwner(event.target);
      const next = hintOwner((event as MouseEvent | FocusEvent).relatedTarget);
      // moving between the children of one owner is staying on it
      if (owner && owner !== next) {
        setAnchor((current) => (current === owner ? null : current));
      }
    };
    const dismiss = () => setAnchor(null);

    document.addEventListener("pointerover", show);
    document.addEventListener("pointerout", hide);
    document.addEventListener("focusin", show);
    document.addEventListener("focusout", hide);
    // a press is the reader acting on the control, and a scroll moves it out
    // from under a hint that would otherwise stay where it was
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerover", show);
      document.removeEventListener("pointerout", hide);
      document.removeEventListener("focusin", show);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("scroll", dismiss, true);
    };
  }, []);

  // an element removed while its hint is open takes the hint with it
  useEffect(() => {
    if (anchor && !anchor.isConnected) {
      setAnchor(null);
    }
  });

  const lines = text.split("\n").filter(Boolean);
  return (
    <Tooltip
      visible={!!anchor && lines.length > 0}
      referenceElement={anchor}
      position="bottom"
      content={
        lines.length ? (
          <>
            {lines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </>
        ) : undefined
      }
    />
  );
};
