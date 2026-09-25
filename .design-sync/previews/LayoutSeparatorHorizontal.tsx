import React from "react";
import { Box, LayoutSeparatorHorizontal } from "dissinet.ddb.client";

// The separator paints its own y-position via a CSS variable set on itself, so
// it only needs a positioned ancestor to sit on top of — it does not need the
// panel-width / box-height variables the real layout drives it with. Stacking
// two Boxes in a relative column and lining separatorYPosition up with the
// first Box's height reproduces the app's detail/annotator split exactly.
const Stage: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "relative", width: 460, height: 400, display: "flex", flexDirection: "column" }}>
    {children}
  </div>
);

export const Default = () => (
  <Stage>
    <Box label="Statements" height={220}>
      <div style={{ padding: 8 }}>1. The council shall convene at Trento...</div>
    </Box>
    <Box label="Annotator" height={180}>
      <div style={{ padding: 8 }}>Selected text: "convene at Trento"</div>
    </Box>
    <LayoutSeparatorHorizontal
      topPositionMin={40}
      topPositionMax={360}
      separatorYPosition={220}
      setSeparatorYPosition={() => {}}
    />
  </Stage>
);

export const StatementsExpanded = () => (
  <Stage>
    <Box label="Statements" height={320}>
      <div style={{ padding: 8 }}>Charles V summoned the estates of the empire.</div>
    </Box>
    <Box label="Annotator" height={80}>
      <div style={{ padding: 8 }}>Annotator</div>
    </Box>
    <LayoutSeparatorHorizontal
      topPositionMin={40}
      topPositionMax={360}
      separatorYPosition={320}
      setSeparatorYPosition={() => {}}
    />
  </Stage>
);

export const AnnotatorExpanded = () => (
  <Stage>
    <Box label="Statements" height={100}>
      <div style={{ padding: 8 }}>Statements</div>
    </Box>
    <Box label="Annotator" height={300}>
      <div style={{ padding: 8 }}>Session XXII, canon on the Eucharist.</div>
    </Box>
    <LayoutSeparatorHorizontal
      topPositionMin={40}
      topPositionMax={360}
      separatorYPosition={100}
      setSeparatorYPosition={() => {}}
    />
  </Stage>
);
