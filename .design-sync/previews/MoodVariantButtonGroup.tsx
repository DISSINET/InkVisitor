import React from "react";
import { MoodVariantButtonGroup, EntityEnums } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => (
  <MoodVariantButtonGroup value={EntityEnums.MoodVariant.Realis} onChange={() => {}} />
);

export const ValueSweep = () => (
  <Row>
    <MoodVariantButtonGroup value={EntityEnums.MoodVariant.Realis} onChange={() => {}} />
    <MoodVariantButtonGroup value={EntityEnums.MoodVariant.Irrealis} onChange={() => {}} />
    <MoodVariantButtonGroup value={EntityEnums.MoodVariant.ToBeDecided} onChange={() => {}} />
  </Row>
);

export const Border = () => (
  <MoodVariantButtonGroup border value={EntityEnums.MoodVariant.Irrealis} onChange={() => {}} />
);

export const Disabled = () => (
  <MoodVariantButtonGroup
    disabled
    value={EntityEnums.MoodVariant.ToBeDecided}
    onChange={() => {}}
  />
);
