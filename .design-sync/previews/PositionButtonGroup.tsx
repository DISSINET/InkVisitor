import React from "react";
import { PositionButtonGroup, EntityEnums } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

// Actant1 is the most common grammatical position an actant takes in a
// statement, so it is the canonical selection.
export const Default = () => (
  <PositionButtonGroup value={EntityEnums.Position.Actant1} onChange={() => {}} />
);

export const ValueSweep = () => (
  <Row>
    <PositionButtonGroup value={EntityEnums.Position.Subject} onChange={() => {}} />
    <PositionButtonGroup value={EntityEnums.Position.Actant1} onChange={() => {}} />
    <PositionButtonGroup value={EntityEnums.Position.Actant2} onChange={() => {}} />
    <PositionButtonGroup value={EntityEnums.Position.PseudoActant} onChange={() => {}} />
  </Row>
);

export const Border = () => (
  <PositionButtonGroup border value={EntityEnums.Position.Subject} onChange={() => {}} />
);

export const Disabled = () => (
  <PositionButtonGroup disabled value={EntityEnums.Position.Actant2} onChange={() => {}} />
);
