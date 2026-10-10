import React from "react";
import { WarningIcon, theme } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}>
    {children}
  </div>
);

// WarningIcon opens its own Tooltip from internal hover state (no `visible`
// prop of its own), and the capture harness never moves a real pointer. This
// wrapper fires a genuine bubbling `mouseover` at the icon's rendered DOM
// node right after mount, which is exactly the native event React's
// onMouseEnter delegation listens for — so the tooltip opens for real rather
// than being redrawn as a lookalike.
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
    <div ref={containerRef} style={{ display: "inline-block", padding: 24 }}>
      {children}
    </div>
  );
};

export const WithCode = () => (
  <Row>
    <WarningIcon type="MA" />
    <WarningIcon type="TVEP" />
    <WarningIcon type="ISYNC" />
  </Row>
);

export const NoCode = () => (
  <Row>
    <WarningIcon type="SCLM" showCode={false} />
    <WarningIcon type="AVAL" showCode={false} />
  </Row>
);

// The label + description tooltip, forced open — MA is one of the few
// validation types whose dict entry carries real description text.
export const OpenTooltip = () => (
  <HoverOpen>
    <WarningIcon type="MA" />
  </HoverOpen>
);

export const Large = () => (
  <Row>
    <WarningIcon type="DM" size={32} />
  </Row>
);
