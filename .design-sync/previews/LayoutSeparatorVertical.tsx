import React from "react";
import { Box, LayoutSeparatorVertical, Panel } from "dissinet.ddb.client";

// The separator paints its own x-position via a CSS variable set on itself, so
// it only needs a positioned ancestor with a real height to drag across — it
// does not need the shared panel-width variable the real layout writes drags
// to. Two Panels in a relative row, with separatorXPosition lined up to the
// first Panel's width, reproduces the tree/statements split from MainPage.
const Stage: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "relative", display: "flex", width: 640, height: 320 }}>
    {children}
  </div>
);

export const Default = () => (
  <Stage>
    <Panel width={260}>
      <Box label="Territories" height={320}>
        <div style={{ padding: 8 }}>Council of Trent</div>
      </Box>
    </Panel>
    <Panel width={380}>
      <Box label="Statements" height={320}>
        <div style={{ padding: 8 }}>1545–1563, Session XXII</div>
      </Box>
    </Panel>
    <LayoutSeparatorVertical
      separatorXPosition={260}
      resolveDrag={(x) => x}
      setSeparatorXPosition={() => {}}
    />
  </Stage>
);

export const WideTree = () => (
  <Stage>
    <Panel width={420}>
      <Box label="Territories" height={320}>
        <div style={{ padding: 8 }}>Third Period (1562–1563)</div>
      </Box>
    </Panel>
    <Panel width={220}>
      <Box label="Statements" height={320}>
        <div style={{ padding: 8 }}>Statements</div>
      </Box>
    </Panel>
    <LayoutSeparatorVertical
      separatorXPosition={420}
      resolveDrag={(x) => x}
      setSeparatorXPosition={() => {}}
    />
  </Stage>
);

export const NarrowTree = () => (
  <Stage>
    <Panel width={140}>
      <Box label="Territories" height={320}>
        <div style={{ padding: 8 }}>Trento</div>
      </Box>
    </Panel>
    <Panel width={500}>
      <Box label="Statements" height={320}>
        <div style={{ padding: 8 }}>Charles V summoned the estates of the empire.</div>
      </Box>
    </Panel>
    <LayoutSeparatorVertical
      separatorXPosition={140}
      resolveDrag={(x) => x}
      setSeparatorXPosition={() => {}}
    />
  </Stage>
);
