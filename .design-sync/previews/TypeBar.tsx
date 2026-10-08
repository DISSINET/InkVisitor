import React from "react";
import { TypeBar } from "dissinet.ddb.client";

// TypeBar is an absolutely-positioned accent bar meant to sit flush against
// the left edge of a relatively-positioned, sized row — exactly how
// EntitySearchBox and EntityDetailTab place it next to a label.
const Field: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      height: 28,
      paddingLeft: 10,
      minWidth: 160,
    }}
  >
    {children}
  </div>
);

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
);

export const Default = () => (
  <Field>
    <TypeBar entityLetter="T" />
    Council of Trent
  </Field>
);

export const EntityClassSweep = () => (
  <Row>
    <Field>
      <TypeBar entityLetter="T" noMargin width={4} />
      Council of Trent
    </Field>
    <Field>
      <TypeBar entityLetter="A" noMargin width={4} />
      to convene
    </Field>
    <Field>
      <TypeBar entityLetter="C" noMargin width={4} />
      Ecumenical council
    </Field>
    <Field>
      <TypeBar entityLetter="L" noMargin width={4} />
      Trento
    </Field>
  </Row>
);

export const Template = () => (
  <Field>
    <TypeBar entityLetter="G" isTemplate noMargin />
    Prince-bishopric (template)
  </Field>
);

export const Dimmed = () => (
  <Field>
    <TypeBar entityLetter="S" dimColor noMargin />
    Charles V convened the council
  </Field>
);

// Fields that carry no entity class fall back to a fixed color instead of an
// entity-letter lookup.
export const FixedColor = () => (
  <Field>
    <TypeBar entityLetter="" color="info" noMargin width={4} />
    unassigned field
  </Field>
);
