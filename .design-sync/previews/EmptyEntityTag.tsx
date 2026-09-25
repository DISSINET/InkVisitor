import React from "react";
import { EmptyEntityTag } from "dissinet.ddb.client";

// Placeholder for a slot that has no entity assigned yet — the class chip
// shows "X" (no class) and the label renders in italics.
const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => <EmptyEntityTag label="no entity assigned" />;

export const LabelSweep = () => (
  <Row>
    <EmptyEntityTag label="territory" />
    <EmptyEntityTag label="actant 1" />
    <EmptyEntityTag label="no entity assigned" />
  </Row>
);
