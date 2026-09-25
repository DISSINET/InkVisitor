import React from "react";
import { ElvlButtonGroup, EntityEnums } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

// The interpretive level is picked most often once a statement leaves the
// text-only reading, so it is the canonical selection to show at rest.
export const Default = () => (
  <ElvlButtonGroup value={EntityEnums.Elvl.Interpretive} onChange={() => {}} />
);

export const ValueSweep = () => (
  <Row>
    <ElvlButtonGroup value={EntityEnums.Elvl.Textual} onChange={() => {}} />
    <ElvlButtonGroup value={EntityEnums.Elvl.Interpretive} onChange={() => {}} />
    <ElvlButtonGroup value={EntityEnums.Elvl.Inferential} onChange={() => {}} />
  </Row>
);

export const Border = () => (
  <ElvlButtonGroup border value={EntityEnums.Elvl.Textual} onChange={() => {}} />
);

export const SharpCorners = () => (
  <ElvlButtonGroup sharpCorners value={EntityEnums.Elvl.Inferential} onChange={() => {}} />
);

export const Disabled = () => (
  <ElvlButtonGroup disabled value={EntityEnums.Elvl.Interpretive} onChange={() => {}} />
);

// The warning ring prompts the user to pick an epistemic level before saving.
export const Warning = () => (
  <ElvlButtonGroup warning value={EntityEnums.Elvl.Textual} onChange={() => {}} />
);
