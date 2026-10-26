import React from "react";
import { LogicButtonGroup, EntityEnums } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => (
  <LogicButtonGroup value={EntityEnums.Logic.Positive} onChange={() => {}} />
);

// Positive/negative flips the assertion under a statement's identification —
// "Charles V" attended vs. did not attend the council.
export const ValueSweep = () => (
  <Row>
    <LogicButtonGroup value={EntityEnums.Logic.Positive} onChange={() => {}} />
    <LogicButtonGroup value={EntityEnums.Logic.Negative} onChange={() => {}} />
  </Row>
);

export const Border = () => (
  <LogicButtonGroup border value={EntityEnums.Logic.Negative} onChange={() => {}} />
);

export const Disabled = () => (
  <LogicButtonGroup disabled value={EntityEnums.Logic.Positive} onChange={() => {}} />
);
