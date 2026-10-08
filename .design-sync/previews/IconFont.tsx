import React from "react";
import { IconFont, theme } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    {children}
  </div>
);

// IconFont draws a filled square glyph with the letter overlaid — it has no
// color prop of its own, so a bare instance renders black-on-black (the
// square and StyledText both default to their SVG/theme.color.white
// baseline against a white card). Every real call site wraps it in a colored
// ancestor (e.g. the position-button glyphs), so this reproduces that.
const Chip: React.FC<{ children?: React.ReactNode; color?: string }> = ({
  children,
  color = theme.color.primary,
}) => (
  <div style={{ color, display: "inline-flex" }}>{children}</div>
);

// The valency-position glyphs (Subject / Actant1 / Actant2 / Pseudo-Actant)
// this is actually used for, in PositionButtonGroup.
export const PositionLetters = () => (
  <Row>
    <Chip>
      <IconFont letter="S" />
    </Chip>
    <Chip>
      <IconFont letter="A1" />
    </Chip>
    <Chip>
      <IconFont letter="A2" />
    </Chip>
    <Chip>
      <IconFont letter="PA" />
    </Chip>
  </Row>
);

export const Sizes = () => (
  <Row>
    <Chip color={theme.color.info}>
      <IconFont letter="T" size={12} />
    </Chip>
    <Chip color={theme.color.info}>
      <IconFont letter="T" size={20} />
    </Chip>
    <Chip color={theme.color.info}>
      <IconFont letter="T" size={32} />
    </Chip>
  </Row>
);

export const Colors = () => (
  <Row>
    <Chip color={theme.color.success}>
      <IconFont letter="A" size={22} />
    </Chip>
    <Chip color={theme.color.danger}>
      <IconFont letter="R" size={22} />
    </Chip>
    <Chip color={theme.color.warning}>
      <IconFont letter="C" size={22} />
    </Chip>
  </Row>
);
