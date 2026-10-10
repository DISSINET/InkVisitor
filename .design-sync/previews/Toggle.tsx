import React from "react";
import { Toggle } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => <Toggle value={true} onChange={() => {}} />;

export const States = () => (
  <Row>
    <Toggle value={true} onChange={() => {}} />
    <Toggle value={false} onChange={() => {}} />
  </Row>
);

export const CustomLabels = () => (
  <Row>
    <Toggle value={true} activeLabel="published" inactiveLabel="draft" onChange={() => {}} />
    <Toggle value={false} activeLabel="published" inactiveLabel="draft" onChange={() => {}} />
  </Row>
);

export const HiddenLabelsAndSizes = () => (
  <Row>
    <Toggle value={true} hideLabels size={16} onChange={() => {}} />
    <Toggle value={true} hideLabels size={28} onChange={() => {}} />
  </Row>
);
