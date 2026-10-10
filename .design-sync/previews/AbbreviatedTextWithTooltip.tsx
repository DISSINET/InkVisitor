import React from "react";
import { AbbreviatedTextWithTooltip, theme } from "dissinet.ddb.client";

// The tooltip only opens from the component's own onMouseEnter (no `visible`
// prop of its own), and the capture harness never moves a real pointer. This
// fires a genuine bubbling `mouseover` at the rendered DOM node right after
// mount — the same native event React's onMouseEnter delegation listens for.
// The component fetches the full anchor text once the tooltip is open and the
// hover has held for 500ms; that fetch has no backend here, so the tooltip
// falls back to the `text` prop it was already given, same as it would while
// the fetch is still in flight for a real reader.
const HoverOpen: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const target = containerRef.current?.firstElementChild as HTMLElement | null;
    if (!target) return;
    const raf = requestAnimationFrame(() => {
      target.dispatchEvent(
        new MouseEvent("mouseover", { bubbles: true, cancelable: true, relatedTarget: null })
      );
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={containerRef} style={{ display: "inline-block" }}>
      {children}
    </div>
  );
};

// column width a "used in documents" table cell would give this
const ColumnWidth: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 240, border: `1px solid ${theme.color.grey}`, padding: 8 }}>{children}</div>
);

export const Truncated = () => (
  <ColumnWidth>
    <AbbreviatedTextWithTooltip
      text="On the authority of General Councils and their relation to the See of Rome, as debated in session VI"
      documentId="doc-trent-acta"
      entityId="ent-session-vi"
      anchorIndex={0}
    />
  </ColumnWidth>
);

export const ShortText = () => (
  <ColumnWidth>
    <AbbreviatedTextWithTooltip
      text="Charles V"
      documentId="doc-trent-acta"
      entityId="ent-charles-v"
      anchorIndex={2}
    />
  </ColumnWidth>
);

export const OpenTooltip = () => (
  <ColumnWidth>
    <HoverOpen>
      <AbbreviatedTextWithTooltip
        text="Concerning justification, decreed in the sixth session, 13 January 1547"
        documentId="doc-trent-acta"
        entityId="ent-justification-decree"
        anchorIndex={5}
      />
    </HoverOpen>
  </ColumnWidth>
);
