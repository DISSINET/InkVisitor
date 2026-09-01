import React from "react";
import { IcoAddCircle, IcoExchange, IcoTrash, IconWithTooltip, theme } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
    {children}
  </div>
);

// The tooltip only opens from the wrapper's own onMouseEnter, and the
// capture harness never moves a real pointer, so this fires a genuine
// bubbling `mouseover` at the icon's rendered DOM node right after mount —
// the same native event React's onMouseEnter delegation listens for.
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
    <div ref={containerRef} style={{ display: "inline-block", padding: 20 }}>
      {children}
    </div>
  );
};

// Used to mark audit-log rows for a Statement, e.g. edits to Council of Trent, session XXV.
export const AuditLogRow = () => (
  <Row>
    <IconWithTooltip icon={<IcoAddCircle />} tooltipLabel="created" color="success" />
    <IconWithTooltip icon={<IcoExchange />} tooltipLabel="edited" color="info" />
    <IconWithTooltip icon={<IcoTrash />} tooltipLabel="deleted" color="danger" />
  </Row>
);

export const OpenTooltip = () => (
  <HoverOpen>
    <IconWithTooltip icon={<IcoExchange />} tooltipLabel="Statement edited by owner on 14 Mar 1563" color="info" />
  </HoverOpen>
);

export const RichTooltipContent = () => (
  <HoverOpen>
    <IconWithTooltip
      icon={<IcoAddCircle />}
      color="success"
      tooltipColor="success"
      tooltipContent={
        <div>
          <b>Entity created</b>
          <p style={{ margin: "4px 0 0" }}>Council of Trent — added by owner, 13 Dec 1545.</p>
        </div>
      }
    />
  </HoverOpen>
);

export const FullWidth = () => (
  <div style={{ width: 260, border: `1px dashed ${theme.color.grey}`, padding: 8 }}>
    <IconWithTooltip icon={<IcoExchange />} tooltipLabel="edited" fullWidth color="black" />
  </div>
);
